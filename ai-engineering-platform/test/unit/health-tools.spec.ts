import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import { HealthService } from '../../src/modules/health/services/health.service.js';
import { HealthTool } from '../../src/modules/health/tools/health.tool.js';
import { PlatformMetadataTool } from '../../src/modules/health/tools/platform-metadata.tool.js';

describe('Health tools', () => {
  it('returns health status', async () => {
    const registry = new ToolRegistryService();
    const service = new HealthService(registry);
    const tool = new HealthTool(service);

    const output = await tool.execute();

    expect(output.status).toBe('ok');
    expect(typeof output.timestamp).toBe('string');
  });

  it('returns registered tool metadata', async () => {
    const registry = new ToolRegistryService();
    const service = new HealthService(registry);
    const tool = new PlatformMetadataTool(service);

    const output = await tool.execute();

    expect(output.platform).toBeDefined();
    expect(output.platform).toMatchObject({
      phase: 'phase-18-token-budget-context-compression',
    });
    expect(output.tools).toEqual([]);
  });
});
