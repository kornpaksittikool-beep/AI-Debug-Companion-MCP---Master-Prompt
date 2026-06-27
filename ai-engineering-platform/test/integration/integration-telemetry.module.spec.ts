import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('IntegrationTelemetryModule integration', () => {
  it('registers integration telemetry tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'integration.start_session',
        'integration.record_tool_usage',
        'integration.readiness',
        'integration.telemetry_summary',
        'integration.flush_telemetry',
        'integration.workflow_index',
      ]),
    );

    await moduleRef.close();
  });

  it('executes readiness check through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'integration.readiness',
      input: {
        configuredServerName: 'ai_engineering_platform',
        expectedTools: ['platform.health'],
        availableTools: ['platform.health'],
        agentsInstructionLoaded: true,
      },
      correlationId: 'corr_integration_readiness',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatchObject({ ready: true });
    }

    await moduleRef.close();
  });

  it('executes workflow index through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'integration.workflow_index',
      input: { taskType: 'patch_execution' },
      correlationId: 'corr_workflow_index',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.entries).toHaveLength(1);
    }

    await moduleRef.close();
  });
});
