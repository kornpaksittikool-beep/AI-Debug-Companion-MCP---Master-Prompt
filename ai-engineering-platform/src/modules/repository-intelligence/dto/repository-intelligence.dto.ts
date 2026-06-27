export interface RepositoryOverviewInputDto {
  readonly rootPath: string;
  readonly maxFiles?: number;
  readonly maxDepth?: number;
  readonly maxFileSizeBytes?: number;
  readonly ignorePatterns?: readonly string[];
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
