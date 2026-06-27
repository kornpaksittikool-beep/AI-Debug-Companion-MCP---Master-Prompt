import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../src/core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import {
  PluginCatalogTool,
  PluginInstallPlanTool,
  PluginResolveCompatibilityTool,
  PluginSdkMetadataTool,
  PluginValidateManifestTool,
} from '../../src/modules/plugin-marketplace/tools/plugin-marketplace.tools.js';
import { PluginCompatibilityService } from '../../src/modules/plugin-marketplace/services/plugin-compatibility.service.js';
import { PluginManifestValidatorService } from '../../src/modules/plugin-marketplace/services/plugin-manifest-validator.service.js';
import { PluginMarketplaceService } from '../../src/modules/plugin-marketplace/services/plugin-marketplace.service.js';
import { PluginSdkMetadataService } from '../../src/modules/plugin-marketplace/services/plugin-sdk-metadata.service.js';
import { ExampleEchoTool, ExamplePluginService } from '../../src/plugins/example/example-plugin.service.js';
import type { PluginManifest } from '../../src/plugins/plugin-api/plugin-manifest.interface.js';

const toolDefinition: ToolDefinition = {
  name: 'fixture.tool',
  version: '1.0.0',
  description: 'Fixture tool.',
  module: 'fixture-plugin',
  inputSchema: { type: 'object', properties: {} },
  outputSchema: { type: 'object', properties: {} },
  errorSchema: { type: 'object', properties: {} },
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [],
};

const manifest: PluginManifest = {
  name: 'fixture-plugin',
  version: '1.0.0',
  description: 'Fixture plugin.',
  compatibility: {
    platformVersionRange: '>=0.1.0 <1.0.0',
    runtime: 'node',
  },
  tools: [toolDefinition],
};

const manifestInput = { manifest } as unknown as JsonSchemaObject;

function createMarketplace(): PluginMarketplaceService {
  const compatibility = new PluginCompatibilityService();
  return new PluginMarketplaceService(
    new ExamplePluginService(new ExampleEchoTool()),
    new PluginManifestValidatorService(compatibility),
    compatibility,
  );
}

describe('Plugin marketplace tools', () => {
  it('executes catalog and manifest validation handlers', async () => {
    const service = createMarketplace();

    await expect(new PluginCatalogTool(service).execute({})).resolves.toMatchObject({
      plugins: [expect.objectContaining({ name: 'example-plugin' })],
    });
    await expect(new PluginValidateManifestTool(service).execute(manifestInput)).resolves.toMatchObject({
      valid: true,
    });
    await expect(new PluginResolveCompatibilityTool(service).execute(manifestInput)).resolves.toMatchObject({
      compatible: true,
    });
  });

  it('executes lifecycle and SDK metadata handlers', async () => {
    const service = createMarketplace();

    await expect(new PluginInstallPlanTool(service).execute(manifestInput)).resolves.toMatchObject({
      status: 'requires_approval',
      action: 'install',
    });
    const sdkMetadata = (await new PluginSdkMetadataTool(new PluginSdkMetadataService()).execute({})) as unknown as {
      readonly languagePluginSdk: { readonly version: string };
    };
    expect(sdkMetadata.languagePluginSdk.version).toBe('1.0.0');
  });
});
