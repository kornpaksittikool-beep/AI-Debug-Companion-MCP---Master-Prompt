import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import type {
  FileContextOptions,
  FileContextResult,
  ModuleContextOptions,
  ModuleContextResult,
  RepositoryOverview,
  RepositoryScanOptions,
  RepositoryScanResult,
  RepositorySearchOptions,
  RepositorySearchResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryScannerService } from './repository-scanner.service.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const DEFAULT_CONTEXT_MAX_BYTES = 16 * 1024;
const DEFAULT_MODULE_MAX_FILES = 25;

@Injectable()
export class RepositoryIntelligenceService {
  constructor(
    private readonly scanner: RepositoryScannerService,
    private readonly safety: RepositorySafetyService,
  ) {}

  async scan(options: RepositoryScanOptions): Promise<RepositoryScanResult> {
    return this.scanner.scan(options);
  }

  async overview(options: RepositoryScanOptions): Promise<RepositoryOverview> {
    const scan = await this.scan(options);
    const extensionCounts = new Map<string, number>();

    for (const file of scan.files) {
      const extension = file.extension || '[none]';
      extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
    }

    return {
      rootPath: scan.rootPath,
      fileCount: scan.files.length,
      extensionCounts: [...extensionCounts.entries()]
        .map(([extension, count]) => ({ extension, count }))
        .sort((a, b) => b.count - a.count || a.extension.localeCompare(b.extension)),
      largestFiles: [...scan.files].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 10),
      truncated: scan.truncated,
    };
  }

  async searchFiles(options: RepositorySearchOptions): Promise<RepositorySearchResult> {
    const scan = await this.scan({
      ...options,
      includeTextPreview: Boolean(options.query),
    });
    const normalizedQuery = options.query?.toLowerCase();
    const normalizedExtension = options.extension?.startsWith('.')
      ? options.extension.toLowerCase()
      : options.extension
        ? `.${options.extension.toLowerCase()}`
        : undefined;

    const matches = scan.files.filter((file) => {
      const extensionMatches = normalizedExtension ? file.extension === normalizedExtension : true;
      const queryMatches = normalizedQuery
        ? file.relativePath.toLowerCase().includes(normalizedQuery) ||
          (file.textPreview?.toLowerCase().includes(normalizedQuery) ?? false)
        : true;

      return extensionMatches && queryMatches;
    });

    return {
      rootPath: scan.rootPath,
      matches,
      truncated: scan.truncated,
    };
  }

  async readFileContext(options: FileContextOptions): Promise<FileContextResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const filePath = this.safety.resolveInsideRoot(rootPath, options.filePath);
    const stat = await fs.stat(filePath);
    const maxBytes = options.maxBytes ?? DEFAULT_CONTEXT_MAX_BYTES;
    const content = await this.readBounded(filePath, maxBytes);

    return {
      rootPath,
      filePath,
      relativePath: this.safety.toRelative(rootPath, filePath),
      sizeBytes: stat.size,
      truncated: stat.size > maxBytes,
      content,
    };
  }

  async readModuleContext(options: ModuleContextOptions): Promise<ModuleContextResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const modulePath = this.safety.resolveInsideRoot(rootPath, options.modulePath);
    const scanOptions: RepositoryScanOptions = {
      rootPath: modulePath,
      maxFiles: options.maxFiles ?? DEFAULT_MODULE_MAX_FILES,
      maxDepth: options.maxDepth ?? 4,
      ...(options.maxFileSizeBytes ? { maxFileSizeBytes: options.maxFileSizeBytes } : {}),
    };
    const scan = await this.scan(scanOptions);

    const files = await Promise.all(
      scan.files.map((file) =>
        this.readFileContext({
          rootPath,
          filePath: file.path,
          maxBytes: options.maxFileSizeBytes ?? DEFAULT_CONTEXT_MAX_BYTES,
        }),
      ),
    );

    return {
      rootPath,
      modulePath: this.safety.toRelative(rootPath, modulePath),
      files,
      truncated: scan.truncated,
    };
  }

  private async readBounded(filePath: string, maxBytes: number): Promise<string> {
    const handle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const result = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, result.bytesRead).toString('utf8');
    } finally {
      await handle.close();
    }
  }
}
