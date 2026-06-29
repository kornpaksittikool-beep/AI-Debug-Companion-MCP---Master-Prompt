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
  'repository.project_profile',
  'repository.search_files',
  'repository.search_symbols',
  'repository.read_file_excerpt',
  'token_budget.estimate',
  'token_budget.recommend_strategy',
];
const MANUAL_READ_AVOIDED_MULTIPLIER = 6;
const DEFAULT_REPORT_MODE = 'normal_user_summary' as const;
const DEBUG_REPORT_TRIGGERS = [
  'tools used',
  'telemetry',
  'token detail',
  'evidence detail',
  'debug MCP',
] as const;
const WORKFLOW_INDEX: readonly WorkflowIndexEntry[] = [
  {
    taskType: 'project_summary',
    description:
      'Summarize project purpose, stack, modules, and key files with a compact low-token profile route.',
    gateMode: 'compact_read_only',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'repository.project_profile'],
    evidenceTools: ['repository.read_file_excerpt', 'git.recent_changes'],
    planningTools: ['token_budget.estimate'],
    verificationTools: ['integration.auto_telemetry_summary'],
    primaryModules: ['health', 'repository-intelligence', 'integration-telemetry'],
    relevantFiles: ['package.json', 'pnpm-workspace.yaml', 'README.md', 'apps', 'src'],
    targetTokenRange: { min: 1000, max: 2000 },
    excerptMaxBytes: 700,
    maxExcerptCalls: 2,
    contextPolicy: [
      'Start every explicit skill response with a Workflow Gate; use compact_read_only mode for routine summaries.',
      'For normal_user_summary, keep routine read-only Workflow Gate output to 1-2 short lines while preserving evidence, no-change impact, and MCP route.',
      'Use debug_telemetry only when the user asks for tools used, telemetry, token detail, evidence detail, or debug MCP.',
      'For read-only project summaries, set Impact to "No file changes", Approval to "Not required: read-only", and Verification to evidence/tool output plus the telemetry footer.',
      'In normal_user_summary, summarize evidence as short file labels such as README, package, or production checklist instead of absolute paths.',
      'In normal_user_summary, summarize token status in one line, for example "Token: ~1.6k MCP payload, within target".',
      'Use repository.project_profile with mode=summary as the main evidence artifact.',
      'Skip platform.tool_summary for explicit project summaries unless tool availability is unclear.',
      'Stop after repository.project_profile plus README/package excerpts when those answer the summary.',
      'Do not call repository.search_files for routine summaries unless README/package cannot be found from the profile.',
      'Do not run repository.search_symbols for routine summaries; use file search and excerpts instead.',
      'Read 1 repository.read_file_excerpt result when possible, and at most 2 for README, package manifests, or entry points.',
      'Pass purpose=summary and maxBytes <= 700 for summary excerpts.',
      'If repository.read_file_excerpt is unavailable, answer from repository.project_profile plus evidence already gathered.',
      'If evidence is insufficient, stop and say evidence is limited instead of reading broad file context.',
      'Never fallback to repository.read_file_context for project_summary, project purpose, or normal_user_summary.',
      'Do not read docs/architecture.md, source tree summaries, or app module excerpts unless the user explicitly asks for architecture or module details.',
    ],
    workflowAcceptanceCriteria: [
      'Starts with platform.health and repository.project_profile in summary mode.',
      'Uses no more than two summary excerpts before answering or reporting limited evidence.',
      'Reports evidence labels, no file changes, and budget status in the final response.',
      'Never uses repository.read_file_context as a summary fallback.',
    ],
    fallbackPolicy: {
      neverUseBroadFileContext: true,
      fallbackOrder: [
        'project_profile',
        'read_file_excerpt',
        'answer_with_limited_evidence',
        'ask_for_debug_detail',
      ],
    },
    doNotCallTools: [
      'repository.import_graph',
      'repository.call_graph',
      'repository.search_files for routine summaries when README/package are present in repository.project_profile',
      'repository.search_symbols',
      'repository.read_module_context',
      'repository.read_file_context',
      'repository.overview',
      'repository.read_file_excerpt for docs/architecture.md or src/app.module.ts during routine summaries',
      'platform.tool_summary for explicit project summaries when repository.project_profile is available',
      'platform.metadata',
    ],
    avoidUntilNeeded: [
      'repository.import_graph unless dependency flow is the question',
      'repository.call_graph unless call flow is the question',
      'repository.overview unless the compact profile is insufficient',
      'repository.project_profile without mode=summary for routine summaries',
      'platform.tool_summary unless tool availability is unclear',
      'repository.search_files unless README/package cannot be found from the summary profile',
      'repository.search_symbols unless the project profile and excerpts cannot identify module boundaries',
      'repository.read_file_context for summary fallback',
      'docs/architecture.md and source tree summaries unless architecture is the question',
      'repository.read_module_context for broad directories',
      'full platform.metadata',
    ],
  },
  {
    taskType: 'tech_stack_quick_view',
    description:
      'Identify stack, package manager, frameworks, entry points, and architecture shape with compact evidence.',
    gateMode: 'compact_read_only',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'platform.tool_summary', 'repository.project_profile'],
    evidenceTools: [
      'repository.read_file_excerpt',
      'repository.search_files',
      'repository.search_symbols',
    ],
    planningTools: ['token_budget.estimate'],
    verificationTools: ['integration.auto_telemetry_summary'],
    primaryModules: ['health', 'repository-intelligence', 'token-budget'],
    relevantFiles: [
      'package.json',
      'pnpm-workspace.yaml',
      'nest-cli.json',
      'tsconfig.json',
      'src/app.module.ts',
      'README.md',
    ],
    targetTokenRange: { min: 1500, max: 2500 },
    excerptMaxBytes: 900,
    maxExcerptCalls: 3,
    contextPolicy: [
      'Start from manifests and configuration excerpts instead of broad source reads.',
      'Use symbol search for module names and framework boundaries before reading implementation files.',
      'Escalate to repository.import_graph only for explicit dependency-flow questions.',
    ],
    doNotCallTools: [
      'repository.read_module_context',
      'repository.read_file_context',
      'repository.overview',
      'platform.metadata',
    ],
    avoidUntilNeeded: [
      'repository.overview unless manifests and project profile are insufficient',
      'repository.import_graph unless dependency flow is the question',
      'repository.read_module_context for broad src directories',
      'full platform.metadata',
    ],
  },
  {
    taskType: 'bug_investigation',
    description: 'Investigate a defect with traceable evidence before proposing fixes.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'platform.tool_summary', 'investigation.create'],
    evidenceTools: [
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
      'git.recent_changes',
      'git.impact_hints',
      'security.audit_project',
    ],
    planningTools: ['planning.create_plan', 'planning.impact_report'],
    verificationTools: ['verification.run_check', 'patch.rollback_plan'],
    primaryModules: [
      'investigation',
      'repository-intelligence',
      'git-intelligence',
      'planning-impact',
    ],
    relevantFiles: [
      'src/modules/investigation',
      'src/modules/repository-intelligence',
      'src/modules/git-intelligence',
    ],
    targetTokenRange: { min: 3000, max: 8000 },
    excerptMaxBytes: 1200,
    maxExcerptCalls: 5,
    contextPolicy: [
      'Capture the error, stack trace, or failing command as investigation evidence first.',
      'Search for exact error text, symbols, routes, and recently changed files before reading full context.',
      'Read full file context only for the narrowed failing file or symbol.',
    ],
    workflowAcceptanceCriteria: [
      'Creates an investigation session before proposing a fix.',
      'Records the error, log, stack trace, or failing command as traceable evidence.',
      'Narrows to exact error text, symbols, routes, or recent changes before full context reads.',
      'Ends with root cause, confidence, fix direction, and verification commands.',
    ],
    doNotCallTools: [
      'repository.overview',
      'repository.read_module_context',
      'repository.import_graph',
      'repository.call_graph',
      'platform.metadata',
    ],
    avoidUntilNeeded: [
      'repository.overview unless search cannot locate the failing area',
      'repository.import_graph unless the suspected defect is import/dependency related',
      'repository.read_module_context',
      'patch.apply_proposal',
    ],
  },
  {
    taskType: 'code_review',
    description:
      'Review only changed files, impacted symbols, and focused risk evidence before summarizing findings.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'platform.tool_summary', 'git.impact_hints'],
    evidenceTools: [
      'git.recent_changes',
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
    ],
    planningTools: ['planning.impact_report'],
    verificationTools: ['verification.run_check', 'integration.auto_telemetry_summary'],
    primaryModules: ['git-intelligence', 'repository-intelligence', 'planning-impact'],
    relevantFiles: [
      'changed files from git diff',
      'tests touching changed modules',
      'package scripts',
    ],
    targetTokenRange: { min: 4000, max: 10000 },
    excerptMaxBytes: 1200,
    maxExcerptCalls: 6,
    contextPolicy: [
      'Read diffs and impacted files first; avoid unrelated repository context.',
      'Use repository.read_file_excerpt for surrounding contracts and tests before full file context.',
      'Escalate to import or call graph only when a changed symbol has non-obvious dependents.',
    ],
    workflowAcceptanceCriteria: [
      'Starts from changed files, diffs, or git impact hints.',
      'Keeps evidence scoped to impacted symbols, contracts, and directly related tests.',
      'Reports findings first with severity and file references.',
      'Calls out missing tests or residual risk when no findings are present.',
    ],
    doNotCallTools: [
      'repository.overview',
      'repository.read_module_context',
      'repository.scan',
      'platform.metadata',
    ],
    avoidUntilNeeded: [
      'repository.overview for routine diff review',
      'full repository scans after changed files are known',
      'repository.read_module_context for unrelated modules',
      'documentation reads unless the diff changes docs or public behavior',
    ],
  },
  {
    taskType: 'architecture_review',
    description: 'Review module boundaries, dependency flow, and phase architecture decisions.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
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
    targetTokenRange: { min: 2500, max: 6000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use architecture docs and app module excerpts first.',
      'Use import or call graph only for explicit coupling or dependency-flow questions.',
      'Prefer symbol summaries over whole modules when reviewing boundaries.',
    ],
    doNotCallTools: ['repository.read_module_context', 'platform.metadata'],
    avoidUntilNeeded: [
      'full platform.metadata',
      'repository.read_file_context for broad docs',
      'patch.apply_proposal',
    ],
  },
  {
    taskType: 'phase_planning',
    description: 'Plan the next iterative phase from roadmap, TODO, and completed phase reports.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: [
      'platform.health',
      'platform.tool_summary',
      'memory.search',
      'integration.workflow_index',
    ],
    evidenceTools: ['repository.search_files', 'git.recent_changes'],
    planningTools: ['planning.create_plan', 'planning.impact_report'],
    verificationTools: ['token_budget.estimate'],
    primaryModules: ['planning-impact', 'project-memory', 'integration-telemetry'],
    relevantFiles: ['ROADMAP.md', 'TODO.md', 'docs/phase-*.md'],
    targetTokenRange: { min: 2000, max: 5000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use roadmap, TODO, and phase report excerpts instead of full historical documents.',
      'Use git recent changes only to validate current status or regression risk.',
      'Create impact reports after target files and modules are known.',
    ],
    doNotCallTools: [
      'repository.read_file_context for ROADMAP.md, TODO.md, or docs/phase-*.md',
      'repository.read_module_context',
      'repository.import_graph',
      'repository.call_graph',
      'platform.metadata',
    ],
    avoidUntilNeeded: ['patch.apply_proposal'],
  },
  {
    taskType: 'planning',
    description:
      'Plan features or refactors with roadmap, TODO, phase reports, and narrow impact evidence.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'platform.tool_summary', 'integration.workflow_index'],
    evidenceTools: [
      'repository.search_files',
      'repository.read_file_excerpt',
      'repository.search_symbols',
      'git.recent_changes',
    ],
    planningTools: ['planning.create_plan', 'planning.impact_report', 'token_budget.estimate'],
    verificationTools: ['integration.auto_telemetry_summary'],
    primaryModules: ['planning-impact', 'repository-intelligence', 'git-intelligence'],
    relevantFiles: ['ROADMAP.md', 'TODO.md', 'docs/phase-*.md', 'target feature files'],
    targetTokenRange: { min: 2000, max: 6000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use excerpts from planning artifacts and only the target implementation files.',
      'Do not read completed phase reports fully unless the plan depends on that phase detail.',
      'Use planning.impact_report before implementation when target files are identified.',
    ],
    workflowAcceptanceCriteria: [
      'Uses roadmap, TODO, phase-report excerpts, and focused target-file evidence.',
      'Creates or references an impact report after target files are known.',
      'Defines approval, verification, rollback, risks, and non-goals before edits.',
      'Keeps implementation context separate until the plan is approved.',
    ],
    doNotCallTools: [
      'repository.read_file_context for ROADMAP.md, TODO.md, or docs/phase-*.md',
      'repository.read_module_context',
      'repository.import_graph',
      'repository.call_graph',
      'platform.metadata',
    ],
    avoidUntilNeeded: [
      'repository.read_file_context for historical phase reports',
      'repository.import_graph unless architecture coupling is the planning question',
      'patch.apply_proposal before plan approval',
    ],
  },
  {
    taskType: 'patch_execution',
    description: 'Create, apply, verify, and roll back approved deterministic patches.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['planning.summarize_plan', 'planning.approval_gate'],
    evidenceTools: ['repository.read_file_context', 'git.impact_hints'],
    planningTools: ['patch.create_proposal', 'patch.rollback_plan'],
    verificationTools: ['patch.apply_proposal', 'verification.run_check', 'patch.rollback_apply'],
    primaryModules: ['patch-verification', 'planning-impact', 'git-intelligence'],
    relevantFiles: ['src/modules/patch-verification', 'src/modules/planning-impact'],
    targetTokenRange: { min: 2000, max: 5000 },
    excerptMaxBytes: 1200,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use approved plan summaries and target files as the context boundary.',
      'Read git impact hints before applying patches.',
      'Keep verification output focused to failing commands and changed files.',
    ],
    doNotCallTools: ['repository.read_module_context', 'platform.metadata'],
    avoidUntilNeeded: ['direct file writes outside approved patch flow'],
  },
  {
    taskType: 'token_optimization',
    description: 'Reduce context usage with MCP-first evidence, estimates, and compression.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['platform.health', 'token_budget.recommend_strategy'],
    evidenceTools: [
      'token_budget.estimate',
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
    ],
    planningTools: ['token_budget.compress_context'],
    verificationTools: ['integration.telemetry_summary'],
    primaryModules: ['token-budget', 'integration-telemetry', 'repository-intelligence'],
    relevantFiles: ['src/modules/token-budget', 'src/modules/integration-telemetry', 'AGENTS.md'],
    targetTokenRange: { min: 1000, max: 3000 },
    excerptMaxBytes: 900,
    maxExcerptCalls: 3,
    contextPolicy: [
      'Estimate before expanding context.',
      'Replace largest context sources with project profiles, file excerpts, or symbol context.',
      'Use telemetry to identify the largest token source and update routing guidance.',
    ],
    doNotCallTools: ['repository.read_module_context', 'platform.metadata'],
    avoidUntilNeeded: [
      'repository.import_graph unless it was the largest token source under investigation',
      'repository.read_module_context',
      'repository.read_file_context for routine summaries',
      'full repository file reads',
    ],
  },
  {
    taskType: 'plugin_workflow',
    description:
      'Validate, stage, and inspect local or remote plugins without executing untrusted code.',
    gateMode: 'expanded_execution',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['plugin.catalog', 'plugin.validate_manifest'],
    evidenceTools: [
      'plugin.resolve_compatibility',
      'plugin.remote_stage_plan',
      'plugin.verify_artifact',
    ],
    planningTools: ['plugin.install_plan', 'plugin.update_plan', 'plugin.remove_plan'],
    verificationTools: ['plugin.inventory', 'plugin.staged_inventory'],
    primaryModules: ['plugin-marketplace', 'core/registry'],
    relevantFiles: ['src/modules/plugin-marketplace', 'src/plugins/plugin-api'],
    targetTokenRange: { min: 2000, max: 5000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use manifest metadata and validation results before inspecting plugin code.',
      'Keep remote artifact evidence as metadata only unless verification fails.',
      'Read SDK contracts only for compatibility questions.',
    ],
    doNotCallTools: ['repository.read_module_context', 'platform.metadata'],
    avoidUntilNeeded: ['dynamic import of plugin code', 'network downloads'],
  },
  {
    taskType: 'database_analysis',
    description: 'Inspect database capabilities and schema through read-only tools.',
    gateMode: 'compact_read_only',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['database.supported_dialects', 'database.connection_profile'],
    evidenceTools: ['database.schema', 'database.relations', 'database.query_preview'],
    planningTools: ['planning.impact_report'],
    verificationTools: ['security.audit_project'],
    primaryModules: ['database-intelligence', 'planning-impact'],
    relevantFiles: ['src/modules/database-intelligence'],
    targetTokenRange: { min: 2000, max: 5000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    contextPolicy: [
      'Use connection profiles and schema summaries before query previews.',
      'Keep query previews bounded and read-only.',
      'Use relation summaries before reading database module internals.',
    ],
    doNotCallTools: [
      'database write operations',
      'repository.read_module_context',
      'platform.metadata',
    ],
    avoidUntilNeeded: ['database write operations', 'external network database execution'],
  },
  {
    taskType: 'git_analysis',
    description: 'Use read-only git history to understand risk, ownership, and change frequency.',
    gateMode: 'compact_read_only',
    defaultReportMode: DEFAULT_REPORT_MODE,
    debugReportTriggers: DEBUG_REPORT_TRIGGERS,
    startTools: ['git.recent_changes'],
    evidenceTools: ['git.blame', 'git.find_commit_by_file', 'git.impact_hints'],
    planningTools: ['planning.impact_report'],
    verificationTools: ['integration.record_tool_usage'],
    primaryModules: ['git-intelligence', 'planning-impact'],
    relevantFiles: ['src/modules/git-intelligence'],
    targetTokenRange: { min: 1500, max: 4000 },
    excerptMaxBytes: 900,
    maxExcerptCalls: 3,
    contextPolicy: [
      'Start with recent changes or impact hints, then narrow to blame or file history.',
      'Use git evidence to choose target files before repository reads.',
      'Keep history depth bounded to the current question.',
    ],
    doNotCallTools: ['git write commands', 'repository.read_module_context', 'platform.metadata'],
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
          reason: toolsPassed
            ? 'All expected tools are available.'
            : `Missing tools: ${missingTools.join(', ')}`,
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
    const sessions = input.sessionId
      ? this.sessions.has(input.sessionId)
        ? 1
        : 0
      : this.sessions.size;
    const successfulCalls = records.filter((record) => record.status === 'success').length;
    const failedCalls = records.filter((record) => record.status === 'failed').length;
    const fallbackCalls = records.filter((record) => record.fallbackUsed).length;
    const estimatedInputTokens = records.reduce(
      (sum, record) => sum + record.estimatedInputTokens,
      0,
    );
    const estimatedOutputTokens = records.reduce(
      (sum, record) => sum + record.estimatedOutputTokens,
      0,
    );
    const estimatedManualReadTokensAvoided = records
      .filter((record) => !record.fallbackUsed && record.status === 'success')
      .reduce(
        (sum, record) => sum + record.estimatedOutputTokens * MANUAL_READ_AVOIDED_MULTIPLIER,
        0,
      );

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
        ? [
            entry.taskType,
            entry.description,
            ...entry.startTools,
            ...entry.evidenceTools,
            ...entry.primaryModules,
            ...entry.relevantFiles,
            ...entry.contextPolicy,
            ...(entry.workflowAcceptanceCriteria ?? []),
            ...entry.doNotCallTools,
            ...entry.avoidUntilNeeded,
          ]
            .join('\n')
            .toLowerCase()
            .includes(query)
        : true;
      return taskMatches && queryMatches;
    });

    return {
      entries,
      recommendations:
        entries.length > 0
          ? [
              'Start with the listed startTools, then expand only through evidenceTools that answer the current question.',
            ]
          : [
              'No workflow matched. Use platform.health, platform.tool_summary, and repository.project_profile to gather a first routing signal.',
            ],
    };
  }

  private readinessRecommendations(
    ready: boolean,
    missingTools: readonly string[],
    instructionsLoaded: boolean,
  ): readonly string[] {
    if (ready) {
      return [
        'Use MCP-first repository analysis and record tool usage telemetry for token-saving measurement.',
      ];
    }

    const recommendations = [
      'Open a new Codex session after MCP config changes so tool namespaces refresh.',
    ];
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
      return [
        'No telemetry recorded yet. Record tool usage after MCP calls to measure real adoption.',
      ];
    }
    const recommendations = [
      'Compare estimated avoided manual-read tokens against direct file-read workflows.',
      'Exact total Codex billing is unavailable unless the Codex host provides model usage metadata.',
    ];
    if (fallbackCalls > 0) {
      recommendations.push(
        'Investigate fallback reasons and improve MCP availability or tool coverage.',
      );
    }
    if (failedCalls > 0) {
      recommendations.push(
        'Review failed MCP tool calls and add readiness checks or clearer error guidance.',
      );
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
    return (
      values.map((value) => JSON.stringify(value)).join('\n') + (values.length > 0 ? '\n' : '')
    );
  }
}
