import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';
import type {
  ConnectionProfileIssue,
  ConnectionProfileResult,
  DatabaseConnectionConfig,
  ExternalDatabaseConnectionConfig,
  SqliteConnectionConfig,
  SupportedDialectsResult,
} from '../interfaces/database-intelligence.interface.js';

@Injectable()
export class DatabaseConnectionPolicyService {
  constructor(private readonly safety: RepositorySafetyService) {}

  supportedDialects(): SupportedDialectsResult {
    return {
      dialects: [
        {
          dialect: 'sqlite',
          executable: true,
          connectionKind: 'file',
          readOnly: true,
          notes: 'SQLite read-only schema, relation, and query preview execution is enabled.',
        },
        {
          dialect: 'postgres',
          executable: false,
          connectionKind: 'external',
          readOnly: true,
          notes: 'PostgreSQL profile validation is enabled, but driver execution is blocked in Phase 14.',
        },
        {
          dialect: 'mysql',
          executable: false,
          connectionKind: 'external',
          readOnly: true,
          notes: 'MySQL profile validation is enabled, but driver execution is blocked in Phase 14.',
        },
      ],
    };
  }

  profile(connection: DatabaseConnectionConfig): ConnectionProfileResult {
    if (connection.dialect === 'sqlite') {
      try {
        this.validateSqliteConnection(connection);
        return { dialect: 'sqlite', valid: true, executable: true, issues: [] };
      } catch (error) {
        return {
          dialect: 'sqlite',
          valid: false,
          executable: true,
          issues: [this.toIssue(error)],
        };
      }
    }

    const issues = this.validateExternalConnection(connection);
    return {
      dialect: connection.dialect,
      valid: issues.length === 0,
      executable: false,
      issues,
    };
  }

  validateSqliteConnection(connection: DatabaseConnectionConfig): SqliteConnectionConfig {
    if (connection.dialect !== 'sqlite') {
      throw new PlatformError({
        code: 'UNSUPPORTED_DATABASE_DIALECT',
        message: `The requested database dialect "${connection.dialect}" is not executable in Phase 14.`,
        reason: 'Phase 14 validates PostgreSQL and MySQL profiles but keeps external database execution blocked.',
        suggestion: 'Use database.connection_profile for external database profiles or use SQLite for executable read-only previews.',
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

  private validateExternalConnection(connection: ExternalDatabaseConnectionConfig): ConnectionProfileIssue[] {
    const issues: ConnectionProfileIssue[] = [];
    this.requireText(connection.host, 'host', issues);
    this.requireText(connection.database, 'database', issues);
    this.requireText(connection.username, 'username', issues);
    if (!Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535) {
      issues.push({
        field: 'port',
        message: 'External database port is invalid.',
        suggestion: 'Use an integer port between 1 and 65535.',
      });
    }
    if ('password' in connection) {
      issues.push({
        field: 'password',
        message: 'Password fields are not accepted in database tool input.',
        suggestion: 'Use a future approved secret provider integration instead of passing secrets through MCP input.',
      });
    }
    return issues;
  }

  private requireText(
    value: string | undefined,
    field: string,
    issues: ConnectionProfileIssue[],
  ): void {
    if (!value?.trim()) {
      issues.push({
        field,
        message: `External database field "${field}" is required.`,
        suggestion: `Provide a non-empty ${field} value.`,
      });
    }
  }

  private toIssue(error: unknown): ConnectionProfileIssue {
    if (error instanceof PlatformError) {
      return {
        field: 'connection',
        message: error.message,
        suggestion: error.suggestion,
      };
    }
    return {
      field: 'connection',
      message: 'Connection profile validation failed.',
      suggestion: 'Review the connection profile and try again.',
    };
  }
}
