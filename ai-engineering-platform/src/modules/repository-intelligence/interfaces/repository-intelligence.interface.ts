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

export interface ExtensionCount {
  readonly extension: string;
  readonly count: number;
}

export interface RepositorySearchOptions extends RepositoryScanOptions {
  readonly query?: string;
  readonly extension?: string;
}

export interface RepositorySearchResult {
  readonly rootPath: string;
  readonly matches: readonly RepositoryFile[];
  readonly truncated: boolean;
}

export interface FileContextOptions {
  readonly rootPath: string;
  readonly filePath: string;
  readonly maxBytes?: number;
}

export interface FileContextResult {
  readonly rootPath: string;
  readonly filePath: string;
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly truncated: boolean;
  readonly content: string;
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
