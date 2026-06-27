import { Injectable } from '@nestjs/common';
import { UnsupportedExternalDatabaseAdapter } from './unsupported-external-database.adapter.js';

@Injectable()
export class MysqlDatabaseAdapter extends UnsupportedExternalDatabaseAdapter {
  readonly dialect = 'mysql' as const;
}
