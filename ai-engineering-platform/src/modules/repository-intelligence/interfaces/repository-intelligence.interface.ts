export interface RepositoryScanOptions {
  readonly rootPath: string;
  readonly maxFiles?: number;
  readonly maxDepth?: number;
  readonly maxFileSizeBytes?: number;
  readonly includeTextPreview?: boolean;
  readonly previewMaxBytes?: number;
  readonly ignorePatterns?: readonly string[];
}

export interface RepositoryFile {
  readonly path: string;
  readonly relativePath: string;
  readonly extension: string;
  readonly sizeBytes: number;
  readonly modifiedAt: string;
  readonly textPreview?: string;
}

export interface RepositoryScanResult {
  readonly rootPath: string;
  readonly files: readonly RepositoryFile[];
  readonly totalFilesVisited: number;
  readonly ignoredEntries: readonly string[];
  readonly truncated: boolean;
  readonly limits: {
    readonly maxFiles: number;
    readonly maxDepth: number;
    readonly maxFileSizeBytes: number;
  };
}

export interface RepositoryOverview {
  readonly rootPath: string;
  readonly fileCount: number;
  readonly extensionCounts: readonly ExtensionCount[];
  readonly largestFiles: readonly RepositoryFile[];
  readonly truncated: boolean;
}

export interface RepositoryProjectProfile {
  readonly rootPath: string;
  readonly fileCount: number;
  readonly truncated: boolean;
  readonly extensionCounts: readonly ExtensionCount[];
  readonly keyFiles: readonly RepositoryFile[];
  readonly packageManifests: readonly RepositoryFile[];
  readonly workspaceHints: readonly string[];
  readonly entrypointHints: readonly RepositoryFile[];
  readonly largestFiles: readonly RepositoryFile[];
  readonly tokenPolicy: {
    readonly profile: 'compact';
    readonly exactCodexBillingAvailable: false;
    readonly billingNote: string;
    readonly recommendedNextTools: readonly string[];
    readonly avoidUntilNeeded: readonly string[];
  };
}

export interface ExtensionCount {
  readonly extension: string;
  readonly count: number;
}

export interface RepositorySearchOptions extends RepositoryScanOptions {
  readonly query?: string;
  readonly extension?: string;
  readonly maxMatches?: number;
  readonly mode?: 'full' | 'compact' | 'summary';
}

export interface RepositorySearchResult {
  readonly rootPath: string;
  readonly matches: readonly RepositoryFile[];
  readonly totalMatches: number;
  readonly returnedMatches: number;
  readonly truncated: boolean;
  readonly tokenPolicy: {
    readonly profile: 'full' | 'compact' | 'summary';
    readonly maxMatches: number;
    readonly recommendedUse: string;
  };
}

export interface FileContextOptions {
  readonly rootPath: string;
  readonly filePath: string;
  readonly maxBytes?: number;
}

export interface FileExcerptOptions extends FileContextOptions {
  readonly purpose?: 'summary' | 'routing' | 'debug' | 'review';
}

export interface FileContextResult {
  readonly rootPath: string;
  readonly filePath: string;
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly truncated: boolean;
  readonly content: string;
}

export interface FileExcerptResult {
  readonly rootPath: string;
  readonly filePath: string;
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly maxBytes: number;
  readonly truncated: boolean;
  readonly excerpt: string;
  readonly tokenPolicy: {
    readonly profile: 'excerpt';
    readonly recommendedUse: string;
    readonly escalationTool: 'repository.read_file_context';
  };
}

export interface ModuleContextOptions {
  readonly rootPath: string;
  readonly modulePath: string;
  readonly maxFiles?: number;
  readonly maxDepth?: number;
  readonly maxFileSizeBytes?: number;
}

export interface ModuleContextResult {
  readonly rootPath: string;
  readonly modulePath: string;
  readonly files: readonly FileContextResult[];
  readonly truncated: boolean;
}

export type RepositorySymbolKind =
  | 'class'
  | 'function'
  | 'method'
  | 'interface'
  | 'type'
  | 'enum'
  | 'variable';

export interface RepositorySymbol {
  readonly name: string;
  readonly kind: RepositorySymbolKind;
  readonly filePath: string;
  readonly relativePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly exported: boolean;
  readonly containerName?: string;
  readonly signature: string;
}

