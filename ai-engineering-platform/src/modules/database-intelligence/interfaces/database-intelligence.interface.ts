import type { JsonSchemaObject, JsonSchemaValue } from '../../../core/registry/interfaces/json-schema.interface.js';

export type DatabaseDialect = 'sqlite';

export interface DatabaseConnectionConfig {
  readonly dialect: DatabaseDialect;
  readonly databasePath: string;
  readonly rootPath: string;
}

export interface DatabaseColumn {
  readonly tableName: string;
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
  readonly primaryKey: boolean;
  readonly defaultValue?: string;
}

export interface DatabaseTable {
  readonly name: string;
  readonly columns: readonly DatabaseColumn[];
}

export interface DatabaseRelation {
  readonly sourceTable: string;
  readonly sourceColumn: string;
  readonly targetTable: string;
  readonly targetColumn: string;
}

export interface DatabaseSchemaResult {
  readonly dialect: DatabaseDialect;
  readonly databasePath: string;
  readonly tables: readonly DatabaseTable[];
}

export interface DatabaseRelationsResult {
  readonly dialect: DatabaseDialect;
  readonly databasePath: string;
  readonly relations: readonly DatabaseRelation[];
}

export interface QueryPreviewOptions {
  readonly connection: DatabaseConnectionConfig;
  readonly query: string;
  readonly maxRows?: number;
}

export interface QueryPreviewResult {
  readonly dialect: DatabaseDialect;
  readonly databasePath: string;
  readonly columns: readonly string[];
  readonly rows: readonly JsonSchemaObject[];
  readonly rowCount: number;
  readonly truncated: boolean;
}

export interface DatabaseAdapter {
  readonly dialect: DatabaseDialect;
  readSchema(connection: DatabaseConnectionConfig): DatabaseSchemaResult;
  readRelations(connection: DatabaseConnectionConfig): DatabaseRelationsResult;
  previewQuery(options: QueryPreviewOptions): QueryPreviewResult;
}

export type DatabaseRowValue = JsonSchemaValue;
