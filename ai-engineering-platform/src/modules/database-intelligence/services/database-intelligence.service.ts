import { Injectable } from '@nestjs/common';
import type {
  DatabaseConnectionConfig,
  DatabaseRelationsResult,
  DatabaseSchemaResult,
  QueryPreviewOptions,
  QueryPreviewResult,
} from '../interfaces/database-intelligence.interface.js';
import { DatabaseAdapterRegistryService } from './database-adapter-registry.service.js';

@Injectable()
export class DatabaseIntelligenceService {
  constructor(private readonly adapterRegistry: DatabaseAdapterRegistryService) {}

  readSchema(connection: DatabaseConnectionConfig): DatabaseSchemaResult {
    return this.adapterRegistry.get(connection.dialect).readSchema(connection);
  }

  readRelations(connection: DatabaseConnectionConfig): DatabaseRelationsResult {
    return this.adapterRegistry.get(connection.dialect).readRelations(connection);
  }

  previewQuery(options: QueryPreviewOptions): QueryPreviewResult {
    return this.adapterRegistry.get(options.connection.dialect).previewQuery(options);
  }
}
