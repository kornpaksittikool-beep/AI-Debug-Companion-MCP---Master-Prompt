import type { PluginManifest } from '../../../plugins/plugin-api/plugin-manifest.interface.js';

export type PluginLifecycleAction = 'install' | 'remove' | 'update';
export type PluginLifecycleRisk = 'low' | 'medium' | 'high';

export interface PluginCatalogEntry {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly source: 'bundled' | 'local' | 'registry';
  readonly compatibilityStatus: 'compatible' | 'unknown' | 'incompatible';
  readonly compatibility?: PluginCompatibilityResult;
  readonly toolCount: number;
}

export interface PluginCatalogResult {
  readonly plugins: readonly PluginCatalogEntry[];
}

export interface PluginManifestValidationInput {
  readonly manifest: PluginManifest;
}

export interface PluginManifestValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly suggestion: string;
}

export interface PluginManifestValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PluginManifestValidationIssue[];
  readonly compatibility?: PluginCompatibilityResult;
}

export interface PluginCompatibilityInput {
  readonly manifest: PluginManifest;
  readonly platformVersion?: string;
  readonly nodeVersion?: string;
}

export interface PluginCompatibilityCheck {
  readonly target: 'platform' | 'node' | 'runtime';
  readonly required: string;
  readonly actual: string;
  readonly compatible: boolean;
  readonly reason: string;
}

export interface PluginCompatibilityResult {
  readonly compatible: boolean;
  readonly checks: readonly PluginCompatibilityCheck[];
}

export interface PluginLifecyclePlanInput {
  readonly manifest: PluginManifest;
  readonly targetVersion?: string;
  readonly reason?: string;
}

export interface PluginLifecyclePlan {
  readonly planId: string;
  readonly action: PluginLifecycleAction;
  readonly pluginName: string;
  readonly currentVersion?: string;
  readonly targetVersion?: string;
  readonly status: 'requires_approval';
  readonly risk: PluginLifecycleRisk;
  readonly steps: readonly string[];
  readonly validation: PluginManifestValidationResult;
  readonly rollbackPlan: readonly string[];
  readonly verificationPlan: readonly string[];
}

export interface PluginSdkMetadata {
  readonly languagePluginSdk: {
    readonly version: string;
    readonly requiredCapabilities: readonly string[];
    readonly extensionPoints: readonly string[];
  };
  readonly externalToolPluginSdk: {
    readonly version: string;
    readonly requiredCapabilities: readonly string[];
    readonly securityRequirements: readonly string[];
  };
}
