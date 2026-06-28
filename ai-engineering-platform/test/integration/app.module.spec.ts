import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('AppModule integration', () => {
  it('registers built-in tools and example plugin through the registry', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining(['platform.health', 'platform.metadata', 'platform.tool_summary', 'example.echo']),
    );

    await moduleRef.close();
  });

  it('executes tool calls through the core execution service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'example.echo',
      input: { message: 'hello' },
      correlationId: 'corr_123',
    });

    expect(result).toEqual({
      ok: true,
      output: { message: 'hello' },
      correlationId: 'corr_123',
    });

    await moduleRef.close();
  });
});