export interface SymbolSearchOptions extends RepositoryScanOptions {
  readonly query?: string;
  readonly kind?: RepositorySymbolKind;
}

export interface SymbolSearchResult {
  readonly rootPath: string;
  readonly symbols: readonly RepositorySymbol[];
  readonly truncated: boolean;
}

export interface SymbolContextOptions extends RepositoryScanOptions {
  readonly symbolName: string;
  readonly filePath?: string;
  readonly kind?: RepositorySymbolKind;
  readonly maxBytes?: number;
}

export interface SymbolContextResult {
  readonly rootPath: string;
  readonly symbol: RepositorySymbol;
  readonly context: string;
  readonly truncated: boolean;
}

export interface LanguageParser<TSymbol = RepositorySymbol> {
  readonly language: string;
  supportsFile(filePath: string): boolean;
  parseSymbols(content: string, filePath: string): readonly TSymbol[];
}

export type ImportKind = 'static' | 're_export' | 'dynamic';

export interface RepositoryImportEdge {
  readonly sourceFile: string;
  readonly sourceRelativePath: string;
  readonly specifier: string;
  readonly kind: ImportKind;
  readonly resolvedFile?: string;
  readonly resolvedRelativePath?: string;
  readonly unresolved: boolean;
  readonly line: number;
}

export interface ImportGraphOptions extends RepositoryScanOptions {
  readonly includeExternal?: boolean;
}

export interface ImportGraphResult {
  readonly rootPath: string;
  readonly edges: readonly RepositoryImportEdge[];
  readonly fileCount: number;
  readonly unresolvedCount: number;
  readonly truncated: boolean;
}

export interface RepositoryCallEdge {
  readonly sourceFile: string;
  readonly sourceRelativePath: string;
  readonly callerName: string;
  readonly calleeName: string;
  readonly line: number;
}

export interface CallGraphOptions extends RepositoryScanOptions {
  readonly query?: string;
}

export interface CallGraphResult {
  readonly rootPath: string;
  readonly edges: readonly RepositoryCallEdge[];
  readonly fileCount: number;
  readonly truncated: boolean;
}

export interface RepositoryIndexFileEntry {
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly modifiedAt: string;
  readonly indexedAt: string;
}

export interface RepositoryIndexSnapshot {
  readonly rootPath: string;
  readonly generatedAt: string;
  readonly files: readonly RepositoryIndexFileEntry[];
  readonly importEdges: readonly RepositoryImportEdge[];
  readonly callEdges: readonly RepositoryCallEdge[];
  readonly truncated: boolean;
}

export interface RepositoryIndexStatusOptions extends RepositoryScanOptions {
  readonly rebuildIfMissing?: boolean;
}

export interface RepositoryRebuildIndexOptions extends RepositoryScanOptions {
  readonly force?: boolean;
}

export interface RepositoryIndexStatusResult {
  readonly rootPath: string;
  readonly indexExists: boolean;
  readonly indexedFiles: number;
  readonly currentFiles: number;
  readonly changedFiles: readonly string[];
  readonly missingFiles: readonly string[];
  readonly deletedFiles: readonly string[];
  readonly generatedAt?: string;
  readonly stale: boolean;
}

export interface RepositoryRebuildIndexResult {
  readonly rootPath: string;
  readonly indexedFiles: number;
  readonly importEdges: number;
  readonly callEdges: number;
  readonly changedFiles: readonly string[];
  readonly reusedFiles: number;
  readonly generatedAt: string;
  readonly indexPath: string;
}

export interface CrossRepositorySearchOptions {
  readonly repositories: readonly RepositoryScanOptions[];
  readonly query: string;
  readonly extension?: string;
  readonly maxMatchesPerRepository?: number;
}

export interface CrossRepositorySearchMatch {
  readonly rootPath: string;
  readonly relativePath: string;
  readonly extension: string;
  readonly sizeBytes: number;
  readonly modifiedAt: string;
  readonly textPreview?: string;
}

export interface CrossRepositorySearchResult {
  readonly repositories: number;
  readonly matches: readonly CrossRepositorySearchMatch[];
  readonly truncated: boolean;
}
