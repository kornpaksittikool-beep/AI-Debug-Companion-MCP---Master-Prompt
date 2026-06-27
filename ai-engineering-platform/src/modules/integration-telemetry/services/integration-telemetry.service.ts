import { Injectable } from '@nestjs/common';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  IntegrationReadinessInput,
  IntegrationReadinessResult,
  IntegrationSession,
  IntegrationSessionInput,
  IntegrationTelemetrySummary,
  IntegrationTelemetrySummaryInput,
  IntegrationToolUsageSummary,
  ToolUsageRecord,
  ToolUsageRecordInput,
} from '../interfaces/integration-telemetry.interface.js';

const DEFAULT_SERVER_NAME = 'ai_engineering_platform';
const DEFAULT_EXPECTED_TOOLS = [
  'platform.health',
  'repository.overview',
  'repository.search_symbols',
  'repository.import_graph',
  'token_budget.estimate',
  'token_budget.recommend_strategy',
];
const MANUAL_READ_AVOIDED_MULTIPLIER = 6;

@Injectable()
export class IntegrationTelemetryService {
  private readonly sessions = new Map<string, IntegrationSession>();
  private readonly records: ToolUsageRecord[] = [];

  startSession(input: IntegrationSessionInput): IntegrationSession {
    const id = input.sessionId ?? createCorrelationId();
    const session: IntegrationSession = {
      id,
      client: input.client,
      workspaceRoot: input.workspaceRoot,
      startedAt: input.startedAt ?? new Date().toISOString(),
      ...(input.notes ? { notes: input.notes } : {}),
    };
    this.sessions.set(id, session);
    return session;
  }

  recordToolUsage(input: ToolUsageRecordInput): ToolUsageRecord {
    if (!this.sessions.has(input.sessionId)) {
      this.startSession({
        client: 'custom',
        workspaceRoot: 'unknown',
        sessionId: input.sessionId,
        notes: 'Session was created implicitly from tool usage telemetry.',
      });
    }

    const record: ToolUsageRecord = {
      id: createCorrelationId(),
      sessionId: input.sessionId,
      toolName: input.toolName,
      status: input.status,
      startedAt: input.startedAt ?? new Date().toISOString(),
      ...(input.executionTimeMs === undefined ? {} : { executionTimeMs: input.executionTimeMs }),
      estimatedInputTokens: Math.max(0, Math.floor(input.estimatedInputTokens ?? 0)),
      estimatedOutputTokens: Math.max(0, Math.floor(input.estimatedOutputTokens ?? 0)),
      fallbackUsed: input.fallbackUsed ?? false,
      ...(input.fallbackReason ? { fallbackReason: input.fallbackReason } : {}),
    };
    this.records.push(record);
    return record;
  }

  readiness(input: IntegrationReadinessInput): IntegrationReadinessResult {
    const configuredServerName = input.configuredServerName ?? DEFAULT_SERVER_NAME;
    const expectedTools = input.expectedTools ?? DEFAULT_EXPECTED_TOOLS;
    const availableTools = new Set(input.availableTools ?? []);
    const presentTools = expectedTools.filter((tool) => availableTools.has(tool));
    const missingTools = expectedTools.filter((tool) => !availableTools.has(tool));
    const serverNamePassed = configuredServerName === DEFAULT_SERVER_NAME;
    const toolsPassed = missingTools.length === 0;
    const instructionsPassed = input.agentsInstructionLoaded ?? false;
    const ready = serverNamePassed && toolsPassed && instructionsPassed;

    return {
      configuredServerName,
      ready,
      missingTools,
      presentTools,
      checks: [
        {
          name: 'server_name',
          status: serverNamePassed ? 'passed' : 'failed',
          reason: serverNamePassed
            ? 'Configured server name matches expected Codex MCP entry.'
            : `Expected ${DEFAULT_SERVER_NAME}.`,
        },
        {
          name: 'required_tools',
          status: toolsPassed ? 'passed' : 'failed',
          reason: toolsPassed ? 'All expected tools are available.' : `Missing tools: ${missingTools.join(', ')}`,
        },
        {
          name: 'project_instructions',
          status: instructionsPassed ? 'passed' : 'failed',
          reason: instructionsPassed
            ? 'Project instructions are loaded.'
            : 'AGENTS.md instructions were not confirmed for the current session.',
        },
      ],
      recommendations: this.readinessRecommendations(ready, missingTools, instructionsPassed),
    };
  }

  summary(input: IntegrationTelemetrySummaryInput): IntegrationTelemetrySummary {
    const records = input.sessionId
      ? this.records.filter((record) => record.sessionId === input.sessionId)
      : this.records;
    const sessions = input.sessionId ? (this.sessions.has(input.sessionId) ? 1 : 0) : this.sessions.size;
    const successfulCalls = records.filter((record) => record.status === 'success').length;
    const failedCalls = records.filter((record) => record.status === 'failed').length;
    const fallbackCalls = records.filter((record) => record.fallbackUsed).length;
    const estimatedInputTokens = records.reduce((sum, record) => sum + record.estimatedInputTokens, 0);
    const estimatedOutputTokens = records.reduce((sum, record) => sum + record.estimatedOutputTokens, 0);
    const estimatedManualReadTokensAvoided = records
      .filter((record) => !record.fallbackUsed && record.status === 'success')
      .reduce((sum, record) => sum + record.estimatedOutputTokens * MANUAL_READ_AVOIDED_MULTIPLIER, 0);

    return {
      sessions,
      toolCalls: records.length,
      successfulCalls,
      failedCalls,
      fallbackCalls,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedManualReadTokensAvoided,
      topTools: this.topTools(records),
      recommendations: this.summaryRecommendations(records.length, fallbackCalls, failedCalls),
    };
  }

  private readinessRecommendations(
    ready: boolean,
    missingTools: readonly string[],
    instructionsLoaded: boolean,
  ): readonly string[] {
    if (ready) {
      return ['Use MCP-first repository analysis and record tool usage telemetry for token-saving measurement.'];
    }

    const recommendations = ['Open a new Codex session after MCP config changes so tool namespaces refresh.'];
    if (missingTools.length > 0) {
      recommendations.push('Run platform.metadata and confirm the expected tool list.');
    }
    if (!instructionsLoaded) {
      recommendations.push('Open the session from the repository root so AGENTS.md is loaded.');
    }
    return recommendations;
  }

  private summaryRecommendations(
    toolCalls: number,
    fallbackCalls: number,
    failedCalls: number,
  ): readonly string[] {
    if (toolCalls === 0) {
      return ['No telemetry recorded yet. Record tool usage after MCP calls to measure real adoption.'];
    }
    const recommendations = ['Compare estimated avoided manual-read tokens against direct file-read workflows.'];
    if (fallbackCalls > 0) {
      recommendations.push('Investigate fallback reasons and improve MCP availability or tool coverage.');
    }
    if (failedCalls > 0) {
      recommendations.push('Review failed MCP tool calls and add readiness checks or clearer error guidance.');
    }
    return recommendations;
  }

  private topTools(records: readonly ToolUsageRecord[]): readonly IntegrationToolUsageSummary[] {
    const counts = new Map<string, number>();
    for (const record of records) {
      counts.set(record.toolName, (counts.get(record.toolName) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([toolName, calls]) => ({ toolName, calls }))
      .sort((a, b) => b.calls - a.calls || a.toolName.localeCompare(b.toolName))
      .slice(0, 10);
  }
}
