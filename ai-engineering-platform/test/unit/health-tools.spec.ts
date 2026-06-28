import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { HealthService } from '../../src/modules/health/services/health.service.js';
import { HealthTool } from '../../src/modules/health/tools/health.tool.js';
import { PlatformMetadataTool } from '../../src/modules/health/tools/platform-metadata.tool.js';
import { PlatformToolSummaryTool } from '../../src/modules/health/tools/platform-tool-summary.tool.js';

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

    const output = await tool.execute({});

    expect(output.platform).toBeDefined();
    expect(output.platform).toMatchObject({
      phase: 'phase-34-skip-tool-summary-for-summaries',
    });
    expect(output.tools).toEqual([]);
  });

  it('returns compact metadata without full tool details', async () => {
    const registry = new ToolRegistryService();
    registry.register(
      {
        name: 'sample.tool',
        version: '1.0.0',
        description: 'A sample tool with a longer description.',
        module: 'sample',
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        errorSchema: { type: 'object' },
        permissions: NO_PERMISSION,
        timeoutMs: 1000,
        retryStrategy: NO_RETRY,
        sideEffects: 'none',
        examples: [],
      },
      { execute: () => Promise.resolve({ ok: true }) },
    );
    const service = new HealthService(registry);
    const tool = new PlatformMetadataTool(service);

    const output = await tool.execute({ includeTools: false });

    expect(output.tools).toBeUndefined();
    expect(output.toolSummary).toMatchObject({
      totalTools: 1,
      modules: [{ module: 'sample', toolCount: 1, toolNames: ['sample.tool'] }],
    });
  });

  it('returns compact tool summary grouped by module', async () => {
    const registry = new ToolRegistryService();
    for (const name of ['sample.alpha', 'sample.beta']) {
      registry.register(
        {
          name,
          version: '1.0.0',
          description: `${name} description`,
          module: 'sample',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          errorSchema: { type: 'object' },
          permissions: NO_PERMISSION,
          timeoutMs: 1000,
          retryStrategy: NO_RETRY,
          sideEffects: 'none',
          examples: [],
        },
        { execute: () => Promise.resolve({ ok: true }) },
      );
    }
    const service = new HealthService(registry);
    const tool = new PlatformToolSummaryTool(service);

    const output = await tool.execute({});

    expect(output).toMatchObject({
      totalTools: 2,
      modules: [{ module: 'sample', toolCount: 2, toolNames: ['sample.alpha', 'sample.beta'] }],
    });
  });
});
