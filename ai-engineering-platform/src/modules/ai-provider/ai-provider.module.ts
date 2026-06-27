import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { AiProviderRegistryService } from './services/ai-provider-registry.service.js';
import { AiRoutingService } from './services/ai-routing.service.js';
import {
  AI_PROVIDERS_TOOL_DEFINITION,
  AI_PROVIDER_METADATA_TOOL_DEFINITION,
  AI_ROUTE_REQUEST_TOOL_DEFINITION,
  AI_VALIDATE_REQUEST_TOOL_DEFINITION,
} from './tools/ai-provider-tool-schemas.js';
import {
  AiProviderMetadataTool,
  AiProvidersTool,
  AiRouteRequestTool,
  AiValidateRequestTool,
} from './tools/ai-provider.tools.js';

@Module({
  imports: [CoreModule],
  providers: [
    AiProviderRegistryService,
    AiRoutingService,
    AiProvidersTool,
    AiProviderMetadataTool,
    AiValidateRequestTool,
    AiRouteRequestTool,
  ],
  exports: [AiProviderRegistryService, AiRoutingService],
})
export class AiProviderModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly providersTool: AiProvidersTool,
    private readonly providerMetadataTool: AiProviderMetadataTool,
    private readonly validateRequestTool: AiValidateRequestTool,
    private readonly routeRequestTool: AiRouteRequestTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(AI_PROVIDERS_TOOL_DEFINITION, this.providersTool);
    this.registry.register(AI_PROVIDER_METADATA_TOOL_DEFINITION, this.providerMetadataTool);
    this.registry.register(AI_VALIDATE_REQUEST_TOOL_DEFINITION, this.validateRequestTool);
    this.registry.register(AI_ROUTE_REQUEST_TOOL_DEFINITION, this.routeRequestTool);
  }
}
