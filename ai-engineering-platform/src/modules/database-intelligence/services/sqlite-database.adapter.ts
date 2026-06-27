import { Injectable } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type {
  DatabaseAdapter,
  DatabaseColumn,
  DatabaseConnectionConfig,
  DatabaseRelationsResult,
  DatabaseSchemaResult,
  DatabaseTable,
  QueryPreviewOptions,
  QueryPreviewResult,
} from '../interfaces/database-intelligence.interface.js';
import { DatabaseConnectionPolicyService } from './database-connection-policy.service.js';
import { DatabaseReadonlyPolicyService } from './database-readonly-policy.service.js';

interface SqliteTableRow {
  readonly name: string;
}

interface SqliteColumnRow {
  readonly name: string;
  readonly type: string;
  readonly notnull: number;
  readonly dflt_value: string | null;
  readonly pk: number;
}

interface SqliteForeignKeyRow {
  readonly table: string;
  readonly from: string;
  readonly to: string;
}

const DEFAULT_MAX_ROWS = 50;

@Injectable()
export class SqliteDatabaseAdapter implements DatabaseAdapter {
  readonly dialect = 'sqlite' as const;

  constructor(
    private readonly connectionPolicy: DatabaseConnectionPolicyService,
    private readonly readonlyPolicy: DatabaseReadonlyPolicyService,
  ) {}

  readSchema(connection: DatabaseConnectionConfig): DatabaseSchemaResult {
    const normalized = this.connectionPolicy.validateSqliteConnection(connection);
    const database = this.open(normalized.databasePath);
    try {
      const tableRows = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as unknown as SqliteTableRow[];
      const tables = tableRows.map((table): DatabaseTable => ({
        name: table.name,
        columns: this.readColumns(database, table.name),
      }));

      return {
        dialect: this.dialect,
        databasePath: normalized.databasePath,
        tables,
      };
    } finally {
      database.close();
    }
  }

  readRelations(connection: DatabaseConnectionConfig): DatabaseRelationsResult {
    const normalized = this.connectionPolicy.validateSqliteConnection(connection);
    const database = this.open(normalized.databasePath);
    try {
      const tableRows = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as unknown as SqliteTableRow[];
      const relations = tableRows.flatMap((table) => {
        const rows = database.prepare(`PRAGMA foreign_key_list(${this.quoteIdentifier(table.name)})`).all() as unknown as SqliteForeignKeyRow[];
        return rows.map((row) => ({
          sourceTable: table.name,
          sourceColumn: row.from,
          targetTable: row.table,
          targetColumn: row.to,
        }));
      });

      return {
        dialect: this.dialect,
        databasePath: normalized.databasePath,
        relations,
      };
    } finally {
      database.close();
    }
  }

  previewQuery(options: QueryPreviewOptions): QueryPreviewResult {
    this.readonlyPolicy.assertReadOnly(options.query);
    const normalized = this.connectionPolicy.validateSqliteConnection(options.connection);
    const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
    const database = this.open(normalized.databasePath);
    try {
      const limitedQuery = `SELECT * FROM (${options.query}) AS preview_query LIMIT ${maxRows + 1}`;
      const rows = database.prepare(limitedQuery).all() as JsonSchemaObject[];
      const previewRows = rows.slice(0, maxRows);
      const columns = previewRows[0] ? Object.keys(previewRows[0]) : [];

      return {
        dialect: this.dialect,
        databasePath: normalized.databasePath,
        columns,
        rows: previewRows,
        rowCount: previewRows.length,
        truncated: rows.length > maxRows,
      };
    } finally {
      database.close();
    }
  }

  private readColumns(database: DatabaseSync, tableName: string): readonly DatabaseColumn[] {
    const rows = database.prepare(`PRAGMA table_info(${this.quoteIdentifier(tableName)})`).all() as unknown as SqliteColumnRow[];
    return rows.map((row) => ({
      tableName,
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0,
      primaryKey: row.pk > 0,
      ...(row.dflt_value !== null ? { defaultValue: row.dflt_value } : {}),
    }));
  }

  private open(databasePath: string): DatabaseSync {
    return new DatabaseSync(databasePath, { readOnly: true });
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replaceAll('"', '""')}"`;
  }
}
