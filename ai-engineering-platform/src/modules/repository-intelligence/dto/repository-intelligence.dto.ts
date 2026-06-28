export interface RepositoryOverviewInputDto {
  readonly rootPath: string;
  readonly maxFiles?: number;
  readonly maxDepth?: number;
  readonly maxFileSizeBytes?: number;
  readonly ignorePatterns?: readonly string[];
}

export interface RepositoryProjectProfileInputDto extends RepositoryOverviewInputDto {
  readonly maxKeyFiles?: number;
  readonly maxLargestFiles?: number;
  readonly maxExtensions?: number;
}

export interface RepositoryScanInputDto extends RepositoryOverviewInputDto {
  readonly includeTextPreview?: boolean;
  readonly previewMaxBytes?: number;
}

export interface RepositorySearchFilesInputDto extends RepositoryScanInputDto {
  readonly query?: string;
  readonly extension?: string;
}

export interface RepositorySearchSymbolsInputDto extends RepositoryScanInputDto {
  readonly query?: string;
  readonly kind?: 'class' | 'function' | 'method' | 'interface' | 'type' | 'enum' | 'variable';
}

export interface RepositoryReadFileContextInputDto {
  readonly rootPath: string;
  readonly filePath: string;
  readonly maxBytes?: number;
}

export interface RepositoryReadFileExcerptInputDto extends RepositoryReadFileContextInputDto {
  readonly purpose?: 'summary' | 'routing' | 'debug' | 'review';
}

export interface RepositoryReadModuleContextInputDto {
  readonly rootPath: string;
  readonly modulePath: string;
  readonly maxFiles?: number;
  readonly maxDepth?: number;
  readonly maxFileSizeBytes?: number;
}

export interface RepositoryReadSymbolContextInputDto extends RepositoryScanInputDto {
  readonly symbolName: string;
  readonly filePath?: string;
  readonly kind?: 'class' | 'function' | 'method' | 'interface' | 'type' | 'enum' | 'variable';
  readonly maxBytes?: number;
}

export interface RepositoryImportGraphInputDto extends RepositoryScanInputDto {
  readonly includeExternal?: boolean;
}

export interface RepositoryCallGraphInputDto extends RepositoryScanInputDto {
  readonly query?: string;
}

export interface RepositoryIndexStatusInputDto extends RepositoryScanInputDto {
  readonly rebuildIfMissing?: boolean;
}

export interface RepositoryRebuildIndexInputDto extends RepositoryScanInputDto {
  readonly force?: boolean;
}

export interface RepositoryCrossRepoSearchInputDto {
  readonly repositories: readonly RepositoryScanInputDto[];
  readonly query: string;
  readonly extension?: string;
  readonly maxMatchesPerRepository?: number;
}
