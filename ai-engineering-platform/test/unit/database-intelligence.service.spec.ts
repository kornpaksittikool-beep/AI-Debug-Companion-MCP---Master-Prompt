import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { DatabaseAdapterRegistryService } from '../../src/modules/database-intelligence/services/database-adapter-registry.service.js';
import { DatabaseConnectionPolicyService } from '../../src/modules/database-intelligence/services/database-connection-policy.service.js';
import { DatabaseIntelligenceService } from '../../src/modules/database-intelligence/services/database-intelligence.service.js';
import { MysqlDatabaseAdapter } from '../../src/modules/database-intelligence/services/mysql-database.adapter.js';
import { PostgresDatabaseAdapter } from '../../src/modules/database-intelligence/services/postgres-database.adapter.js';
import { DatabaseReadonlyPolicyService } from '../../src/modules/database-intelligence/services/database-readonly-policy.service.js';
import { SqliteDatabaseAdapter } from '../../src/modules/database-intelligence/services/sqlite-database.adapter.js';
import type { DatabaseConnectionConfig } from '../../src/modules/database-intelligence/interfaces/database-intelligence.interface.js';

async function createSqliteFixture(): Promise<DatabaseConnectionConfig> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'db-intel-'));
  const databasePath = path.join(rootPath, 'app.db');
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE invoices (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );
      INSERT INTO customers (name) VALUES ('Acme'), ('Beta');
      INSERT INTO invoices (customer_id, total) VALUES (1, 100.5), (2, 42.0);
    `);
  } finally {
    database.close();
  }

  return {
    dialect: 'sqlite',
    rootPath,
    databasePath,
  };
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

describe('DatabaseIntelligenceService', () => {
  it('reads SQLite schema', async () => {
    const connection = await createSqliteFixture();
    const service = createService();

    const schema = service.readSchema(connection);

    expect(schema.tables.map((table) => table.name)).toEqual(['customers', 'invoices']);
    expect(schema.tables[0]?.columns.map((column) => column.name)).toEqual(['id', 'name']);
  });

  it('reads SQLite relations', async () => {
    const connection = await createSqliteFixture();
    const service = createService();

    const result = service.readRelations(connection);

    expect(result.relations).toEqual([
      {
        sourceTable: 'invoices',
        sourceColumn: 'customer_id',
        targetTable: 'customers',
        targetColumn: 'id',
      },
    ]);
  });

  it('previews read-only queries with row limits', async () => {
    const connection = await createSqliteFixture();
    const service = createService();

    const preview = service.previewQuery({
      connection,
      query: 'SELECT id, name FROM customers ORDER BY id',
      maxRows: 1,
    });

    expect(preview.columns).toEqual(['id', 'name']);
    expect(preview.rows).toEqual([{ id: 1, name: 'Acme' }]);
    expect(preview.truncated).toBe(true);
  });

  it('rejects mutation queries', async () => {
    const connection = await createSqliteFixture();
    const service = createService();

    expect(() =>
      service.previewQuery({
        connection,
        query: "DELETE FROM customers WHERE name = 'Acme'",
      }),
    ).toThrow();
  });

  it('reports supported dialect metadata and validates external profiles', () => {
    const service = createService();

    expect(service.supportedDialects().dialects.map((dialect) => dialect.dialect)).toEqual([
      'sqlite',
      'postgres',
      'mysql',
    ]);
    expect(
      service.connectionProfile({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'app',
        username: 'readonly',
        sslMode: 'prefer',
      }),
    ).toMatchObject({
      dialect: 'postgres',
      valid: true,
      executable: false,
    });
  });

  it('rejects external database execution until a driver phase is approved', () => {
    const service = createService();

    expect(() =>
      service.readSchema({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'app',
        username: 'readonly',
      }),
    ).toThrow('Read execution for "mysql" is not enabled in Phase 14.');
  });
});
