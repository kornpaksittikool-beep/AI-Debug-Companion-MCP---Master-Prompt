import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  ExportMemoryInputDto,
  RecordMemoryInputDto,
  RefreshMemoryInputDto,
  SearchMemoryInputDto,
  SummarizeMemoryInputDto,
} from '../dto/project-memory.dto.js';
import { ProjectMemoryService } from '../services/project-memory.service.js';

@Injectable()
export class MemoryRecordTool implements ToolHandler {
  constructor(private readonly service: ProjectMemoryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .record(input as unknown as RecordMemoryInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class MemorySearchTool implements ToolHandler {
  constructor(private readonly service: ProjectMemoryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .search(input as unknown as SearchMemoryInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class MemorySummarizeTool implements ToolHandler {
  constructor(private readonly service: ProjectMemoryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .summarize(input as unknown as SummarizeMemoryInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class MemoryRefreshTool implements ToolHandler {
  constructor(private readonly service: ProjectMemoryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .refresh(input as unknown as RefreshMemoryInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class MemoryExportTool implements ToolHandler {
  constructor(private readonly service: ProjectMemoryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .export(input as unknown as ExportMemoryInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}
