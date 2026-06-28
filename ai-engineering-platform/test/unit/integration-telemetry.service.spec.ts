import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
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

    expect(entry?.startTools).toEqual([
      'platform.health',
      'platform.tool_summary',
      'repository.project_profile',
    ]);
    expect(entry?.targetTokenRange).toEqual({ min: 1000, max: 2000 });
    expect(entry?.excerptMaxBytes).toBe(700);
    expect(entry?.maxExcerptCalls).toBe(2);
    expect(entry?.contextPolicy).toContain(
      'Use repository.project_profile as the main evidence artifact.',
    );
    expect(entry?.contextPolicy).toContain(
      'Do not run repository.search_symbols for routine summaries; use file search and excerpts instead.',
    );
    expect(entry?.doNotCallTools).toEqual(
      expect.arrayContaining([
        'repository.import_graph',
        'repository.search_symbols',
        'repository.read_file_context',
        'platform.metadata',
      ]),
    );
    expect(entry?.evidenceTools).toEqual(
      expect.arrayContaining([
        'repository.search_files',
        'repository.read_file_excerpt',
      ]),
    );
    expect(entry?.evidenceTools).not.toContain('repository.search_symbols');
    expect(entry?.evidenceTools).not.toContain('repository.import_graph');
    expect(entry?.avoidUntilNeeded).toEqual(
      expect.arrayContaining([
        'repository.import_graph unless dependency flow is the question',
        'repository.overview unless the compact profile is insufficient',
        'repository.read_file_context unless a compact excerpt is insufficient',
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
    expect(entry?.doNotCallTools).toContain('repository.scan');
    expect(entry?.contextPolicy).toContain(
      'Read diffs and impacted files first; avoid unrelated repository context.',
    );
    expect(entry?.avoidUntilNeeded).toContain('repository.overview for routine diff review');
  });

  it('matches workflow queries against context policy text', () => {
    const result = service.workflowIndex({ query: 'diffs and impacted files' });

    expect(result.entries.map((entry) => entry.taskType)).toContain('code_review');
  });
});

function createService(): IntegrationTelemetryService {
  return new IntegrationTelemetryService(
    new IntegrationTelemetryPathService(new RepositorySafetyService(new PathPolicyService())),
  );
}
