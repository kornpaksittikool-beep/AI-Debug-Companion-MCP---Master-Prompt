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
        'repository.overview',
        'repository.search_symbols',
        'repository.import_graph',
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
    expect(result.missingTools).toContain('repository.overview');
    expect(result.recommendations).toContain('Open the session from the repository root so AGENTS.md is loaded.');
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
      expect.arrayContaining(['platform.health', 'investigation.create', 'repository.overview']),
    );
    expect(result.entries[0]?.relevantFiles).toContain('src/modules/investigation');
  });
});

function createService(): IntegrationTelemetryService {
  return new IntegrationTelemetryService(
    new IntegrationTelemetryPathService(new RepositorySafetyService(new PathPolicyService())),
  );
}
