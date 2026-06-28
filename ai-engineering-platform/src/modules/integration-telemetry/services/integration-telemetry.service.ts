import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  IntegrationReadinessInput,
  IntegrationReadinessResult,
  IntegrationSession,
  IntegrationSessionInput,
  IntegrationTelemetrySummary,
  IntegrationTelemetrySummaryInput,
  IntegrationToolUsageSummary,
  TelemetryFlushInput,
  TelemetryFlushResult,
  ToolUsageRecord,
  ToolUsageRecordInput,
  WorkflowIndexEntry,
  WorkflowIndexInput,
  WorkflowIndexResult,
} from '../interfaces/integration-telemetry.interface.js';
import { IntegrationTelemetryPathService } from './integration-telemetry-path.service.js';

const DEFAULT_SERVER_NAME = 'ai_engineering_platform';
const DEFAULT_EXPECTED_TOOLS = [
  'platform.health',
  'platform.tool_summary',
  'repository.overview',
  'repository.search_files',
  'repository.search_symbols',
  'token_budget.estimate',
  'token_budget.recommend_strategy',
];
const MANUAL_READ_AVOIDED_MULTIPLIER = 6;
const WORKFLOW_INDEX: readonly WorkflowIndexEntry[] = [
  {
    taskType: 'project_summary',
    description: 'Summarize project purpose, stack, modules, and key files with a low-token evidence route.',
    startTools: ['platform.health', 'platform.tool_summary', 'repository.overview'],
    evidenceTools: ['repository.search_files', 'repository.search_symbols', 'git.recent_changes'],
    planningTools: ['token_budget.estimate'],
    verificationTools: ['integration.auto_telemetry_summary'],
    primaryModules: ['health', 'repository-intelligence', 'integration-telemetry'],
    relevantFiles: ['package.json', 'pnpm-workspace.yaml', 'README.md', 'apps', 'src'],
    avoidUntilNeeded: [
      'repository.import_graph unless dependency flow is the question',
      'repository.call_graph unless call flow is the question',
      'repository.read_module_context for broad directories',
      'full platform.metadata',
    ],
  },
  {
    taskType: 'bug_investigation',
    description: 'Investigate a defect with traceable evidence before proposing fixes.',
    startTools: ['platform.health', 'investigation.create', 'repository.overview'],
    evidenceTools: ['repository.search_files', 'repository.search_symbols', 'git.recent_changes', 'security.audit_project'],
    planningTools: ['planning.create_plan', 'planning.impact_report'],
    verificationTools: ['verification.run_check', 'patch.rollback_plan'],
    primaryModules: ['investigation', 'repository-intelligence', 'git-intelligence', 'planning-impact'],
    relevantFiles: ['src/modules/investigation', 'src/modules/repository-intelligence', 'src/modules/git-intelligence'],
    avoidUntilNeeded: [
      'repository.import_graph unless the suspected defect is import/dependency related',
      'repository.read_module_context',
      'patch.apply_proposal',
    ],
  },
  {
    taskType: 'architecture_review',
    description: 'Review module boundaries, dependency flow, and phase architecture decisions.',
    startTools: ['platform.health', 'platform.tool_summary', 'repository.overview'],
    evidenceTools: [
      'repository.search_files',
      'repository.search_symbols',
      'repository.import_graph',
      'repository.call_graph',
      'repository.index_status',
      'memory.search',
    ],
    planningTools: ['planning.impact_report'],
    verificationTools: ['security.audit_tool_permissions'],
    primaryModules: ['core', 'repository-intelligence', 'project-memory'],
    relevantFiles: ['docs/architecture.md', 'docs/adr', 'src/app.module.ts', 'src/core'],
    avoidUntilNeeded: ['full platform.metadata', 'repository.read_file_context for broad docs', 'patch.apply_proposal'],
  },
  {
    taskType: 'phase_planning',
    description: 'Plan the next iterative phase from roadmap, TODO, and completed phase reports.',
    startTools: ['platform.health', 'platform.tool_summary', 'memory.search', 'integration.workflow_index'],
    evidenceTools: ['repository.search_files', 'git.recent_changes'],
    planningTools: ['planning.create_plan', 'planning.impact_report'],
    verificationTools: ['token_budget.estimate'],
    primaryModules: ['planning-impact', 'project-memory', 'integration-telemetry'],
    relevantFiles: ['ROADMAP.md', 'TODO.md', 'docs/phase-*.md'],
    avoidUntilNeeded: ['patch.apply_proposal'],
  },
  {
    taskType: 'patch_execution',
    description: 'Create, apply, verify, and roll back approved deterministic patches.',
    startTools: ['planning.summarize_plan', 'planning.approval_gate'],
    evidenceTools: ['repository.read_file_context', 'git.impact_hints'],
    planningTools: ['patch.create_proposal', 'patch.rollback_plan'],
    verificationTools: ['patch.apply_proposal', 'verification.run_check', 'patch.rollback_apply'],
    primaryModules: ['patch-verification', 'planning-impact', 'git-intelligence'],
    relevantFiles: ['src/modules/patch-verification', 'src/modules/planning-impact'],
    avoidUntilNeeded: ['direct file writes outside approved patch flow'],
  },
  {
    taskType: 'token_optimization',
    description: 'Reduce context usage with MCP-first evidence, estimates, and compression.',
    startTools: ['platform.health', 'token_budget.recommend_strategy'],
    evidenceTools: ['token_budget.estimate', 'repository.search_files', 'repository.search_symbols'],
    planningTools: ['token_budget.compress_context'],
    verificationTools: ['integration.telemetry_summary'],
    primaryModules: ['token-budget', 'integration-telemetry', 'repository-intelligence'],
    relevantFiles: ['src/modules/token-budget', 'src/modules/integration-telemetry', 'AGENTS.md'],
    avoidUntilNeeded: [
      'repository.import_graph unless it was the largest token source under investigation',
      'repository.read_module_context',
      'full repository file reads',
    ],
  },
  {
    taskType: 'plugin_workflow',
    description: 'Validate, stage, and inspect local or remote plugins without executing untrusted code.',
    startTools: ['plugin.catalog', 'plugin.validate_manifest'],
    evidenceTools: ['plugin.resolve_compatibility', 'plugin.remote_stage_plan', 'plugin.verify_artifact'],
    planningTools: ['plugin.install_plan', 'plugin.update_plan', 'plugin.remove_plan'],
    verificationTools: ['plugin.inventory', 'plugin.staged_inventory'],
    primaryModules: ['plugin-marketplace', 'core/registry'],
    relevantFiles: ['src/modules/plugin-marketplace', 'src/plugins/plugin-api'],
    avoidUntilNeeded: ['dynamic import of plugin code', 'network downloads'],
  },
  {
    taskType: 'database_analysis',
    description: 'Inspect database capabilities and schema through read-only tools.',
    startTools: ['database.supported_dialects', 'database.connection_profile'],
    evidenceTools: ['database.schema', 'database.relations', 'database.query_preview'],
    planningTools: ['planning.impact_report'],
    verificationTools: ['security.audit_project'],
    primaryModules: ['database-intelligence', 'planning-impact'],
    relevantFiles: ['src/modules/database-intelligence'],
    avoidUntilNeeded: ['database write operations', 'external network database execution'],
  },
  {
    taskType: 'git_analysis',
    description: 'Use read-only git history to understand risk, ownership, and change frequency.',
    startTools: ['git.recent_changes'],
    evidenceTools: ['git.blame', 'git.find_commit_by_file', 'git.impact_hints'],
    planningTools: ['planning.impact_report'],
    verificationTools: ['integration.record_tool_usage'],
    primaryModules: ['git-intelligence', 'planning-impact'],
    relevantFiles: ['src/modules/git-intelligence'],
    avoidUntilNeeded: ['git write commands', 'branch mutations'],
  },
];

