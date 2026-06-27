import { Injectable } from '@nestjs/common';
import { UnsupportedExternalDatabaseAdapter } from './unsupported-external-database.adapter.js';

@Injectable()
export class PostgresDatabaseAdapter extends UnsupportedExternalDatabaseAdapter {
  readonly dialect = 'postgres' as const;
}
