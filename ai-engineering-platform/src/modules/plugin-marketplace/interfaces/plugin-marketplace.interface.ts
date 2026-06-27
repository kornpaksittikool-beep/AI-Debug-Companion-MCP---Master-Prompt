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

export type PluginRuntimeState = 'enabled' | 'disabled' | 'staged_update';

export interface PluginStateRecord {
  readonly name: string;
  readonly version: string;
  readonly state: PluginRuntimeState;
  readonly manifest: PluginManifest;
  readonly updatedAt: string;
}

export interface PluginLifecycleExecutionInput {
  readonly rootPath: string;
  readonly manifest: PluginManifest;
  readonly targetVersion?: string;
  readonly reason?: string;
  readonly acknowledgeBroadPermissions?: boolean;
}

export interface PluginDisableInput {
  readonly rootPath: string;
  readonly pluginName: string;
  readonly reason?: string;
}

export interface PluginInventoryInput {
  readonly rootPath: string;
}

export interface PluginLifecycleResultInput {
  readonly rootPath: string;
  readonly lifecycleId: string;
}

export interface PluginInventoryResult {
  readonly rootPath: string;
  readonly plugins: readonly PluginStateRecord[];
  readonly lifecycleResults: readonly PluginLifecycleExecutionResult[];
}

export interface PluginLifecycleExecutionResult {
  readonly lifecycleId: string;
  readonly action: 'enable' | 'disable' | 'stage_update';
  readonly pluginName: string;
  readonly status: 'completed' | 'rejected';
  readonly reason: string;
  readonly previousState?: PluginStateRecord;
  readonly nextState?: PluginStateRecord;
  readonly validation?: PluginManifestValidationResult;
  readonly rollbackPlan: readonly string[];
  readonly verificationPlan: readonly string[];
  readonly createdAt: string;
}

export type RemotePluginSourceType = 'https_archive' | 'github_release' | 'git_repository';
export type RemotePluginChecksumAlgorithm = 'sha256';

export interface RemotePluginSignatureMetadata {
  readonly algorithm: string;
  readonly keyId: string;
  readonly signature: string;
}

export interface RemotePluginSource {
  readonly type: RemotePluginSourceType;
  readonly url: string;
  readonly checksumAlgorithm: RemotePluginChecksumAlgorithm;
  readonly checksum: string;
  readonly signature?: RemotePluginSignatureMetadata;
}

export interface RemotePluginArtifactVerificationInput {
  readonly source: RemotePluginSource;
  readonly artifactContent: string;
}

export interface RemotePluginArtifactVerificationResult {
  readonly valid: boolean;
  readonly sourceType: RemotePluginSourceType;
  readonly sourceUrl: string;
  readonly checksumAlgorithm: RemotePluginChecksumAlgorithm;
  readonly expectedChecksum: string;
  readonly actualChecksum: string;
  readonly signatureVerified: boolean;
  readonly issues: readonly PluginManifestValidationIssue[];
}

export interface RemotePluginStagePlanInput {
  readonly manifest: PluginManifest;
  readonly source: RemotePluginSource;
  readonly reason?: string;
}

export interface RemotePluginStagePlan {
  readonly planId: string;
  readonly pluginName: string;
  readonly version: string;
  readonly status: 'requires_approval';
  readonly risk: PluginLifecycleRisk;
  readonly source: RemotePluginSource;
  readonly validation: PluginManifestValidationResult;
  readonly artifactRequirements: readonly string[];
  readonly steps: readonly string[];
  readonly rollbackPlan: readonly string[];
  readonly verificationPlan: readonly string[];
}

export interface RemotePluginStageInput {
  readonly rootPath: string;
  readonly manifest: PluginManifest;
  readonly source: RemotePluginSource;
  readonly artifactContent: string;
  readonly stageReason?: string;
}

export interface RemotePluginStagedRecord {
  readonly stagingId: string;
  readonly pluginName: string;
  readonly version: string;
  readonly manifest: PluginManifest;
  readonly source: RemotePluginSource;
  readonly verification: RemotePluginArtifactVerificationResult;
  readonly state: 'staged_remote';
  readonly stagedAt: string;
  readonly rollbackPlan: readonly string[];
  readonly verificationPlan: readonly string[];
}

export interface RemotePluginStageResult {
  readonly status: 'completed' | 'rejected';
  readonly reason: string;
  readonly record?: RemotePluginStagedRecord;
  readonly verification: RemotePluginArtifactVerificationResult;
}

export interface RemotePluginStagedInventoryInput {
  readonly rootPath: string;
}

export interface RemotePluginStagedInventoryResult {
  readonly rootPath: string;
  readonly stagedPlugins: readonly RemotePluginStagedRecord[];
}
