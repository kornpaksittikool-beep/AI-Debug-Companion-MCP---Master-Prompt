import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { DatabaseAdapterRegistryService } from './services/database-adapter-registry.service.js';
import { DatabaseConnectionPolicyService } from './services/database-connection-policy.service.js';
import { DatabaseIntelligenceService } from './services/database-intelligence.service.js';
import { DatabaseReadonlyPolicyService } from './services/database-readonly-policy.service.js';
import { SqliteDatabaseAdapter } from './services/sqlite-database.adapter.js';
import {
  DATABASE_QUERY_PREVIEW_TOOL_DEFINITION,
  DATABASE_RELATIONS_TOOL_DEFINITION,
  DATABASE_SCHEMA_TOOL_DEFINITION,
} from './tools/database-tool-schemas.js';
import {
  DatabaseQueryPreviewTool,
  DatabaseRelationsTool,
  DatabaseSchemaTool,
} from './tools/database.tools.js';

@Module({
  imports: [CoreModule, RepositoryIntelligenceModule],
  providers: [
    DatabaseReadonlyPolicyService,
    DatabaseConnectionPolicyService,
    SqliteDatabaseAdapter,
    DatabaseAdapterRegistryService,
    DatabaseIntelligenceService,
    DatabaseSchemaTool,
    DatabaseRelationsTool,
    DatabaseQueryPreviewTool,
  ],
  exports: [DatabaseIntelligenceService],
})
export class DatabaseIntelligenceModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly schemaTool: DatabaseSchemaTool,
    private readonly relationsTool: DatabaseRelationsTool,
    private readonly queryPreviewTool: DatabaseQueryPreviewTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(DATABASE_SCHEMA_TOOL_DEFINITION, this.schemaTool);
    this.registry.register(DATABASE_RELATIONS_TOOL_DEFINITION, this.relationsTool);
    this.registry.register(DATABASE_QUERY_PREVIEW_TOOL_DEFINITION, this.queryPreviewTool);
  }
}
