import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryGraphService } from '../../src/modules/repository-intelligence/services/repository-graph.service.js';
import { RepositoryIndexStoreService } from '../../src/modules/repository-intelligence/services/repository-index-store.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositoryMultiRootService } from '../../src/modules/repository-intelligence/services/repository-multi-root.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';
import { RepositorySymbolService } from '../../src/modules/repository-intelligence/services/repository-symbol.service.js';
import { TypeScriptGraphParserService } from '../../src/modules/repository-intelligence/services/typescript-graph-parser.service.js';
import { TypeScriptSymbolParserService } from '../../src/modules/repository-intelligence/services/typescript-symbol-parser.service.js';
import {
  RepositoryCallGraphTool,
  RepositoryCrossRepoSearchTool,
  RepositoryImportGraphTool,
  RepositoryIndexStatusTool,
  RepositoryOverviewTool,
  RepositoryReadFileContextTool,
  RepositoryReadSymbolContextTool,
  RepositoryRebuildIndexTool,
  RepositoryScanTool,
  RepositorySearchFilesTool,
  RepositorySearchSymbolsTool,
} from '../../src/modules/repository-intelligence/tools/repository.tools.js';

async function createFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-tools-'));
  await fs.writeFile(path.join(root, 'README.md'), '# Demo\n');
  await fs.writeFile(path.join(root, 'helper.ts'), 'export function helper(): string { return "ok"; }\n');
  await fs.writeFile(
    path.join(root, 'service.ts'),
    'import { helper } from "./helper";\nexport class Service { run(): string { return helper(); } }\n',
  );
  return root;
}

function createService(): RepositoryIntelligenceService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  return new RepositoryIntelligenceService(scanner, safety);
}

function createSymbolService(): RepositorySymbolService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  const parser = new TypeScriptSymbolParserService(safety);
  return new RepositorySymbolService(scanner, safety, parser);
}

function createGraphServices(): {
  readonly graph: RepositoryGraphService;
  readonly index: RepositoryIndexStoreService;
  readonly multiRoot: RepositoryMultiRootService;
} {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  const repository = new RepositoryIntelligenceService(scanner, safety);
  const graph = new RepositoryGraphService(scanner, new TypeScriptGraphParserService(safety));
  return {
    graph,
    index: new RepositoryIndexStoreService(safety, graph),
    multiRoot: new RepositoryMultiRootService(repository),
  };
}

describe('Repository tools', () => {
  it('executes overview, scan, search, and file context handlers', async () => {
    const rootPath = await createFixture();
    const service = createService();

    await expect(new RepositoryOverviewTool(service).execute({ rootPath })).resolves.toMatchObject({
      fileCount: 3,
    });
    await expect(new RepositoryScanTool(service).execute({ rootPath })).resolves.toMatchObject({
      rootPath,
    });
    const searchResult = await new RepositorySearchFilesTool(service).execute({
      rootPath,
      query: 'Service',
    });
    expect(Array.isArray(searchResult.matches)).toBe(true);
    await expect(
      new RepositoryReadFileContextTool(service).execute({ rootPath, filePath: 'README.md' }),
    ).resolves.toMatchObject({
      relativePath: 'README.md',
    });
  });

  it('executes symbol search and symbol context handlers', async () => {
    const rootPath = await createFixture();
    const service = createSymbolService();

    await expect(new RepositorySearchSymbolsTool(service).execute({ rootPath, query: 'Service' })).resolves.toMatchObject({
      rootPath,
    });
    await expect(
      new RepositoryReadSymbolContextTool(service).execute({
        rootPath,
        symbolName: 'Service',
        filePath: 'service.ts',
      }),
    ).resolves.toMatchObject({
      context: 'export class Service { run(): string { return helper(); } }',
    });
  });

  it('executes graph, index, and cross-repository handlers', async () => {
    const rootPath = await createFixture();
    const { graph, index, multiRoot } = createGraphServices();

    await expect(new RepositoryImportGraphTool(graph).execute({ rootPath })).resolves.toMatchObject({
      unresolvedCount: 0,
    });
    const callGraphResult = await new RepositoryCallGraphTool(graph).execute({ rootPath, query: 'helper' });
    expect(callGraphResult.edges).toEqual(
      expect.arrayContaining([expect.objectContaining({ calleeName: 'helper' })]),
    );
    await expect(new RepositoryRebuildIndexTool(index).execute({ rootPath })).resolves.toMatchObject({
      indexedFiles: 2,
    });
    await expect(new RepositoryIndexStatusTool(index).execute({ rootPath })).resolves.toMatchObject({
      stale: false,
    });
    const crossRepoResult = await new RepositoryCrossRepoSearchTool(multiRoot).execute({
      repositories: [{ rootPath }],
      query: 'Demo',
      extension: '.md',
    });
    expect(crossRepoResult.repositories).toBe(1);
    expect(crossRepoResult.matches).toEqual(
      expect.arrayContaining([expect.objectContaining({ relativePath: 'README.md' })]),
    );
  });
});