@Injectable()
export class IntegrationTelemetryService {
  private readonly sessions = new Map<string, IntegrationSession>();
  private readonly records: ToolUsageRecord[] = [];

  constructor(private readonly paths: IntegrationTelemetryPathService) {}

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

  async flush(input: TelemetryFlushInput): Promise<TelemetryFlushResult> {
    const paths = this.paths.resolve(input.rootPath);
    await fs.mkdir(paths.telemetryDir, { recursive: true });
    await fs.writeFile(paths.sessionsPath, this.toJsonLines([...this.sessions.values()]), 'utf8');
    await fs.writeFile(paths.recordsPath, this.toJsonLines(this.records), 'utf8');

    return {
      rootPath: paths.rootPath,
      telemetryDir: paths.telemetryDir,
      sessionsPath: paths.sessionsPath,
      recordsPath: paths.recordsPath,
      sessionsWritten: this.sessions.size,
      recordsWritten: this.records.length,
      flushedAt: new Date().toISOString(),
    };
  }

  async summary(input: IntegrationTelemetrySummaryInput): Promise<IntegrationTelemetrySummary> {
    if (input.rootPath) {
      await this.loadPersisted(input.rootPath);
    }
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

  workflowIndex(input: WorkflowIndexInput): WorkflowIndexResult {
    const query = input.query?.trim().toLowerCase();
    const entries = WORKFLOW_INDEX.filter((entry) => {
      const taskMatches = input.taskType ? entry.taskType === input.taskType : true;
      const queryMatches = query
        ? `${entry.taskType}\n${entry.description}\n${entry.startTools.join('\n')}\n${entry.primaryModules.join('\n')}`
            .toLowerCase()
            .includes(query)
        : true;
      return taskMatches && queryMatches;
    });

    return {
      entries,
      recommendations:
        entries.length > 0
          ? ['Start with the listed startTools, then expand only through evidenceTools that answer the current question.']
          : ['No workflow matched. Use platform.health, platform.tool_summary, and repository.overview to gather a first routing signal.'],
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
      recommendations.push('Run platform.tool_summary and confirm the expected compact tool list.');
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

  private async loadPersisted(rootPath: string): Promise<void> {
    const paths = this.paths.resolve(rootPath);
    const sessions = await this.readJsonLines<IntegrationSession>(paths.sessionsPath);
    const records = await this.readJsonLines<ToolUsageRecord>(paths.recordsPath);
    for (const session of sessions) {
      this.sessions.set(session.id, session);
    }
    this.records.splice(0, this.records.length, ...records);
  }

  private async readJsonLines<TValue>(filePath: string): Promise<readonly TValue[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as TValue);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private toJsonLines(values: readonly unknown[]): string {
    return values.map((value) => JSON.stringify(value)).join('\n') + (values.length > 0 ? '\n' : '');
  }
}
