import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositoryGraphService } from '../../src/modules/repository-intelligence/services/repository-graph.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryIndexStoreService } from '../../src/modules/repository-intelligence/services/repository-index-store.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositoryMultiRootService } from '../../src/modules/repository-intelligence/services/repository-multi-root.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';
import { TypeScriptGraphParserService } from '../../src/modules/repository-intelligence/services/typescript-graph-parser.service.js';

async function createGraphFixture(prefix = 'repo-graph-'): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
  await fs.writeFile(
    path.join(rootPath, 'src', 'service.ts'),
    [
      'import { helper } from "./helper";',
      'export class Service {',
      '  run(): string {',
      '    return helper();',
      '  }',
      '}',
      'export async function loadFeature(): Promise<unknown> {',
      '  return import("./feature");',
      '}',
    ].join('\n'),
  );
  await fs.writeFile(path.join(rootPath, 'src', 'helper.ts'), 'export function helper(): string { return "ok"; }\n');
  await fs.writeFile(path.join(rootPath, 'src', 'feature.ts'), 'export const feature = true;\n');
  await fs.writeFile(path.join(rootPath, 'README.md'), '# Service docs\n');
  return rootPath;
}

function createServices(): {
  readonly graph: RepositoryGraphService;
  readonly index: RepositoryIndexStoreService;
  readonly multiRoot: RepositoryMultiRootService;
} {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  const parser = new TypeScriptGraphParserService(safety);
  const graph = new RepositoryGraphService(scanner, parser);
  const repository = new RepositoryIntelligenceService(scanner, safety);
  return {
    graph,
    index: new RepositoryIndexStoreService(safety, graph),
    multiRoot: new RepositoryMultiRootService(repository),
  };
}

describe('RepositoryGraphService', () => {
  it('builds import graphs with relative resolution and dynamic import edges', async () => {
    const rootPath = await createGraphFixture();
    const { graph } = createServices();

    const result = await graph.importGraph({ rootPath });

    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRelativePath: 'src/service.ts',
          specifier: './helper',
          resolvedRelativePath: 'src/helper.ts',
          unresolved: false,
        }),
        expect.objectContaining({
          sourceRelativePath: 'src/service.ts',
          specifier: './feature',
          kind: 'dynamic',
          resolvedRelativePath: 'src/feature.ts',
        }),
      ]),
    );
    expect(result.unresolvedCount).toBe(0);
  });

  it('builds best-effort call graphs from TypeScript AST calls', async () => {
    const rootPath = await createGraphFixture();
    const { graph } = createServices();

    const result = await graph.callGraph({ rootPath, query: 'helper' });

    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRelativePath: 'src/service.ts',
          callerName: 'run',
          calleeName: 'helper',
        }),
      ]),
    );
  });
});

describe('RepositoryIndexStoreService', () => {
  it('rebuilds persistent index and reports changed files', async () => {
    const rootPath = await createGraphFixture('repo-index-');
    const { index } = createServices();

    const initialStatus = await index.status({ rootPath });
    expect(initialStatus.indexExists).toBe(false);
    expect(initialStatus.stale).toBe(true);

    const rebuilt = await index.rebuild({ rootPath });
    expect(rebuilt.indexedFiles).toBe(3);
    expect(rebuilt.importEdges).toBe(2);
    expect(rebuilt.changedFiles).toEqual(expect.arrayContaining(['src/service.ts']));

    const cleanStatus = await index.status({ rootPath });
    expect(cleanStatus.indexExists).toBe(true);
    expect(cleanStatus.stale).toBe(false);

    await fs.appendFile(path.join(rootPath, 'src', 'helper.ts'), '\nexport const changed = true;\n');
    const changedStatus = await index.status({ rootPath });
    expect(changedStatus.changedFiles).toContain('src/helper.ts');
    expect(changedStatus.stale).toBe(true);
  });
});

describe('RepositoryMultiRootService', () => {
  it('searches multiple repository roots with bounded per-repository results', async () => {
    const firstRoot = await createGraphFixture('repo-cross-a-');
    const secondRoot = await createGraphFixture('repo-cross-b-');
    const { multiRoot } = createServices();

    const result = await multiRoot.crossRepositorySearch({
      repositories: [{ rootPath: firstRoot }, { rootPath: secondRoot }],
      query: 'Service',
      extension: '.md',
      maxMatchesPerRepository: 1,
    });

    expect(result.repositories).toBe(2);
    expect(result.matches).toHaveLength(2);
    expect(result.matches.every((match) => match.relativePath === 'README.md')).toBe(true);
  });
});
