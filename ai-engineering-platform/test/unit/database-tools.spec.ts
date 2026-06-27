import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { DatabaseAdapterRegistryService } from '../../src/modules/database-intelligence/services/database-adapter-registry.service.js';
import { DatabaseConnectionPolicyService } from '../../src/modules/database-intelligence/services/database-connection-policy.service.js';
import { DatabaseIntelligenceService } from '../../src/modules/database-intelligence/services/database-intelligence.service.js';
import { MysqlDatabaseAdapter } from '../../src/modules/database-intelligence/services/mysql-database.adapter.js';
import { PostgresDatabaseAdapter } from '../../src/modules/database-intelligence/services/postgres-database.adapter.js';
import { DatabaseReadonlyPolicyService } from '../../src/modules/database-intelligence/services/database-readonly-policy.service.js';
import { SqliteDatabaseAdapter } from '../../src/modules/database-intelligence/services/sqlite-database.adapter.js';
import {
  DatabaseQueryPreviewTool,
  DatabaseConnectionProfileTool,
  DatabaseRelationsTool,
  DatabaseSchemaTool,
  DatabaseSupportedDialectsTool,
} from '../../src/modules/database-intelligence/tools/database.tools.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

async function createFixture(): Promise<{ rootPath: string; databasePath: string }> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'db-tools-'));
  const databasePath = path.join(rootPath, 'app.db');
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL); INSERT INTO users (name) VALUES ('A');");
  } finally {
    database.close();
  }
  return { rootPath, databasePath };
}

function createService(): DatabaseIntelligenceService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const connectionPolicy = new DatabaseConnectionPolicyService(safety);
  const readonlyPolicy = new DatabaseReadonlyPolicyService();
  const adapter = new SqliteDatabaseAdapter(connectionPolicy, readonlyPolicy);
  return new DatabaseIntelligenceService(
    new DatabaseAdapterRegistryService(adapter, new PostgresDatabaseAdapter(), new MysqlDatabaseAdapter()),
    connectionPolicy,
  );
}

describe('Database tools', () => {
  it('executes schema, relations, and query preview handlers', async () => {
    const connection = { dialect: 'sqlite' as const, ...(await createFixture()) };
    const service = createService();

    await expect(new DatabaseSchemaTool(service).execute(connection)).resolves.toMatchObject({
      tables: expect.any(Array) as unknown,
    });
    await expect(new DatabaseRelationsTool(service).execute(connection)).resolves.toMatchObject({
      relations: [],
    });
    await expect(
      new DatabaseQueryPreviewTool(service).execute({
        connection,
        query: 'SELECT * FROM users',
      }),
    ).resolves.toMatchObject({
      rowCount: 1,
    });
    await expect(new DatabaseSupportedDialectsTool(service).execute({})).resolves.toMatchObject({
      dialects: expect.any(Array) as unknown,
    });
    await expect(
      new DatabaseConnectionProfileTool(service).execute({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'app',
        username: 'readonly',
      }),
    ).resolves.toMatchObject({
      valid: true,
      executable: false,
    });
  });
});
