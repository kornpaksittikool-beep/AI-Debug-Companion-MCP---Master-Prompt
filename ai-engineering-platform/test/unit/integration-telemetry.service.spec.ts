import { IntegrationTelemetryService } from '../../src/modules/integration-telemetry/services/integration-telemetry.service.js';

describe('IntegrationTelemetryService', () => {
  let service: IntegrationTelemetryService;

  beforeEach(() => {
    service = new IntegrationTelemetryService();
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

  it('records tool usage and summarizes estimated savings', () => {
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

    const summary = service.summary({ sessionId: session.id });

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
});
