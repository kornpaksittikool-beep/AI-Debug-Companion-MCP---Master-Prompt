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
  readonly budgetStatus?: ExecutionTelemetryBudgetStatus;
}

export interface ExecutionToolTelemetrySummary {
  readonly toolName: string;
  readonly calls: number;
  readonly estimatedTotalTokens: number;
}

export interface ExecutionTelemetrySummaryOptions {
  readonly targetTokens?: number;
  readonly questionType?:
    | 'project_summary'
    | 'tech_stack_quick_view'
    | 'debugging'
    | 'code_review'
    | 'planning'
    | 'general';
}

export interface ExecutionTelemetryBudgetStatus {
  readonly status: 'within_budget' | 'over_budget' | 'unknown';
  readonly targetTokens?: number;
  readonly questionType?: string;
  readonly estimatedTotalTokens: number;
  readonly overByTokens: number;
  readonly recommendation: string;
}
