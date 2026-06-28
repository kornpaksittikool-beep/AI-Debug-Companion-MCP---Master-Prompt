import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../registry/interfaces/json-schema.interface.js';
import type {
  ExecutionTelemetryBudgetStatus,
  ExecutionTelemetryRecord,
  ExecutionTelemetrySummary,
  ExecutionTelemetrySummaryOptions,
  ExecutionToolTelemetrySummary,
} from './execution-telemetry.interface.js';

const DEFAULT_CHARS_PER_TOKEN = 4;
const MAX_RECENT_CALLS = 50;
const QUESTION_TARGET_TOKENS: Required<
  Record<NonNullable<ExecutionTelemetrySummaryOptions['questionType']>, number>
> = {
  project_summary: 2000,
  tech_stack_quick_view: 2500,
  debugging: 8000,
  code_review: 10000,
  planning: 6000,
  general: 4000,
};

@Injectable()
export class ExecutionTelemetryService {
  private readonly records: ExecutionTelemetryRecord[] = [];

  recordSuccess(input: {
    readonly correlationId: string;
    readonly toolName: string;
    readonly startedAt: Date;
    readonly executionTimeMs: number;
    readonly input: JsonSchemaObject;
    readonly output: JsonSchemaObject;
  }): ExecutionTelemetryRecord {
    return this.record({
      correlationId: input.correlationId,
      toolName: input.toolName,
      status: 'success',
      startedAt: input.startedAt.toISOString(),
      executionTimeMs: input.executionTimeMs,
      estimatedInputTokens: this.estimateTokens(input.input),
      estimatedOutputTokens: this.estimateTokens(input.output),
    });
  }

  recordFailure(input: {
    readonly correlationId: string;
    readonly toolName: string;
    readonly startedAt: Date;
    readonly executionTimeMs: number;
    readonly input: JsonSchemaObject;
    readonly errorCode?: string;
  }): ExecutionTelemetryRecord {
    return this.record({
      correlationId: input.correlationId,
      toolName: input.toolName,
      status: 'failed',
      startedAt: input.startedAt.toISOString(),
      executionTimeMs: input.executionTimeMs,
      estimatedInputTokens: this.estimateTokens(input.input),
      estimatedOutputTokens: 0,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    });
  }

  summary(input: ExecutionTelemetrySummaryOptions = {}): ExecutionTelemetrySummary {
    const successfulCalls = this.records.filter((record) => record.status === 'success').length;
    const failedCalls = this.records.filter((record) => record.status === 'failed').length;
    const estimatedInputTokens = this.records.reduce(
      (sum, record) => sum + record.estimatedInputTokens,
      0,
    );
    const estimatedOutputTokens = this.records.reduce(
      (sum, record) => sum + record.estimatedOutputTokens,
      0,
    );

    const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
    const budgetStatus = this.budgetStatus(input, estimatedTotalTokens);

    return {
      toolCalls: this.records.length,
      successfulCalls,
      failedCalls,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedTotalTokens,
      topTools: this.topTools(),
      recentCalls: this.records.slice(-MAX_RECENT_CALLS),
      ...(budgetStatus ? { budgetStatus } : {}),
    };
  }

  reset(): { readonly clearedRecords: number } {
    const clearedRecords = this.records.length;
    this.records.splice(0, this.records.length);
    return { clearedRecords };
  }

  private record(record: ExecutionTelemetryRecord): ExecutionTelemetryRecord {
    this.records.push(record);
    return record;
  }

  private estimateTokens(value: JsonSchemaObject): number {
    const serialized = JSON.stringify(value);
    if (serialized.length === 0) {
      return 0;
    }
    return Math.ceil(serialized.length / DEFAULT_CHARS_PER_TOKEN);
  }

  private topTools(): readonly ExecutionToolTelemetrySummary[] {
    const byTool = new Map<string, { calls: number; estimatedTotalTokens: number }>();
    for (const record of this.records) {
      const current = byTool.get(record.toolName) ?? { calls: 0, estimatedTotalTokens: 0 };
      byTool.set(record.toolName, {
        calls: current.calls + 1,
        estimatedTotalTokens:
          current.estimatedTotalTokens + record.estimatedInputTokens + record.estimatedOutputTokens,
      });
    }

    return [...byTool.entries()]
      .map(([toolName, summary]) => ({ toolName, ...summary }))
      .sort(
        (a, b) =>
          b.estimatedTotalTokens - a.estimatedTotalTokens || a.toolName.localeCompare(b.toolName),
      )
      .slice(0, 10);
  }

  private budgetStatus(
    input: ExecutionTelemetrySummaryOptions,
    estimatedTotalTokens: number,
  ): ExecutionTelemetryBudgetStatus | undefined {
    const targetTokens =
      input.targetTokens ??
      (input.questionType ? QUESTION_TARGET_TOKENS[input.questionType] : undefined);
    if (targetTokens === undefined) {
      return undefined;
    }
    const overByTokens = Math.max(0, estimatedTotalTokens - targetTokens);
    const status = overByTokens > 0 ? 'over_budget' : 'within_budget';
    return {
      status,
      targetTokens,
      ...(input.questionType ? { questionType: input.questionType } : {}),
      estimatedTotalTokens,
      overByTokens,
      recommendation:
        status === 'over_budget'
          ? 'Reduce context immediately: stop broad reads, lower excerpt maxBytes, and replace full context with search or symbol evidence.'
          : 'Telemetry is within the selected target range.',
    };
  }
}
