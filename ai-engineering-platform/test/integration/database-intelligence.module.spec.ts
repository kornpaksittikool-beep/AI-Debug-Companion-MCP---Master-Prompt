import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

async function createFixture(): Promise<{ rootPath: string; databasePath: string }> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'db-module-'));
  const databasePath = path.join(rootPath, 'app.db');
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL); INSERT INTO users (name) VALUES ('A');");
  } finally {
    database.close();
  }
  return { rootPath, databasePath };
}

describe('DatabaseIntelligenceModule integration', () => {
  it('registers database tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'database.supported_dialects',
        'database.connection_profile',
        'database.schema',
        'database.relations',
        'database.query_preview',
      ]),
    );

    await moduleRef.close();
  });

  it('executes query preview through core execution', async () => {
    const connection = { dialect: 'sqlite' as const, ...(await createFixture()) };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'database.query_preview',
      input: {
        connection,
        query: 'SELECT * FROM users',
        maxRows: 5,
      },
      correlationId: 'corr_db',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.rowCount).toBe(1);
    }

    await moduleRef.close();
  });

  it('executes connection profile through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'database.connection_profile',
      input: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'app',
        username: 'readonly',
      },
      correlationId: 'corr_db_profile',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatchObject({
        dialect: 'postgres',
        valid: true,
        executable: false,
      });
    }

    await moduleRef.close();
  });
});
