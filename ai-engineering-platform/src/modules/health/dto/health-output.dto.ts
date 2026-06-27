export interface HealthOutputDto {
  readonly status: 'ok' | 'degraded' | 'unavailable';
  readonly timestamp: string;
}

export interface PlatformMetadataToolDto {
  readonly name: string;
  readonly version: string;
  readonly module: string;
  readonly description: string;
}

export interface PlatformMetadataOutputDto {
  readonly platform: {
    readonly name: string;
    readonly version: string;
    readonly phase: string;
  };
  readonly tools: readonly PlatformMetadataToolDto[];
}
