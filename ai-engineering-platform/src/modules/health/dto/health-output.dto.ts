export interface HealthOutputDto {
  readonly status: 'ok' | 'degraded' | 'unavailable';
  readonly timestamp: string;
}

export interface PlatformMetadataToolDto {
  readonly name: string;
  readonly version: string;
  readonly module: string;
  readonly description?: string;
}

export interface PlatformMetadataInputDto {
  readonly includeTools?: boolean;
  readonly includeDescriptions?: boolean;
  readonly moduleFilter?: string;
}

export interface PlatformToolModuleSummaryDto {
  readonly module: string;
  readonly toolCount: number;
  readonly toolNames: readonly string[];
}

export interface PlatformToolSummaryOutputDto {
  readonly platform: {
    readonly name: string;
    readonly version: string;
    readonly phase: string;
  };
  readonly totalTools: number;
  readonly modules: readonly PlatformToolModuleSummaryDto[];
  readonly recommendation: string;
}

export interface PlatformMetadataOutputDto {
  readonly platform: {
    readonly name: string;
    readonly version: string;
    readonly phase: string;
  };
  readonly tools?: readonly PlatformMetadataToolDto[];
  readonly toolSummary?: PlatformToolSummaryOutputDto;
}
