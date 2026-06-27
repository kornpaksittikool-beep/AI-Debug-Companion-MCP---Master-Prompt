import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import type { JsonSchemaObject } from '../../src/core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function manifest() {
  return {
    name: 'remote-fixture-plugin',
    version: '1.0.0',
    description: 'Remote fixture plugin.',
    compatibility: {
      platformVersionRange: '>=0.1.0 <1.0.0',
      runtime: 'node',
    },
    tools: [
      {
        name: 'remote.fixture',
        version: '1.0.0',
        description: 'Remote fixture tool.',
        module: 'remote-fixture-plugin',
        inputSchema: { type: 'object', properties: {} },
        outputSchema: { type: 'object', properties: {} },
        errorSchema: { type: 'object', properties: {} },
        permissions: NO_PERMISSION,
        timeoutMs: 1000,
        retryStrategy: NO_RETRY,
        sideEffects: 'read',
        examples: [],
      },
    ],
  };
}

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
        'plugin.remote_stage_plan',
        'plugin.verify_artifact',
        'plugin.stage_remote',
        'plugin.staged_inventory',
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

  it('executes remote plugin staging through core execution', async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-remote-integration-'));
    const artifactContent = 'remote artifact bytes';
    const source = {
      type: 'https_archive',
      url: 'https://example.com/plugin.tgz',
      checksumAlgorithm: 'sha256',
      checksum: sha256(artifactContent),
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'plugin.stage_remote',
      input: {
        rootPath,
        manifest: manifest(),
        source,
        artifactContent,
      } as unknown as JsonSchemaObject,
      correlationId: 'corr_plugin_stage_remote',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.status).toBe('completed');
    }

    const inventory = await execution.execute({
      toolName: 'plugin.staged_inventory',
      input: { rootPath },
      correlationId: 'corr_plugin_staged_inventory',
    });
    expect(inventory.ok).toBe(true);
    if (inventory.ok) {
      expect(inventory.output.stagedPlugins).toEqual([
        expect.objectContaining({ pluginName: 'remote-fixture-plugin' }),
      ]);
    }

    await moduleRef.close();
  });
});
