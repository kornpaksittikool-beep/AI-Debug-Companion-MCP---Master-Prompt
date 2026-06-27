import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type {
  DatabaseAdapter,
  DatabaseDialect,
} from '../interfaces/database-intelligence.interface.js';
import { MysqlDatabaseAdapter } from './mysql-database.adapter.js';
import { PostgresDatabaseAdapter } from './postgres-database.adapter.js';
import { SqliteDatabaseAdapter } from './sqlite-database.adapter.js';

@Injectable()
export class DatabaseAdapterRegistryService {
  private readonly adapters: ReadonlyMap<DatabaseDialect, DatabaseAdapter>;

  constructor(
    sqliteAdapter: SqliteDatabaseAdapter,
    postgresAdapter: PostgresDatabaseAdapter,
    mysqlAdapter: MysqlDatabaseAdapter,
  ) {
    const adapters: readonly (readonly [DatabaseDialect, DatabaseAdapter])[] = [
      [sqliteAdapter.dialect, sqliteAdapter],
      [postgresAdapter.dialect, postgresAdapter],
      [mysqlAdapter.dialect, mysqlAdapter],
    ];
    this.adapters = new Map(adapters);
  }

  get(dialect: DatabaseDialect): DatabaseAdapter {
    const adapter = this.adapters.get(dialect);
    if (!adapter) {
      throw new PlatformError({
        code: 'DATABASE_ADAPTER_NOT_FOUND',
        message: `Database adapter for dialect "${dialect}" was not found.`,
        reason: 'No adapter is registered for the requested dialect.',
        suggestion: 'Use a supported dialect or register a database adapter.',
      });
    }

    return adapter;
  }
}
