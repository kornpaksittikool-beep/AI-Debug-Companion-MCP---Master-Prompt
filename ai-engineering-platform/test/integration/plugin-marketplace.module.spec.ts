import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('PluginMarketplaceModule integration', () => {
  it('registers plugin marketplace tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'plugin.catalog',
        'plugin.validate_manifest',
        'plugin.resolve_compatibility',
        'plugin.install_plan',
        'plugin.remove_plan',
        'plugin.update_plan',
        'plugin.sdk_metadata',
        'plugin.inventory',
        'plugin.enable',
        'plugin.disable',
        'plugin.stage_update',
        'plugin.lifecycle_result',
        'example.echo',
      ]),
    );

    await moduleRef.close();
  });

  it('executes plugin catalog through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'plugin.catalog',
      input: {},
      correlationId: 'corr_plugin_catalog',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.plugins).toEqual([expect.objectContaining({ name: 'example-plugin' })]);
    }

    await moduleRef.close();
  });
});
