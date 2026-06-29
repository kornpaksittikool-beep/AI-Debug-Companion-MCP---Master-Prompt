import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import type { WorkflowTaskType } from '../../src/modules/integration-telemetry/interfaces/integration-telemetry.interface.js';
import { IntegrationTelemetryPathService } from '../../src/modules/integration-telemetry/services/integration-telemetry-path.service.js';
import { IntegrationTelemetryService } from '../../src/modules/integration-telemetry/services/integration-telemetry.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

describe('IntegrationTelemetryService', () => {
  let service: IntegrationTelemetryService;

  beforeEach(() => {
    service = createService();
  });

  it('checks Codex integration readiness from provided evidence', () => {
    const result = service.readiness({
      configuredServerName: 'ai_engineering_platform',
      availableTools: [
        'platform.health',
        'platform.tool_summary',
        'repository.project_profile',
        'repository.search_files',
        'repository.search_symbols',
        'repository.read_file_excerpt',
        'token_budget.estimate',
        'token_budget.recommend_strategy',
      ],
      agentsInstructionLoaded: true,
    });

    expect(result.ready).toBe(true);
    expect(result.missingTools).toEqual([]);
    expect(result.checks.every((check) => check.status === 'passed')).toBe(true);
  });

  it('reports missing readiness requirements', () => {
    const result = service.readiness({
      configuredServerName: 'wrong',
      availableTools: ['platform.health'],
      agentsInstructionLoaded: false,
    });

    expect(result.ready).toBe(false);
    expect(result.missingTools).toContain('repository.project_profile');
    expect(result.recommendations).toContain(
      'Open the session from the repository root so AGENTS.md is loaded.',
    );
  });

  it('records tool usage and summarizes estimated savings', async () => {
    const session = service.startSession({
      client: 'codex',
      workspaceRoot: '/repo',
      sessionId: 'session-1',
    });
    service.recordToolUsage({
      sessionId: session.id,
      toolName: 'repository.overview',
      status: 'success',
      estimatedInputTokens: 20,
      estimatedOutputTokens: 100,
    });
    service.recordToolUsage({
      sessionId: session.id,
      toolName: 'repository.search_symbols',
      status: 'failed',
      estimatedInputTokens: 10,
      estimatedOutputTokens: 5,
      fallbackUsed: true,
      fallbackReason: 'MCP unavailable',
    });

    const summary = await service.summary({ sessionId: session.id });

    expect(summary).toMatchObject({
      sessions: 1,
      toolCalls: 2,
      successfulCalls: 1,
      failedCalls: 1,
      fallbackCalls: 1,
      estimatedInputTokens: 30,
      estimatedOutputTokens: 105,
      estimatedManualReadTokensAvoided: 600,
    });
    expect(summary.topTools[0]?.toolName).toBe('repository.overview');
  });

  it('flushes telemetry to disk and reads it back for summaries', async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'integration-telemetry-'));
    const session = service.startSession({
      client: 'codex',
      workspaceRoot: rootPath,
      sessionId: 'persisted-session',
    });
    service.recordToolUsage({
      sessionId: session.id,
      toolName: 'integration.workflow_index',
      status: 'success',
      estimatedOutputTokens: 20,
    });

    const flushed = await service.flush({ rootPath });
    const reloaded = createService();
    const summary = await reloaded.summary({ rootPath, sessionId: session.id });

    expect(flushed.recordsWritten).toBe(1);
    expect(flushed.recordsPath).toContain('.ai-engineering-platform');
    expect(summary.toolCalls).toBe(1);
    expect(summary.estimatedManualReadTokensAvoided).toBe(120);
  });

  it('returns workflow index entries for task routing', () => {
    const result = service.workflowIndex({ taskType: 'bug_investigation' });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.startTools).toEqual(
      expect.arrayContaining(['platform.health', 'platform.tool_summary', 'investigation.create']),
    );
    expect(result.entries[0]?.startTools).not.toContain('repository.overview');
    expect(result.entries[0]?.relevantFiles).toContain('src/modules/investigation');
    expect(result.entries[0]?.targetTokenRange).toEqual({ min: 3000, max: 8000 });
  });

  it('returns low-token project summary routing without import graph by default', () => {
    const result = service.workflowIndex({ taskType: 'project_summary' });
    const entry = result.entries[0];

    expect(entry?.startTools).toEqual(['platform.health', 'repository.project_profile']);
    expect(entry?.gateMode).toBe('compact_read_only');
    expect(entry?.defaultReportMode).toBe('normal_user_summary');
    expect(entry?.debugReportTriggers).toEqual([
      'tools used',
      'telemetry',
      'token detail',
      'evidence detail',
      'debug MCP',
    ]);
    expect(entry?.targetTokenRange).toEqual({ min: 1000, max: 2000 });
    expect(entry?.excerptMaxBytes).toBe(700);
    expect(entry?.maxExcerptCalls).toBe(2);
    expect(entry?.contextPolicy).toContain(
      'Start every explicit skill response with a Workflow Gate; use compact_read_only mode for routine summaries.',
    );
    expect(entry?.contextPolicy).toContain(
      'For normal_user_summary, keep routine read-only Workflow Gate output to 1-2 short lines while preserving evidence, no-change impact, and MCP route.',
    );
    expect(entry?.contextPolicy).toContain(
      'Use debug_telemetry only when the user asks for tools used, telemetry, token detail, evidence detail, or debug MCP.',
    );
    expect(entry?.contextPolicy).toContain(
      'For read-only project summaries, set Impact to "No file changes", Approval to "Not required: read-only", and Verification to evidence/tool output plus the telemetry footer.',
    );
    expect(entry?.contextPolicy).toContain(
      'In normal_user_summary, summarize evidence as short file labels such as README, package, or production checklist instead of absolute paths.',
    );
    expect(entry?.contextPolicy).toContain(
      'In normal_user_summary, summarize token status in one line, for example "Token: ~1.6k MCP payload, within target".',
    );
    expect(entry?.contextPolicy).toContain(
      'Use repository.project_profile with mode=summary as the main evidence artifact.',
    );
    expect(entry?.contextPolicy).toContain(
      'Skip platform.tool_summary for explicit project summaries unless tool availability is unclear.',
    );
    expect(entry?.contextPolicy).toContain(
      'Stop after repository.project_profile plus README/package excerpts when those answer the summary.',
    );
    expect(entry?.contextPolicy).toContain(
      'Do not call repository.search_files for routine summaries unless README/package cannot be found from the profile.',
    );
    expect(entry?.contextPolicy).toContain(
      'Do not run repository.search_symbols for routine summaries; use file search and excerpts instead.',
    );
    expect(entry?.contextPolicy).toContain(
      'Read 1 repository.read_file_excerpt result when possible, and at most 2 for README, package manifests, or entry points.',
    );
    expect(entry?.contextPolicy).toContain(
      'Pass purpose=summary and maxBytes <= 700 for summary excerpts.',
    );
    expect(entry?.contextPolicy).toContain(
      'If repository.read_file_excerpt is unavailable, answer from repository.project_profile plus evidence already gathered.',
    );
    expect(entry?.contextPolicy).toContain(
      'If evidence is insufficient, stop and say evidence is limited instead of reading broad file context.',
    );
    expect(entry?.contextPolicy).toContain(
      'Never fallback to repository.read_file_context for project_summary, project purpose, or normal_user_summary.',
    );
    expect(entry?.fallbackPolicy).toEqual({
      neverUseBroadFileContext: true,
      fallbackOrder: [
        'project_profile',
        'read_file_excerpt',
        'answer_with_limited_evidence',
        'ask_for_debug_detail',
      ],
    });
    expect(entry?.workflowAcceptanceCriteria).toEqual(
      expect.arrayContaining([
        'Starts with platform.health and repository.project_profile in summary mode.',
        'Never uses repository.read_file_context as a summary fallback.',
      ]),
    );
    expect(entry?.doNotCallTools).toEqual(
      expect.arrayContaining([
        'repository.import_graph',
        'repository.search_files for routine summaries when README/package are present in repository.project_profile',
        'repository.search_symbols',
        'repository.read_file_context',
        'repository.read_file_excerpt for docs/architecture.md or src/app.module.ts during routine summaries',
        'platform.tool_summary for explicit project summaries when repository.project_profile is available',
        'platform.metadata',
      ]),
    );
    expect(entry?.evidenceTools).toEqual(expect.arrayContaining(['repository.read_file_excerpt']));
    expect(entry?.evidenceTools).not.toContain('repository.search_files');
    expect(entry?.evidenceTools).not.toContain('repository.search_symbols');
    expect(entry?.evidenceTools).not.toContain('repository.import_graph');
    expect(entry?.avoidUntilNeeded).toEqual(
      expect.arrayContaining([
        'repository.import_graph unless dependency flow is the question',
        'repository.overview unless the compact profile is insufficient',
        'platform.tool_summary unless tool availability is unclear',
        'repository.search_files unless README/package cannot be found from the summary profile',
        'repository.read_file_context for summary fallback',
        'docs/architecture.md and source tree summaries unless architecture is the question',
      ]),
    );
  });

  it('returns a tech stack quick view route that stays manifest and excerpt first', () => {
    const result = service.workflowIndex({ taskType: 'tech_stack_quick_view' });
    const entry = result.entries[0];

    expect(entry?.targetTokenRange).toEqual({ min: 1500, max: 2500 });
    expect(entry?.relevantFiles).toEqual(
      expect.arrayContaining([
        'package.json',
        'nest-cli.json',
        'tsconfig.json',
        'src/app.module.ts',
      ]),
    );
    expect(entry?.evidenceTools).toEqual(
      expect.arrayContaining([
        'repository.read_file_excerpt',
        'repository.search_files',
        'repository.search_symbols',
      ]),
    );
    expect(entry?.avoidUntilNeeded).toContain(
      'repository.import_graph unless dependency flow is the question',
    );
  });

  it('returns a diff-scoped code review route', () => {
    const result = service.workflowIndex({ taskType: 'code_review' });
    const entry = result.entries[0];

    expect(entry?.startTools).toEqual([
      'platform.health',
      'platform.tool_summary',
      'git.impact_hints',
    ]);
    expect(entry?.targetTokenRange).toEqual({ min: 4000, max: 10000 });
    expect(entry?.gateMode).toBe('expanded_execution');
    expect(entry?.doNotCallTools).toContain('repository.scan');
    expect(entry?.contextPolicy).toContain(
      'Read diffs and impacted files first; avoid unrelated repository context.',
    );
    expect(entry?.workflowAcceptanceCriteria).toEqual(
      expect.arrayContaining([
        'Starts from changed files, diffs, or git impact hints.',
        'Reports findings first with severity and file references.',
      ]),
    );
    expect(entry?.avoidUntilNeeded).toContain('repository.overview for routine diff review');
  });

  it('returns real workflow acceptance criteria for Phase 40 workflows', () => {
    const workflowTypes: WorkflowTaskType[] = [
      'project_summary',
      'bug_investigation',
      'code_review',
      'planning',
    ];

    for (const taskType of workflowTypes) {
      const result = service.workflowIndex({ taskType });
      const entry = result.entries[0];

      expect(entry?.workflowAcceptanceCriteria?.length).toBeGreaterThanOrEqual(4);
      expect(entry?.verificationTools.length).toBeGreaterThan(0);
      expect(entry?.gateMode).toBe(
        taskType === 'project_summary' ? 'compact_read_only' : 'expanded_execution',
      );
    }
  });

  it('matches workflow queries against context policy text', () => {
    const result = service.workflowIndex({ query: 'diffs and impacted files' });

    expect(result.entries.map((entry) => entry.taskType)).toContain('code_review');
  });

  it('matches workflow queries against acceptance criteria text', () => {
    const result = service.workflowIndex({ query: 'root cause, confidence' });

    expect(result.entries.map((entry) => entry.taskType)).toContain('bug_investigation');
  });
});

function createService(): IntegrationTelemetryService {
  return new IntegrationTelemetryService(
    new IntegrationTelemetryPathService(new RepositorySafetyService(new PathPolicyService())),
  );
}
