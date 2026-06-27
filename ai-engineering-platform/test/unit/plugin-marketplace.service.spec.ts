import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { ExampleEchoTool, ExamplePluginService } from '../../src/plugins/example/example-plugin.service.js';
import type { PluginManifest } from '../../src/plugins/plugin-api/plugin-manifest.interface.js';
import { PluginCompatibilityService } from '../../src/modules/plugin-marketplace/services/plugin-compatibility.service.js';
import { PluginLifecycleExecutorService } from '../../src/modules/plugin-marketplace/services/plugin-lifecycle-executor.service.js';
import { PluginManifestValidatorService } from '../../src/modules/plugin-marketplace/services/plugin-manifest-validator.service.js';
import { PluginMarketplaceService } from '../../src/modules/plugin-marketplace/services/plugin-marketplace.service.js';
import { PluginRemoteArtifactVerifierService } from '../../src/modules/plugin-marketplace/services/plugin-remote-artifact-verifier.service.js';
import { PluginRemoteStagingService } from '../../src/modules/plugin-marketplace/services/plugin-remote-staging.service.js';
import { PluginSdkMetadataService } from '../../src/modules/plugin-marketplace/services/plugin-sdk-metadata.service.js';
import { PluginStateStoreService } from '../../src/modules/plugin-marketplace/services/plugin-state-store.service.js';

type ManifestOverrides = Omit<Partial<PluginManifest>, 'compatibility'> & {
  readonly compatibility?: PluginManifest['compatibility'] | undefined;
  readonly omitCompatibility?: boolean;
};

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

function createManifest(overrides: ManifestOverrides = {}): PluginManifest {
  const { compatibility: compatibilityOverride, omitCompatibility, ...manifestOverrides } = overrides;
  const compatibility = compatibilityOverride ?? {
    platformVersionRange: '>=0.1.0 <1.0.0',
    nodeVersionRange: '>=22 <25',
    runtime: 'node' as const,
  };
  const manifest: PluginManifest = {
    name: 'fixture-plugin',
    version: '1.0.0',
    description: 'Fixture plugin.',
    tools: [toolDefinition],
    ...manifestOverrides,
    ...(omitCompatibility ? {} : { compatibility }),
  };
  return manifest;
}

function createMarketplace(): PluginMarketplaceService {
  const compatibility = new PluginCompatibilityService();
  return new PluginMarketplaceService(
    new ExamplePluginService(new ExampleEchoTool()),
    new PluginManifestValidatorService(compatibility),
    compatibility,
  );
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
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

describe('PluginManifestValidatorService', () => {
  it('validates complete marketplace manifests', () => {
    const result = new PluginManifestValidatorService(new PluginCompatibilityService()).validate(createManifest());

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('returns actionable issues for incomplete manifests', () => {
    const result = new PluginManifestValidatorService(new PluginCompatibilityService()).validate(
      createManifest({
        name: '',
        omitCompatibility: true,
        tools: [
          {
            ...toolDefinition,
            name: '',
            timeoutMs: 0,
          },
        ],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['name', 'compatibility', 'tools.0.name', 'tools.0.timeoutMs']),
    );
  });
});

describe('PluginCompatibilityService', () => {
  it('resolves compatible and incompatible version ranges', () => {
    const service = new PluginCompatibilityService();

    expect(service.resolve({ manifest: createManifest(), platformVersion: '0.1.0', nodeVersion: '22.1.0' })).toMatchObject({
      compatible: true,
    });
    expect(
      service.resolve({
        manifest: createManifest({
          compatibility: {
            platformVersionRange: '>=1.0.0 <2.0.0',
            nodeVersionRange: '>=22 <25',
            runtime: 'node',
          },
        }),
        platformVersion: '0.1.0',
      }),
    ).toMatchObject({
      compatible: false,
    });
  });
});

describe('PluginMarketplaceService', () => {
  it('lists bundled plugin catalog metadata', () => {
    const result = createMarketplace().catalog();

    expect(result.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'example-plugin',
          source: 'bundled',
          compatibilityStatus: 'compatible',
        }),
      ]),
    );
  });

  it('creates safe lifecycle plans that require approval', () => {
    const service = createMarketplace();
    const manifest = createManifest();

    expect(service.createInstallPlan({ manifest })).toMatchObject({
      action: 'install',
      pluginName: 'fixture-plugin',
      status: 'requires_approval',
      risk: 'low',
    });
    expect(service.createUpdatePlan({ manifest, targetVersion: '1.1.0' })).toMatchObject({
      action: 'update',
      currentVersion: '1.0.0',
      targetVersion: '1.1.0',
    });
    const removePlan = service.createRemovePlan({ manifest });
    expect(removePlan).toMatchObject({
      action: 'remove',
      currentVersion: '1.0.0',
    });
    expect(removePlan).not.toHaveProperty('targetVersion');
  });
});

describe('PluginSdkMetadataService', () => {
  it('returns language and external tool SDK contracts', () => {
    const result = new PluginSdkMetadataService().metadata();

    expect(result.languagePluginSdk.extensionPoints).toContain('repository.symbol_parser');
    expect(result.externalToolPluginSdk.securityRequirements).toContain(
      'Commands must use allow-listed executable names.',
    );
  });
});

