import type { DatabaseConnectionConfig } from '../interfaces/database-intelligence.interface.js';

export type DatabaseConnectionInputDto = DatabaseConnectionConfig;

export interface DatabaseQueryPreviewInputDto {
  readonly connection: DatabaseConnectionConfig;
  readonly query: string;
  readonly maxRows?: number;
}
