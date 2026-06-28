export type IntegrationClient = 'codex' | 'claude' | 'cursor' | 'custom';

export interface IntegrationSessionInput {
  readonly client: IntegrationClient;
  readonly workspaceRoot: string;
  readonly sessionId?: string;
  readonly startedAt?: string;
  readonly notes?: string;
}

export interface IntegrationSession {
  readonly id: string;
  readonly client: IntegrationClient;
  readonly workspaceRoot: string;
  readonly startedAt: string;
  readonly notes?: string;
}

export interface ToolUsageRecordInput {
  readonly sessionId: string;
  readonly toolName: string;
  readonly status: 'success' | 'failed';
  readonly startedAt?: string;
  readonly executionTimeMs?: number;
  readonly estimatedInputTokens?: number;
  readonly estimatedOutputTokens?: number;
  readonly fallbackUsed?: boolean;
  readonly fallbackReason?: string;
}

export interface ToolUsageRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly toolName: string;
  readonly status: 'success' | 'failed';
  readonly startedAt: string;
  readonly executionTimeMs?: number;
  readonly estimatedInputTokens: number;
  readonly estimatedOutputTokens: number;
  readonly fallbackUsed: boolean;
  readonly fallbackReason?: string;
}

export interface IntegrationReadinessInput {
  readonly configuredServerName?: string;
  readonly expectedTools?: readonly string[];
  readonly availableTools?: readonly string[];
  readonly agentsInstructionLoaded?: boolean;
}

export interface IntegrationReadinessResult {
  readonly configuredServerName: string;
  readonly ready: boolean;
  readonly missingTools: readonly string[];
  readonly presentTools: readonly string[];
  readonly checks: readonly IntegrationReadinessCheck[];
  readonly recommendations: readonly string[];
}

export interface IntegrationReadinessCheck {
  readonly name: string;
  readonly status: 'passed' | 'failed';
  readonly reason: string;
}

export interface IntegrationTelemetrySummaryInput {
  readonly sessionId?: string;
  readonly rootPath?: string;
}

export interface IntegrationTelemetrySummary {
  readonly sessions: number;
  readonly toolCalls: number;
  readonly successfulCalls: number;
  readonly failedCalls: number;
  readonly fallbackCalls: number;
  readonly estimatedInputTokens: number;
  readonly estimatedOutputTokens: number;
  readonly estimatedManualReadTokensAvoided: number;
  readonly topTools: readonly IntegrationToolUsageSummary[];
  readonly recommendations: readonly string[];
}

export interface IntegrationToolUsageSummary {
  readonly toolName: string;
  readonly calls: number;
}

export interface WorkflowIndexInput {
  readonly taskType?: WorkflowTaskType;
  readonly query?: string;
}

export type WorkflowTaskType =
  | 'project_summary'
  | 'bug_investigation'
  | 'architecture_review'
  | 'phase_planning'
  | 'patch_execution'
  | 'token_optimization'
  | 'plugin_workflow'
  | 'database_analysis'
  | 'git_analysis';

export interface WorkflowIndexEntry {
  readonly taskType: WorkflowTaskType;
  readonly description: string;
  readonly startTools: readonly string[];
  readonly evidenceTools: readonly string[];
  readonly planningTools: readonly string[];
  readonly verificationTools: readonly string[];
  readonly primaryModules: readonly string[];
  readonly relevantFiles: readonly string[];
  readonly avoidUntilNeeded: readonly string[];
}

export interface WorkflowIndexResult {
  readonly entries: readonly WorkflowIndexEntry[];
  readonly recommendations: readonly string[];
}

export interface TelemetryFlushInput {
  readonly rootPath: string;
}

export interface TelemetryFlushResult {
  readonly rootPath: string;
  readonly telemetryDir: string;
  readonly sessionsPath: string;
  readonly recordsPath: string;
  readonly sessionsWritten: number;
  readonly recordsWritten: number;
  readonly flushedAt: string;
}
