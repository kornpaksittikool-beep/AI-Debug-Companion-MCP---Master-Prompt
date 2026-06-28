import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  RepositoryOverviewInputDto,
  RepositoryCallGraphInputDto,
  RepositoryCrossRepoSearchInputDto,
  RepositoryImportGraphInputDto,
  RepositoryIndexStatusInputDto,
  RepositoryProjectProfileInputDto,
  RepositoryReadFileContextInputDto,
  RepositoryReadFileExcerptInputDto,
  RepositoryReadModuleContextInputDto,
  RepositoryReadSymbolContextInputDto,
  RepositoryRebuildIndexInputDto,
  RepositoryScanInputDto,
  RepositorySearchFilesInputDto,
  RepositorySearchSymbolsInputDto,
} from '../dto/repository-intelligence.dto.js';
import { RepositoryGraphService } from '../services/repository-graph.service.js';
import { RepositoryIndexStoreService } from '../services/repository-index-store.service.js';
import { RepositoryIntelligenceService } from '../services/repository-intelligence.service.js';
import { RepositoryMultiRootService } from '../services/repository-multi-root.service.js';
import { RepositorySymbolService } from '../services/repository-symbol.service.js';

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
export class RepositoryProjectProfileTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .projectProfile(input as unknown as RepositoryProjectProfileInputDto)
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
export class RepositoryReadFileExcerptTool implements ToolHandler {
  constructor(private readonly service: RepositoryIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .readFileExcerpt(input as unknown as RepositoryReadFileExcerptInputDto)
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

@Injectable()
export class RepositorySearchSymbolsTool implements ToolHandler {
  constructor(private readonly service: RepositorySymbolService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .searchSymbols(input as unknown as RepositorySearchSymbolsInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryReadSymbolContextTool implements ToolHandler {
  constructor(private readonly service: RepositorySymbolService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .readSymbolContext(input as unknown as RepositoryReadSymbolContextInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryImportGraphTool implements ToolHandler {
  constructor(private readonly service: RepositoryGraphService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .importGraph(input as unknown as RepositoryImportGraphInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryCallGraphTool implements ToolHandler {
  constructor(private readonly service: RepositoryGraphService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .callGraph(input as unknown as RepositoryCallGraphInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryIndexStatusTool implements ToolHandler {
  constructor(private readonly service: RepositoryIndexStoreService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .status(input as unknown as RepositoryIndexStatusInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryRebuildIndexTool implements ToolHandler {
  constructor(private readonly service: RepositoryIndexStoreService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .rebuild(input as unknown as RepositoryRebuildIndexInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class RepositoryCrossRepoSearchTool implements ToolHandler {
  constructor(private readonly service: RepositoryMultiRootService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .crossRepositorySearch(input as unknown as RepositoryCrossRepoSearchInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}
