import { IntegrationTelemetryService } from '../../src/modules/integration-telemetry/services/integration-telemetry.service.js';
import {
  IntegrationReadinessTool,
  IntegrationRecordToolUsageTool,
  IntegrationStartSessionTool,
  IntegrationTelemetrySummaryTool,
  IntegrationWorkflowIndexTool,
} from '../../src/modules/integration-telemetry/tools/integration-telemetry.tools.js';
import { IntegrationTelemetryPathService } from '../../src/modules/integration-telemetry/services/integration-telemetry-path.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';

describe('Integration telemetry tools', () => {
  it('executes session, usage, readiness, and summary handlers', async () => {
    const service = createService();
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
    const index = await new IntegrationWorkflowIndexTool(service).execute({ taskType: 'token_optimization' });

    expect(session.id).toBe('s1');
    expect(usage.toolName).toBe('platform.health');
    expect(readiness.ready).toBe(true);
    expect(summary.toolCalls).toBe(1);
    expect(index.entries).toHaveLength(1);
  });
});

function createService(): IntegrationTelemetryService {
  return new IntegrationTelemetryService(
    new IntegrationTelemetryPathService(new RepositorySafetyService(new PathPolicyService())),
  );
}
