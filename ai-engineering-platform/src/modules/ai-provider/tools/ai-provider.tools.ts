import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  AiProviderMetadataInputDto,
  AiProviderRequestDto,
  AiRouteRequestInputDto,
} from '../dto/ai-provider.dto.js';
import { AiProviderRegistryService } from '../services/ai-provider-registry.service.js';
import { AiRoutingService } from '../services/ai-routing.service.js';

@Injectable()
export class AiProvidersTool implements ToolHandler {
  constructor(private readonly registry: AiProviderRegistryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    void input;
    return Promise.resolve(this.registry.list() as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class AiProviderMetadataTool implements ToolHandler {
  constructor(private readonly registry: AiProviderRegistryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const dto = input as unknown as AiProviderMetadataInputDto;
    return Promise.resolve(this.registry.get(dto.providerId) as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class AiValidateRequestTool implements ToolHandler {
  constructor(private readonly registry: AiProviderRegistryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.registry.validateRequest(input as unknown as AiProviderRequestDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class AiRouteRequestTool implements ToolHandler {
  constructor(private readonly router: AiRoutingService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.router.route(input as unknown as AiRouteRequestInputDto) as unknown as JsonSchemaObject,
    );
  }
}
