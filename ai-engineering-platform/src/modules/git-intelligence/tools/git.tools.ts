import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  GitBlameInputDto,
  GitFindCommitByFileInputDto,
  GitRecentChangesInputDto,
} from '../dto/git-intelligence.dto.js';
import { GitIntelligenceService } from '../services/git-intelligence.service.js';

@Injectable()
export class GitRecentChangesTool implements ToolHandler {
  constructor(private readonly service: GitIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .recentChanges(input as unknown as GitRecentChangesInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class GitBlameTool implements ToolHandler {
  constructor(private readonly service: GitIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .blame(input as unknown as GitBlameInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class GitFindCommitByFileTool implements ToolHandler {
  constructor(private readonly service: GitIntelligenceService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .findCommitByFile(input as unknown as GitFindCommitByFileInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}
