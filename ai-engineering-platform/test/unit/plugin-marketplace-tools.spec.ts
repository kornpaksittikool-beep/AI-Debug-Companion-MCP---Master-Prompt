import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../src/core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  PluginCatalogTool,
  PluginDisableTool,
  PluginEnableTool,
  PluginInstallPlanTool,
  PluginInventoryTool,
  PluginLifecycleResultTool,
  PluginRemoteStagePlanTool,
  PluginResolveCompatibilityTool,
  PluginSdkMetadataTool,
  PluginStageRemoteTool,
  PluginStageUpdateTool,
  PluginStagedInventoryTool,
  PluginValidateManifestTool,
  PluginVerifyArtifactTool,
} from '../../src/modules/plugin-marketplace/tools/plugin-marketplace.tools.js';
import { PluginCompatibilityService } from '../../src/modules/plugin-marketplace/services/plugin-compatibility.service.js';
import { PluginLifecycleExecutorService } from '../../src/modules/plugin-marketplace/services/plugin-lifecycle-executor.service.js';
import { PluginManifestValidatorService } from '../../src/modules/plugin-marketplace/services/plugin-manifest-validator.service.js';
import { PluginMarketplaceService } from '../../src/modules/plugin-marketplace/services/plugin-marketplace.service.js';
import { PluginRemoteArtifactVerifierService } from '../../src/modules/plugin-marketplace/services/plugin-remote-artifact-verifier.service.js';
import { PluginRemoteStagingService } from '../../src/modules/plugin-marketplace/services/plugin-remote-staging.service.js';
import { PluginSdkMetadataService } from '../../src/modules/plugin-marketplace/services/plugin-sdk-metadata.service.js';
import { PluginStateStoreService } from '../../src/modules/plugin-marketplace/services/plugin-state-store.service.js';
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

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function createMarketplace(): PluginMarketplaceService {
  const compatibility = new PluginCompatibilityService();
  return new PluginMarketplaceService(
    new ExamplePluginService(new ExampleEchoTool()),
    new PluginManifestValidatorService(compatibility),
    compatibility,
  );
}

describe('Plugin marketplace tools', () => {
  async function createRoot(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'plugin-tools-'));
  }

  function createExecutor(): PluginLifecycleExecutorService {
    const compatibility = new PluginCompatibilityService();
    return new PluginLifecycleExecutorService(
      new PluginStateStoreService(new PathPolicyService()),
      new PluginManifestValidatorService(compatibility),
    );
  }

  function createRemoteStaging(): PluginRemoteStagingService {
    const compatibility = new PluginCompatibilityService();
    return new PluginRemoteStagingService(
      new PathPolicyService(),
      new PluginManifestValidatorService(compatibility),
      compatibility,
      new PluginRemoteArtifactVerifierService(),
    );
  }

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

  it('executes dynamic plugin state handlers', async () => {
    const rootPath = await createRoot();
    const executor = createExecutor();
    const enableInput = { rootPath, manifest } as unknown as JsonSchemaObject;

    const enabled = (await new PluginEnableTool(executor).execute(enableInput)) as unknown as {
      readonly lifecycleId: string;
      readonly status: string;
    };
    expect(enabled.status).toBe('completed');
    await expect(new PluginInventoryTool(executor).execute({ rootPath })).resolves.toMatchObject({
      plugins: [expect.objectContaining({ state: 'enabled' })],
    });
    await expect(new PluginLifecycleResultTool(executor).execute({ rootPath, lifecycleId: enabled.lifecycleId })).resolves.toMatchObject({
      lifecycleId: enabled.lifecycleId,
    });
    await expect(new PluginDisableTool(executor).execute({ rootPath, pluginName: 'fixture-plugin' })).resolves.toMatchObject({
      status: 'completed',
    });
    const staged = (await new PluginStageUpdateTool(executor).execute(enableInput)) as unknown as {
      readonly status: string;
      readonly nextState?: { readonly state: string };
    };
    expect(staged.status).toBe('completed');
    expect(staged.nextState?.state).toBe('staged_update');
  });

  it('executes remote plugin staging handlers', async () => {
    const rootPath = await createRoot();
    const content = 'remote artifact bytes';
    const source = {
      type: 'https_archive',
      url: 'https://example.com/plugin.tgz',
      checksumAlgorithm: 'sha256',
      checksum: sha256(content),
    };
    const remoteStaging = createRemoteStaging();
    const verifier = new PluginRemoteArtifactVerifierService();

    const stagePlan = await new PluginRemoteStagePlanTool(remoteStaging).execute({
      manifest,
      source,
    } as unknown as JsonSchemaObject);
    expect(stagePlan.status).toBe('requires_approval');
    expect((stagePlan.validation as { readonly valid: boolean }).valid).toBe(true);
    await expect(new PluginVerifyArtifactTool(verifier).execute({ source, artifactContent: content })).resolves.toMatchObject({
      valid: true,
    });
    await expect(
      new PluginStageRemoteTool(remoteStaging).execute({
        rootPath,
        manifest,
        source,
        artifactContent: content,
      } as unknown as JsonSchemaObject),
    ).resolves.toMatchObject({
      status: 'completed',
    });
    await expect(new PluginStagedInventoryTool(remoteStaging).execute({ rootPath })).resolves.toMatchObject({
      stagedPlugins: [expect.objectContaining({ pluginName: 'fixture-plugin' })],
    });
  });
});