describe('PluginLifecycleExecutorService', () => {
  async function createRoot(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'plugin-lifecycle-'));
  }

  function createExecutor(): PluginLifecycleExecutorService {
    const compatibility = new PluginCompatibilityService();
    return new PluginLifecycleExecutorService(
      new PluginStateStoreService(new PathPolicyService()),
      new PluginManifestValidatorService(compatibility),
    );
  }

  it('enables, inventories, reads lifecycle results, and disables local plugin state', async () => {
    const rootPath = await createRoot();
    const executor = createExecutor();
    const manifest = createManifest();

    const enabled = await executor.enable({ rootPath, manifest });
    expect(enabled).toMatchObject({
      action: 'enable',
      status: 'completed',
      pluginName: 'fixture-plugin',
    });

    const inventory = await executor.inventory({ rootPath });
    expect(inventory.plugins).toEqual([
      expect.objectContaining({ name: 'fixture-plugin', state: 'enabled' }),
    ]);

    await expect(executor.lifecycleResult({ rootPath, lifecycleId: enabled.lifecycleId })).resolves.toMatchObject({
      lifecycleId: enabled.lifecycleId,
      status: 'completed',
    });

    const disabled = await executor.disable({ rootPath, pluginName: 'fixture-plugin' });
    expect(disabled).toMatchObject({
      action: 'disable',
      status: 'completed',
    });
    expect(disabled.nextState?.state).toBe('disabled');
  });

  it('rejects broad permissions unless explicitly acknowledged', async () => {
    const rootPath = await createRoot();
    const executor = createExecutor();
    const broadManifest = createManifest({
      tools: [
        {
          ...toolDefinition,
          permissions: {
            ...NO_PERMISSION,
            network: { enabled: true },
          },
        },
      ],
    });

    await expect(executor.enable({ rootPath, manifest: broadManifest })).resolves.toMatchObject({
      status: 'rejected',
      reason: 'Plugin declares broad permissions and requires explicit acknowledgement.',
    });
    const staged = await executor.stageUpdate({
      rootPath,
      manifest: broadManifest,
      acknowledgeBroadPermissions: true,
    });
    expect(staged.status).toBe('completed');
    expect(staged.nextState?.state).toBe('staged_update');
  });
});

describe('PluginRemoteArtifactVerifierService', () => {
  it('verifies SHA-256 artifact checksums', () => {
    const content = 'remote artifact bytes';
    const result = new PluginRemoteArtifactVerifierService().verify({
      artifactContent: content,
      source: {
        type: 'https_archive',
        url: 'https://example.com/plugin.tgz',
        checksumAlgorithm: 'sha256',
        checksum: sha256(content),
      },
    });

    expect(result.valid).toBe(true);
    expect(result.actualChecksum).toBe(result.expectedChecksum);
  });

  it('rejects checksum mismatches and non-HTTPS sources', () => {
    const result = new PluginRemoteArtifactVerifierService().verify({
      artifactContent: 'actual',
      source: {
        type: 'https_archive',
        url: 'http://example.com/plugin.tgz',
        checksumAlgorithm: 'sha256',
        checksum: sha256('expected'),
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['source.url', 'source.checksum']),
    );
  });
});

describe('PluginRemoteStagingService', () => {
  it('creates reviewable remote staging plans', () => {
    const content = 'remote artifact bytes';
    const service = createRemoteStaging();

    const plan = service.createStagePlan({
      manifest: createManifest(),
      source: {
        type: 'github_release',
        url: 'https://github.com/example/plugin/releases/download/v1/plugin.tgz',
        checksumAlgorithm: 'sha256',
        checksum: sha256(content),
      },
    });

    expect(plan.status).toBe('requires_approval');
    expect(plan.validation.valid).toBe(true);
    expect(plan.steps).toEqual(expect.arrayContaining([expect.stringContaining('Write remote staging metadata')]));
  });

  it('stages verified remote plugin metadata without executing code', async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-plugin-stage-'));
    const content = 'remote artifact bytes';
    const service = createRemoteStaging();

    const result = await service.stageRemote({
      rootPath,
      manifest: createManifest(),
      source: {
        type: 'https_archive',
        url: 'https://example.com/plugin.tgz',
        checksumAlgorithm: 'sha256',
        checksum: sha256(content),
      },
      artifactContent: content,
    });

    expect(result.status).toBe('completed');
    expect(result.record?.state).toBe('staged_remote');
    const inventory = await service.stagedInventory({ rootPath });
    expect(inventory.stagedPlugins).toHaveLength(1);
    expect(inventory.stagedPlugins[0]?.pluginName).toBe('fixture-plugin');
  });

  it('rejects remote staging when checksum verification fails', async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-plugin-stage-reject-'));
    const service = createRemoteStaging();

    const result = await service.stageRemote({
      rootPath,
      manifest: createManifest(),
      source: {
        type: 'https_archive',
        url: 'https://example.com/plugin.tgz',
        checksumAlgorithm: 'sha256',
        checksum: sha256('expected'),
      },
      artifactContent: 'actual',
    });

    expect(result.status).toBe('rejected');
    const inventory = await service.stagedInventory({ rootPath });
    expect(inventory.stagedPlugins).toHaveLength(0);
  });
});
