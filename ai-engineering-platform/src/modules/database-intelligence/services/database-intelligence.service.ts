import { Injectable } from '@nestjs/common';
import type {
  DatabaseConnectionConfig,
  ConnectionProfileResult,
  DatabaseRelationsResult,
  DatabaseSchemaResult,
  QueryPreviewOptions,
  QueryPreviewResult,
  SupportedDialectsResult,
} from '../interfaces/database-intelligence.interface.js';
import { DatabaseAdapterRegistryService } from './database-adapter-registry.service.js';
import { DatabaseConnectionPolicyService } from './database-connection-policy.service.js';

@Injectable()
export class DatabaseIntelligenceService {
  constructor(
    private readonly adapterRegistry: DatabaseAdapterRegistryService,
    private readonly connectionPolicy: DatabaseConnectionPolicyService,
  ) {}

  supportedDialects(): SupportedDialectsResult {
    return this.connectionPolicy.supportedDialects();
  }

  connectionProfile(connection: DatabaseConnectionConfig): ConnectionProfileResult {
    return this.connectionPolicy.profile(connection);
  }

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
