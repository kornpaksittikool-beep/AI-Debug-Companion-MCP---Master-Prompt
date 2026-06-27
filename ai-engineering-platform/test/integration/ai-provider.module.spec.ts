import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('AiProviderModule integration', () => {
  it('registers AI provider tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'ai.providers',
        'ai.provider_metadata',
        'ai.validate_request',
        'ai.route_request',
      ]),
    );

    await moduleRef.close();
  });

  it('executes AI provider routing through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'ai.route_request',
      input: {
        capability: 'tool_use',
        preferredProviderIds: ['openai'],
        requireToolUse: true,
      },
      correlationId: 'corr_ai_route',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.selected).toMatchObject({ providerId: 'openai' });
    }

    await moduleRef.close();
  });
});
