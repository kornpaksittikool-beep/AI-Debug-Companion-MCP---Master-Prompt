import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { ExampleEchoTool, ExamplePluginService } from '../../src/plugins/example/example-plugin.service.js';
import type { PluginManifest } from '../../src/plugins/plugin-api/plugin-manifest.interface.js';
import { PluginCompatibilityService } from '../../src/modules/plugin-marketplace/services/plugin-compatibility.service.js';
import { PluginManifestValidatorService } from '../../src/modules/plugin-marketplace/services/plugin-manifest-validator.service.js';
import { PluginMarketplaceService } from '../../src/modules/plugin-marketplace/services/plugin-marketplace.service.js';
import { PluginSdkMetadataService } from '../../src/modules/plugin-marketplace/services/plugin-sdk-metadata.service.js';

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
