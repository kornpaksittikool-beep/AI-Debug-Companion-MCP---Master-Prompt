import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type {
  RepositorySymbol,
  SymbolContextOptions,
  SymbolContextResult,
  SymbolSearchOptions,
  SymbolSearchResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryScannerService } from './repository-scanner.service.js';
import { RepositorySafetyService } from './repository-safety.service.js';
import { TypeScriptSymbolParserService } from './typescript-symbol-parser.service.js';

const DEFAULT_SYMBOL_MAX_FILES = 300;
const DEFAULT_SYMBOL_MAX_BYTES = 32 * 1024;

@Injectable()
export class RepositorySymbolService {
  constructor(
    private readonly scanner: RepositoryScannerService,
    private readonly safety: RepositorySafetyService,
    private readonly parser: TypeScriptSymbolParserService,
  ) {}

  async searchSymbols(options: SymbolSearchOptions): Promise<SymbolSearchResult> {
    const scan = await this.scanner.scan({
      ...options,
      maxFiles: options.maxFiles ?? DEFAULT_SYMBOL_MAX_FILES,
    });
    const normalizedQuery = options.query?.toLowerCase();
    const symbols: RepositorySymbol[] = [];

    for (const file of scan.files) {
      if (!this.parser.supportsFile(file.path)) {
        continue;
      }

      const content = await fs.readFile(file.path, 'utf8');
      symbols.push(
        ...this.parser.parseSymbols(content, file.path).map((symbol) => ({
          ...symbol,
          relativePath: this.safety.toRelative(scan.rootPath, symbol.filePath),
        })),
      );
    }

    return {
      rootPath: scan.rootPath,
      symbols: symbols.filter((symbol) => {
        const queryMatches = normalizedQuery
          ? symbol.name.toLowerCase().includes(normalizedQuery) ||
            symbol.signature.toLowerCase().includes(normalizedQuery)
          : true;
        const kindMatches = options.kind ? symbol.kind === options.kind : true;
        return queryMatches && kindMatches;
      }),
      truncated: scan.truncated,
    };
  }

  async readSymbolContext(options: SymbolContextOptions): Promise<SymbolContextResult> {
    const result = await this.searchSymbols(options);
    const symbol = result.symbols.find((candidate) => {
      const nameMatches = candidate.name === options.symbolName;
      const fileMatches = options.filePath
        ? candidate.relativePath === this.safety.toRelative(result.rootPath, this.safety.resolveInsideRoot(result.rootPath, options.filePath))
        : true;
      return nameMatches && fileMatches;
    });

    if (!symbol) {
      throw new PlatformError({
        code: 'SYMBOL_NOT_FOUND',
        message: `Symbol "${options.symbolName}" was not found.`,
        reason: 'The bounded symbol index did not contain a matching symbol.',
        suggestion: 'Check the symbol name, file path, kind, or increase bounded scan limits.',
      });
    }

    const content = await fs.readFile(symbol.filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const selected = lines.slice(symbol.startLine - 1, symbol.endLine).join('\n');
    const maxBytes = options.maxBytes ?? DEFAULT_SYMBOL_MAX_BYTES;
    const buffer = Buffer.from(selected, 'utf8');

    return {
      rootPath: result.rootPath,
      symbol,
      context: buffer.subarray(0, maxBytes).toString('utf8'),
      truncated: buffer.length > maxBytes,
    };
  }
}
