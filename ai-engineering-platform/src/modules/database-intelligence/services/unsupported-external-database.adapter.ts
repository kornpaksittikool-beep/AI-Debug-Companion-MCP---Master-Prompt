import { PlatformError } from '../../../core/errors/platform-error.js';
import type {
  DatabaseAdapter,
  DatabaseConnectionConfig,
  DatabaseDialect,
  DatabaseRelationsResult,
  DatabaseSchemaResult,
  QueryPreviewOptions,
  QueryPreviewResult,
} from '../interfaces/database-intelligence.interface.js';

export abstract class UnsupportedExternalDatabaseAdapter implements DatabaseAdapter {
  abstract readonly dialect: DatabaseDialect;

  readSchema(connection: DatabaseConnectionConfig): DatabaseSchemaResult {
    this.throwUnsupported(connection);
  }

  readRelations(connection: DatabaseConnectionConfig): DatabaseRelationsResult {
    this.throwUnsupported(connection);
  }

  previewQuery(options: QueryPreviewOptions): QueryPreviewResult {
    this.throwUnsupported(options.connection);
  }

  private throwUnsupported(connection: DatabaseConnectionConfig): never {
    throw new PlatformError({
      code: 'EXTERNAL_DATABASE_EXECUTION_NOT_ENABLED',
      message: `Read execution for "${connection.dialect}" is not enabled in Phase 14.`,
      reason: 'PostgreSQL and MySQL connection profiles are validated, but external database drivers and network execution are intentionally blocked in this phase.',
      suggestion: 'Use database.connection_profile to validate the profile, or add an approved external database execution phase before running schema, relation, or query preview calls.',
    });
  }
}
