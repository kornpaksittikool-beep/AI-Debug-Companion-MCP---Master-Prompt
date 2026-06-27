import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { ExamplePluginModule } from '../../plugins/example/example-plugin.module.js';
import { PluginManifestValidatorService } from './services/plugin-manifest-validator.service.js';
import { PluginCompatibilityService } from './services/plugin-compatibility.service.js';
import { PluginLifecycleExecutorService } from './services/plugin-lifecycle-executor.service.js';
import { PluginMarketplaceService } from './services/plugin-marketplace.service.js';
import { PluginRemoteArtifactVerifierService } from './services/plugin-remote-artifact-verifier.service.js';
import { PluginRemoteStagingService } from './services/plugin-remote-staging.service.js';
import { PluginSdkMetadataService } from './services/plugin-sdk-metadata.service.js';
import { PluginStateStoreService } from './services/plugin-state-store.service.js';
import {
  PLUGIN_CATALOG_TOOL_DEFINITION,
  PLUGIN_DISABLE_TOOL_DEFINITION,
  PLUGIN_ENABLE_TOOL_DEFINITION,
  PLUGIN_INSTALL_PLAN_TOOL_DEFINITION,
  PLUGIN_INVENTORY_TOOL_DEFINITION,
  PLUGIN_LIFECYCLE_RESULT_TOOL_DEFINITION,
  PLUGIN_REMOVE_PLAN_TOOL_DEFINITION,
  PLUGIN_REMOTE_STAGE_PLAN_TOOL_DEFINITION,
  PLUGIN_RESOLVE_COMPATIBILITY_TOOL_DEFINITION,
  PLUGIN_SDK_METADATA_TOOL_DEFINITION,
  PLUGIN_STAGE_REMOTE_TOOL_DEFINITION,
  PLUGIN_STAGE_UPDATE_TOOL_DEFINITION,
  PLUGIN_STAGED_INVENTORY_TOOL_DEFINITION,
  PLUGIN_UPDATE_PLAN_TOOL_DEFINITION,
  PLUGIN_VALIDATE_MANIFEST_TOOL_DEFINITION,
  PLUGIN_VERIFY_ARTIFACT_TOOL_DEFINITION,
} from './tools/plugin-marketplace-tool-schemas.js';
import {
  PluginCatalogTool,
  PluginDisableTool,
  PluginEnableTool,
  PluginInstallPlanTool,
  PluginInventoryTool,
  PluginLifecycleResultTool,
  PluginRemovePlanTool,
  PluginRemoteStagePlanTool,
  PluginResolveCompatibilityTool,
  PluginSdkMetadataTool,
  PluginStageRemoteTool,
  PluginStageUpdateTool,
  PluginStagedInventoryTool,
  PluginUpdatePlanTool,
  PluginValidateManifestTool,
  PluginVerifyArtifactTool,
} from './tools/plugin-marketplace.tools.js';

@Module({
  imports: [CoreModule, ExamplePluginModule],
  providers: [
    PluginManifestValidatorService,
    PluginCompatibilityService,
    PluginMarketplaceService,
    PluginSdkMetadataService,
    PluginStateStoreService,
    PluginLifecycleExecutorService,
    PluginRemoteArtifactVerifierService,
    PluginRemoteStagingService,
    PluginCatalogTool,
    PluginValidateManifestTool,
    PluginResolveCompatibilityTool,
    PluginInstallPlanTool,
    PluginRemovePlanTool,
    PluginUpdatePlanTool,
    PluginSdkMetadataTool,
    PluginInventoryTool,
    PluginEnableTool,
    PluginDisableTool,
    PluginStageUpdateTool,
    PluginLifecycleResultTool,
    PluginRemoteStagePlanTool,
    PluginVerifyArtifactTool,
    PluginStageRemoteTool,
    PluginStagedInventoryTool,
  ],
  exports: [
    PluginManifestValidatorService,
    PluginCompatibilityService,
    PluginMarketplaceService,
    PluginSdkMetadataService,
    PluginStateStoreService,
    PluginLifecycleExecutorService,
    PluginRemoteArtifactVerifierService,
    PluginRemoteStagingService,
  ],
})
export class PluginMarketplaceModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly catalogTool: PluginCatalogTool,
    private readonly validateManifestTool: PluginValidateManifestTool,
    private readonly resolveCompatibilityTool: PluginResolveCompatibilityTool,
    private readonly installPlanTool: PluginInstallPlanTool,
    private readonly removePlanTool: PluginRemovePlanTool,
    private readonly updatePlanTool: PluginUpdatePlanTool,
    private readonly sdkMetadataTool: PluginSdkMetadataTool,
    private readonly inventoryTool: PluginInventoryTool,
    private readonly enableTool: PluginEnableTool,
    private readonly disableTool: PluginDisableTool,
    private readonly stageUpdateTool: PluginStageUpdateTool,
    private readonly lifecycleResultTool: PluginLifecycleResultTool,
    private readonly remoteStagePlanTool: PluginRemoteStagePlanTool,
    private readonly verifyArtifactTool: PluginVerifyArtifactTool,
    private readonly stageRemoteTool: PluginStageRemoteTool,
    private readonly stagedInventoryTool: PluginStagedInventoryTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(PLUGIN_CATALOG_TOOL_DEFINITION, this.catalogTool);
    this.registry.register(PLUGIN_VALIDATE_MANIFEST_TOOL_DEFINITION, this.validateManifestTool);
    this.registry.register(PLUGIN_RESOLVE_COMPATIBILITY_TOOL_DEFINITION, this.resolveCompatibilityTool);
    this.registry.register(PLUGIN_INSTALL_PLAN_TOOL_DEFINITION, this.installPlanTool);
    this.registry.register(PLUGIN_REMOVE_PLAN_TOOL_DEFINITION, this.removePlanTool);
    this.registry.register(PLUGIN_UPDATE_PLAN_TOOL_DEFINITION, this.updatePlanTool);
    this.registry.register(PLUGIN_SDK_METADATA_TOOL_DEFINITION, this.sdkMetadataTool);
    this.registry.register(PLUGIN_INVENTORY_TOOL_DEFINITION, this.inventoryTool);
    this.registry.register(PLUGIN_ENABLE_TOOL_DEFINITION, this.enableTool);
    this.registry.register(PLUGIN_DISABLE_TOOL_DEFINITION, this.disableTool);
    this.registry.register(PLUGIN_STAGE_UPDATE_TOOL_DEFINITION, this.stageUpdateTool);
    this.registry.register(PLUGIN_LIFECYCLE_RESULT_TOOL_DEFINITION, this.lifecycleResultTool);
    this.registry.register(PLUGIN_REMOTE_STAGE_PLAN_TOOL_DEFINITION, this.remoteStagePlanTool);
    this.registry.register(PLUGIN_VERIFY_ARTIFACT_TOOL_DEFINITION, this.verifyArtifactTool);
    this.registry.register(PLUGIN_STAGE_REMOTE_TOOL_DEFINITION, this.stageRemoteTool);
    this.registry.register(PLUGIN_STAGED_INVENTORY_TOOL_DEFINITION, this.stagedInventoryTool);
  }
}
