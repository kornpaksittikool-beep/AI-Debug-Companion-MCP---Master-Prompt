import { Injectable } from '@nestjs/common';
import type { PluginManifest } from '../../../plugins/plugin-api/plugin-manifest.interface.js';
import { ExamplePluginService } from '../../../plugins/example/example-plugin.service.js';
import type {
  PluginCatalogEntry,
  PluginCatalogResult,
  PluginLifecycleAction,
  PluginLifecyclePlan,
  PluginLifecyclePlanInput,
  PluginManifestValidationResult,
} from '../interfaces/plugin-marketplace.interface.js';
import { PluginManifestValidatorService } from './plugin-manifest-validator.service.js';

@Injectable()
export class PluginMarketplaceService {
  constructor(
    private readonly examplePlugin: ExamplePluginService,
    private readonly validator: PluginManifestValidatorService,
  ) {}

  catalog(): PluginCatalogResult {
    const manifest = this.examplePlugin.getManifest();
    return {
      plugins: [this.toCatalogEntry(manifest, 'bundled')],
    };
  }

  validateManifest(manifest: PluginManifest): PluginManifestValidationResult {
    return this.validator.validate(manifest);
  }

  createInstallPlan(input: PluginLifecyclePlanInput): PluginLifecyclePlan {
    return this.createPlan('install', input);
  }

  createRemovePlan(input: PluginLifecyclePlanInput): PluginLifecyclePlan {
    return this.createPlan('remove', input);
  }

  createUpdatePlan(input: PluginLifecyclePlanInput): PluginLifecyclePlan {
    return this.createPlan('update', input);
  }

  private createPlan(action: PluginLifecycleAction, input: PluginLifecyclePlanInput): PluginLifecyclePlan {
    const validation = this.validateManifest(input.manifest);
    const risk = this.estimateRisk(input.manifest, validation);
    const targetVersion = action === 'remove' ? undefined : (input.targetVersion ?? input.manifest.version);

    const plan: PluginLifecyclePlan = {
      planId: `plugin_${action}_${input.manifest.name}_${Date.now()}`,
      action,
      pluginName: input.manifest.name,
      status: 'requires_approval',
      risk,
      steps: this.stepsFor(action, input.manifest, targetVersion),
      validation,
      rollbackPlan: this.rollbackFor(action, input.manifest),
      verificationPlan: [
        'Run plugin manifest validation.',
        'Run tool permission audit.',
        'Run platform integration tests.',
        'Confirm registered tool metadata through platform metadata.',
      ],
    };
    return {
      ...plan,
      ...(action === 'install' ? {} : { currentVersion: input.manifest.version }),
      ...(targetVersion ? { targetVersion } : {}),
    };
  }

  private toCatalogEntry(manifest: PluginManifest, source: PluginCatalogEntry['source']): PluginCatalogEntry {
    const validation = this.validateManifest(manifest);
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      source,
      compatibilityStatus: validation.valid ? 'compatible' : 'unknown',
      toolCount: manifest.tools.length,
    };
  }

  private estimateRisk(
    manifest: PluginManifest,
    validation: PluginManifestValidationResult,
  ): PluginLifecyclePlan['risk'] {
    if (!validation.valid) {
      return 'high';
    }
    const hasBroadPermission = manifest.tools.some((tool) => {
      const permissions = tool.permissions;
      return (
        permissions.commands.execute ||
        permissions.network.enabled ||
        permissions.git.write ||
        permissions.database.write ||
        permissions.fileSystem.write
      );
    });
    return hasBroadPermission ? 'medium' : 'low';
  }

  private stepsFor(
    action: PluginLifecycleAction,
    manifest: PluginManifest,
    targetVersion?: string,
  ): readonly string[] {
    if (action === 'install') {
      return [
        `Validate manifest for ${manifest.name}.`,
        'Check compatibility metadata against platform runtime.',
        'Review declared permissions and tool schemas.',
        'Request approval before enabling plugin registration.',
      ];
    }
    if (action === 'remove') {
      return [
        `Validate removal request for ${manifest.name}.`,
        'Confirm dependent workflows do not require plugin tools.',
        'Request approval before disabling plugin registration.',
      ];
    }
    return [
      `Validate update request for ${manifest.name}.`,
      `Compare current version ${manifest.version} to target version ${targetVersion ?? manifest.version}.`,
      'Review schema and permission changes.',
      'Request approval before replacing plugin registration.',
    ];
  }

  private rollbackFor(action: PluginLifecycleAction, manifest: PluginManifest): readonly string[] {
    if (action === 'install') {
      return [`Disable ${manifest.name} registration.`, 'Remove staged plugin metadata.', 'Re-run metadata verification.'];
    }
    if (action === 'remove') {
      return [`Re-enable ${manifest.name} registration from previous manifest.`, 'Re-run metadata verification.'];
    }
    return [`Restore previous ${manifest.name} manifest version.`, 'Re-run metadata and integration verification.'];
  }
}
