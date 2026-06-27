import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { ExamplePluginModule } from '../../plugins/example/example-plugin.module.js';
import { PluginManifestValidatorService } from './services/plugin-manifest-validator.service.js';
import { PluginCompatibilityService } from './services/plugin-compatibility.service.js';
import { PluginMarketplaceService } from './services/plugin-marketplace.service.js';
import { PluginSdkMetadataService } from './services/plugin-sdk-metadata.service.js';
import {
  PLUGIN_CATALOG_TOOL_DEFINITION,
  PLUGIN_INSTALL_PLAN_TOOL_DEFINITION,
  PLUGIN_REMOVE_PLAN_TOOL_DEFINITION,
  PLUGIN_RESOLVE_COMPATIBILITY_TOOL_DEFINITION,
  PLUGIN_SDK_METADATA_TOOL_DEFINITION,
  PLUGIN_UPDATE_PLAN_TOOL_DEFINITION,
  PLUGIN_VALIDATE_MANIFEST_TOOL_DEFINITION,
} from './tools/plugin-marketplace-tool-schemas.js';
import {
  PluginCatalogTool,
  PluginInstallPlanTool,
  PluginRemovePlanTool,
  PluginResolveCompatibilityTool,
  PluginSdkMetadataTool,
  PluginUpdatePlanTool,
  PluginValidateManifestTool,
} from './tools/plugin-marketplace.tools.js';

@Module({
  imports: [CoreModule, ExamplePluginModule],
  providers: [
    PluginManifestValidatorService,
    PluginCompatibilityService,
    PluginMarketplaceService,
    PluginSdkMetadataService,
    PluginCatalogTool,
    PluginValidateManifestTool,
    PluginResolveCompatibilityTool,
    PluginInstallPlanTool,
    PluginRemovePlanTool,
    PluginUpdatePlanTool,
    PluginSdkMetadataTool,
  ],
  exports: [PluginManifestValidatorService, PluginCompatibilityService, PluginMarketplaceService, PluginSdkMetadataService],
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
  ) {}

  onModuleInit(): void {
    this.registry.register(PLUGIN_CATALOG_TOOL_DEFINITION, this.catalogTool);
    this.registry.register(PLUGIN_VALIDATE_MANIFEST_TOOL_DEFINITION, this.validateManifestTool);
    this.registry.register(PLUGIN_RESOLVE_COMPATIBILITY_TOOL_DEFINITION, this.resolveCompatibilityTool);
    this.registry.register(PLUGIN_INSTALL_PLAN_TOOL_DEFINITION, this.installPlanTool);
    this.registry.register(PLUGIN_REMOVE_PLAN_TOOL_DEFINITION, this.removePlanTool);
    this.registry.register(PLUGIN_UPDATE_PLAN_TOOL_DEFINITION, this.updatePlanTool);
    this.registry.register(PLUGIN_SDK_METADATA_TOOL_DEFINITION, this.sdkMetadataTool);
  }
}
