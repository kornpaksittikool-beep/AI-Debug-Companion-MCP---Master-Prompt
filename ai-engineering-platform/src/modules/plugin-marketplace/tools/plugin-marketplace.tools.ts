import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  PluginCompatibilityInputDto,
  PluginLifecyclePlanInputDto,
  PluginManifestValidationInputDto,
} from '../dto/plugin-marketplace.dto.js';
import { PluginMarketplaceService } from '../services/plugin-marketplace.service.js';
import { PluginSdkMetadataService } from '../services/plugin-sdk-metadata.service.js';

@Injectable()
export class PluginCatalogTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    void input;
    return Promise.resolve(this.service.catalog() as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class PluginValidateManifestTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const dto = input as unknown as PluginManifestValidationInputDto;
    return Promise.resolve(this.service.validateManifest(dto.manifest) as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class PluginResolveCompatibilityTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.resolveCompatibility(input as unknown as PluginCompatibilityInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PluginInstallPlanTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.createInstallPlan(input as unknown as PluginLifecyclePlanInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PluginRemovePlanTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.createRemovePlan(input as unknown as PluginLifecyclePlanInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PluginUpdatePlanTool implements ToolHandler {
  constructor(private readonly service: PluginMarketplaceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.createUpdatePlan(input as unknown as PluginLifecyclePlanInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PluginSdkMetadataTool implements ToolHandler {
  constructor(private readonly service: PluginSdkMetadataService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    void input;
    return Promise.resolve(this.service.metadata() as unknown as JsonSchemaObject);
  }
}
