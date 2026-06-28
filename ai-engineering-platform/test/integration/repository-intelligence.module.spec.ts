import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

async function createFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-module-'));
  await fs.writeFile(path.join(root, 'README.md'), '# Demo\n');
  await fs.writeFile(path.join(root, 'helper.ts'), 'export function helper(): string { return "ok"; }\n');
  await fs.writeFile(
    path.join(root, 'service.ts'),
    'import { helper } from "./helper";\nexport class Service { run(): string { return helper(); } }\n',
  );
  return root;
}

describe('RepositoryIntelligenceModule integration', () => {
  it('registers repository tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'repository.project_profile',
        'repository.overview',
        'repository.scan',
        'repository.search_files',
        'repository.read_file_context',
        'repository.read_module_context',
        'repository.search_symbols',
        'repository.read_symbol_context',
        'repository.import_graph',
        'repository.call_graph',
        'repository.index_status',
        'repository.rebuild_index',
        'repository.cross_repo_search',
      ]),
    );

    await moduleRef.close();
  });

  it('executes repository project profile through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'repository.project_profile',
      input: { rootPath },
      correlationId: 'corr_repo_profile',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.tokenPolicy).toMatchObject({
        profile: 'compact',
        exactCodexBillingAvailable: false,
      });
    }

    await moduleRef.close();
  });

  it('executes repository overview through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'repository.overview',
      input: { rootPath },
      correlationId: 'corr_repo',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.fileCount).toBe(3);
    }

    await moduleRef.close();
  });

  it('executes symbol search through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'repository.search_symbols',
      input: { rootPath, query: 'Service' },
      correlationId: 'corr_symbols',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.symbols).toHaveLength(1);
    }

    await moduleRef.close();
  });

  it('executes import graph through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'repository.import_graph',
      input: { rootPath },
      correlationId: 'corr_import_graph',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            specifier: './helper',
            resolvedRelativePath: 'helper.ts',
          }),
        ]),
      );
    }

    await moduleRef.close();
  });
});
