export interface ExecutionTelemetryRecord {
  readonly correlationId: string;
  readonly toolName: string;
  readonly status: 'success' | 'failed';
  readonly startedAt: string;
  readonly executionTimeMs: number;
  readonly estimatedInputTokens: number;
  readonly estimatedOutputTokens: number;
  readonly errorCode?: string;
}

export interface ExecutionTelemetrySummary {
  readonly toolCalls: number;
  readonly successfulCalls: number;
  readonly failedCalls: number;
  readonly estimatedInputTokens: number;
  readonly estimatedOutputTokens: number;
  readonly estimatedTotalTokens: number;
  readonly topTools: readonly ExecutionToolTelemetrySummary[];
  readonly recentCalls: readonly ExecutionTelemetryRecord[];
}

export interface ExecutionToolTelemetrySummary {
  readonly toolName: string;
  readonly calls: number;
  readonly estimatedTotalTokens: number;
}
