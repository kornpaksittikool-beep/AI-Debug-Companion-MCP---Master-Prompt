import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  DatabaseConnectionInputDto,
  DatabaseQueryPreviewInputDto,
} from '../dto/database-intelligence.dto.js';
import { DatabaseIntelligenceService } from '../services/database-intelligence.service.js';

@Injectable()
export class DatabaseSchemaTool implements ToolHandler {
  constructor(private readonly service: DatabaseIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.readSchema(input as unknown as DatabaseConnectionInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class DatabaseRelationsTool implements ToolHandler {
  constructor(private readonly service: DatabaseIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.readRelations(input as unknown as DatabaseConnectionInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class DatabaseQueryPreviewTool implements ToolHandler {
  constructor(private readonly service: DatabaseIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.previewQuery(input as unknown as DatabaseQueryPreviewInputDto) as unknown as JsonSchemaObject,
    );
  }
}
