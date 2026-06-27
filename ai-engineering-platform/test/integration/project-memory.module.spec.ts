import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

async function createFixture(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'project-memory-module-'));
}

describe('ProjectMemoryModule integration', () => {
  it('registers memory tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'memory.record',
        'memory.search',
        'memory.summarize',
        'memory.refresh',
        'memory.export',
      ]),
    );

    await moduleRef.close();
  });

  it('records and searches memory through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const record = await execution.execute({
      toolName: 'memory.record',
      input: {
        rootPath,
        category: 'architecture',
        title: 'Memory module',
        content: 'Project memory writes only to the platform memory directory.',
        source: 'integration-test',
      },
      correlationId: 'corr_memory_record',
    });
    expect(record.ok).toBe(true);

    const search = await execution.execute({
      toolName: 'memory.search',
      input: { rootPath, query: 'platform memory' },
      correlationId: 'corr_memory_search',
    });
    expect(search.ok).toBe(true);
    if (search.ok) {
      expect(search.output.totalRecords).toBe(1);
    }

    await moduleRef.close();
  });
});
