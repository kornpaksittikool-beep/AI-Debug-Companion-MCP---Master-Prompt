import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';
import type { DatabaseConnectionConfig } from '../interfaces/database-intelligence.interface.js';

@Injectable()
export class DatabaseConnectionPolicyService {
  constructor(private readonly safety: RepositorySafetyService) {}

  validateSqliteConnection(connection: DatabaseConnectionConfig): DatabaseConnectionConfig {
    if (connection.dialect !== 'sqlite') {
      throw new PlatformError({
        code: 'UNSUPPORTED_DATABASE_DIALECT',
        message: 'The requested database dialect is not supported in Phase 4.',
        reason: 'Phase 4 supports only SQLite through the adapter abstraction.',
        suggestion: 'Use dialect "sqlite" or add a new adapter in a later phase.',
      });
    }

    const rootPath = this.safety.resolveRoot(connection.rootPath);
    const databasePath = this.safety.resolveInsideRoot(rootPath, connection.databasePath);

    if (!fs.existsSync(databasePath)) {
      throw new PlatformError({
        code: 'DATABASE_FILE_NOT_FOUND',
        message: `SQLite database file "${connection.databasePath}" was not found.`,
        reason: 'SQLite adapter requires an existing database file.',
        suggestion: 'Provide a databasePath inside rootPath that points to an existing SQLite file.',
      });
    }

    return {
      dialect: 'sqlite',
      rootPath,
      databasePath,
    };
  }
}
