import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  RepositoryOverviewInputDto,
  RepositoryReadFileContextInputDto,
  RepositoryReadModuleContextInputDto,
  RepositoryScanInputDto,
  RepositorySearchFilesInputDto,
} from '../dto/repository-intelligence.dto.js';
import { RepositoryIntelligenceService } from '../services/repository-intelligence.service.js';

@Injectable()
export class RepositoryOverviewTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .overview(input as unknown as RepositoryOverviewInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryScanTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .scan(input as unknown as RepositoryScanInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositorySearchFilesTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .searchFiles(input as unknown as RepositorySearchFilesInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryReadFileContextTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .readFileContext(input as unknown as RepositoryReadFileContextInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryReadModuleContextTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .readModuleContext(input as unknown as RepositoryReadModuleContextInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}
