import { IntegrationTelemetryService } from '../../src/modules/integration-telemetry/services/integration-telemetry.service.js';
import {
  IntegrationReadinessTool,
  IntegrationRecordToolUsageTool,
  IntegrationStartSessionTool,
  IntegrationTelemetrySummaryTool,
} from '../../src/modules/integration-telemetry/tools/integration-telemetry.tools.js';

describe('Integration telemetry tools', () => {
  it('executes session, usage, readiness, and summary handlers', async () => {
    const service = new IntegrationTelemetryService();
    const session = await new IntegrationStartSessionTool(service).execute({
      client: 'codex',
      workspaceRoot: '/repo',
      sessionId: 's1',
    });
    const usage = await new IntegrationRecordToolUsageTool(service).execute({
      sessionId: 's1',
      toolName: 'platform.health',
      status: 'success',
      estimatedOutputTokens: 10,
    });
    const readiness = await new IntegrationReadinessTool(service).execute({
      configuredServerName: 'ai_engineering_platform',
      expectedTools: ['platform.health'],
      availableTools: ['platform.health'],
      agentsInstructionLoaded: true,
    });
    const summary = await new IntegrationTelemetrySummaryTool(service).execute({ sessionId: 's1' });

    expect(session.id).toBe('s1');
    expect(usage.toolName).toBe('platform.health');
    expect(readiness.ready).toBe(true);
    expect(summary.toolCalls).toBe(1);
  });
});
