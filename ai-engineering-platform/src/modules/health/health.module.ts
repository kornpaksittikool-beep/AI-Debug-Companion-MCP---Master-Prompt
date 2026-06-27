import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { HealthService } from './services/health.service.js';
import { HEALTH_TOOL_DEFINITION, HealthTool } from './tools/health.tool.js';
import {
  PLATFORM_METADATA_TOOL_DEFINITION,
  PlatformMetadataTool,
} from './tools/platform-metadata.tool.js';

@Module({
  imports: [CoreModule],
  providers: [HealthService, HealthTool, PlatformMetadataTool],
  exports: [HealthService],
})
export class HealthModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly healthTool: HealthTool,
    private readonly platformMetadataTool: PlatformMetadataTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(HEALTH_TOOL_DEFINITION, this.healthTool);
    this.registry.register(PLATFORM_METADATA_TOOL_DEFINITION, this.platformMetadataTool);
  }
}
