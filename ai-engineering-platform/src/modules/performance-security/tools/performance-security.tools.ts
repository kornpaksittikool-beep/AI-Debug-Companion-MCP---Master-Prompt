import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  CacheInvalidationInputDto,
  CacheSummaryInputDto,
  SecurityAuditProjectInputDto,
} from '../dto/performance-security.dto.js';
import { CacheInvalidationService } from '../services/cache-invalidation.service.js';
import { SecurityAuditService } from '../services/security-audit.service.js';

@Injectable()
export class PerformanceCacheSummaryTool implements ToolHandler {
  constructor(private readonly service: CacheInvalidationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.summary(input as unknown as CacheSummaryInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PerformanceInvalidateCacheTool implements ToolHandler {
  constructor(private readonly service: CacheInvalidationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.invalidate(input as unknown as CacheInvalidationInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class SecurityAuditProjectTool implements ToolHandler {
  constructor(private readonly service: SecurityAuditService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .auditProject(input as unknown as SecurityAuditProjectInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class SecurityAuditToolPermissionsTool implements ToolHandler {
  constructor(private readonly service: SecurityAuditService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    void input;
    return Promise.resolve(this.service.auditToolPermissions() as unknown as JsonSchemaObject);
  }
}
