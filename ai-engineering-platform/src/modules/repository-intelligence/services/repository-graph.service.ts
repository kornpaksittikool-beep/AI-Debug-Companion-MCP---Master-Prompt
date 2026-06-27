import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  CallGraphOptions,
  CallGraphResult,
  ImportGraphOptions,
  ImportGraphResult,
  RepositoryCallEdge,
  RepositoryFile,
  RepositoryImportEdge,
  RepositoryScanOptions,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryScannerService } from './repository-scanner.service.js';
import { TypeScriptGraphParserService } from './typescript-graph-parser.service.js';

const DEFAULT_GRAPH_MAX_FILES = 400;
const RESOLUTION_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.d.ts'];
const INDEX_FILENAMES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

@Injectable()
export class RepositoryGraphService {
  constructor(
    private readonly scanner: RepositoryScannerService,
    private readonly parser: TypeScriptGraphParserService,
  ) {}

  async importGraph(options: ImportGraphOptions): Promise<ImportGraphResult> {
    const scan = await this.scanner.scan(this.withGraphDefaults(options));
    const supportedFiles = scan.files.filter((file) => this.parser.supportsFile(file.path));
    const fileSet = new Map(supportedFiles.map((file) => [path.normalize(file.path), file]));
    const edges: RepositoryImportEdge[] = [];

    for (const file of supportedFiles) {
      const content = await fs.readFile(file.path, 'utf8');
      const parsedEdges = this.parser.parseImports(content, file.path, scan.rootPath);
      edges.push(
        ...parsedEdges
          .map((edge) => this.resolveImport(edge, scan.rootPath, fileSet))
          .filter((edge) => options.includeExternal || !edge.unresolved || edge.specifier.startsWith('.')),
      );
    }

    return {
      rootPath: scan.rootPath,
      edges,
      fileCount: supportedFiles.length,
      unresolvedCount: edges.filter((edge) => edge.unresolved).length,
      truncated: scan.truncated,
    };
  }

  async callGraph(options: CallGraphOptions): Promise<CallGraphResult> {
    const scan = await this.scanner.scan(this.withGraphDefaults(options));
    const supportedFiles = scan.files.filter((file) => this.parser.supportsFile(file.path));
    const normalizedQuery = options.query?.toLowerCase();
    const edges: RepositoryCallEdge[] = [];

    for (const file of supportedFiles) {
      const content = await fs.readFile(file.path, 'utf8');
      edges.push(...this.parser.parseCalls(content, file.path, scan.rootPath));
    }

    return {
      rootPath: scan.rootPath,
      edges: normalizedQuery
        ? edges.filter(
            (edge) =>
              edge.callerName.toLowerCase().includes(normalizedQuery) ||
              edge.calleeName.toLowerCase().includes(normalizedQuery),
          )
        : edges,
      fileCount: supportedFiles.length,
      truncated: scan.truncated,
    };
  }

  async buildGraphSnapshot(options: RepositoryScanOptions): Promise<{
    readonly rootPath: string;
    readonly files: readonly RepositoryFile[];
    readonly importEdges: readonly RepositoryImportEdge[];
    readonly callEdges: readonly RepositoryCallEdge[];
    readonly truncated: boolean;
  }> {
    const scan = await this.scanner.scan(this.withGraphDefaults(options));
    const supportedFiles = scan.files.filter((file) => this.parser.supportsFile(file.path));
    const fileSet = new Map(supportedFiles.map((file) => [path.normalize(file.path), file]));
    const importEdges: RepositoryImportEdge[] = [];
    const callEdges: RepositoryCallEdge[] = [];

    for (const file of supportedFiles) {
      const content = await fs.readFile(file.path, 'utf8');
      importEdges.push(
        ...this.parser
          .parseImports(content, file.path, scan.rootPath)
          .map((edge) => this.resolveImport(edge, scan.rootPath, fileSet)),
      );
      callEdges.push(...this.parser.parseCalls(content, file.path, scan.rootPath));
    }

    return {
      rootPath: scan.rootPath,
      files: supportedFiles,
      importEdges,
      callEdges,
      truncated: scan.truncated,
    };
  }

  private withGraphDefaults(options: RepositoryScanOptions): RepositoryScanOptions {
    return {
      ...options,
      maxFiles: options.maxFiles ?? DEFAULT_GRAPH_MAX_FILES,
    };
  }

  private resolveImport(
    edge: RepositoryImportEdge,
    rootPath: string,
    fileSet: ReadonlyMap<string, RepositoryFile>,
  ): RepositoryImportEdge {
    if (!edge.specifier.startsWith('.')) {
      return edge;
    }

    const sourceDirectory = path.dirname(edge.sourceFile);
    const basePath = path.resolve(sourceDirectory, edge.specifier);
    const candidates = [
      ...RESOLUTION_EXTENSIONS.map((extension) => `${basePath}${extension}`),
      ...INDEX_FILENAMES.map((filename) => path.join(basePath, filename)),
    ];
    const resolved = candidates.map((candidate) => path.normalize(candidate)).find((candidate) => fileSet.has(candidate));
    if (!resolved) {
      return edge;
    }

    return {
      ...edge,
      resolvedFile: resolved,
      resolvedRelativePath: path.relative(rootPath, resolved).replaceAll('\\', '/'),
      unresolved: false,
    };
  }
}
