import type {
  ConnectionProfileResult,
  DatabaseConnectionConfig,
  SupportedDialectsResult,
} from '../interfaces/database-intelligence.interface.js';

export type DatabaseConnectionInputDto = DatabaseConnectionConfig;
export type DatabaseSupportedDialectsOutputDto = SupportedDialectsResult;
export type DatabaseConnectionProfileOutputDto = ConnectionProfileResult;

export interface DatabaseQueryPreviewInputDto {
  readonly connection: DatabaseConnectionConfig;
  readonly query: string;
  readonly maxRows?: number;
}
