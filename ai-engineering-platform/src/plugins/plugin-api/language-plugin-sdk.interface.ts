export interface LanguagePluginFileSupport {
  readonly language: string;
  readonly extensions: readonly string[];
}

export interface LanguagePluginSymbol {
  readonly name: string;
  readonly kind: string;
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
}

export interface LanguagePluginParseInput {
  readonly rootPath: string;
  readonly filePath: string;
  readonly content: string;
}

export interface LanguagePluginParseResult {
  readonly symbols: readonly LanguagePluginSymbol[];
}

export interface LanguagePluginSdk {
  readonly sdkType: 'language';
  readonly version: string;
  readonly supportedFiles: readonly LanguagePluginFileSupport[];
}
