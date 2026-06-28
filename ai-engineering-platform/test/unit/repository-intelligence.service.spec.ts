import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';

async function createFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-intel-'));
  await fs.mkdir(path.join(root, 'src', 'module'), { recursive: true });
  await fs.mkdir(path.join(root, 'node_modules', 'ignored'), { recursive: true });
  await fs.writeFile(path.join(root, 'README.md'), '# Demo\nservice overview\n');
  await fs.writeFile(path.join(root, 'src', 'index.ts'), 'export const value = 1;\n');
  await fs.writeFile(path.join(root, 'src', 'module', 'service.ts'), 'export class Service {}\n');
  await fs.writeFile(path.join(root, 'node_modules', 'ignored', 'package.js'), 'ignored');
  return root;
}

function createService(): RepositoryIntelligenceService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const ignore = new RepositoryIgnoreService();
  const scanner = new RepositoryScannerService(ignore, safety);
  return new RepositoryIntelligenceService(scanner, safety);
}

describe('RepositoryIntelligenceService', () => {
  it('scans files with default ignore rules and bounds', async () => {
    const root = await createFixture();
    const service = createService();

    const result = await service.scan({ rootPath: root, maxFiles: 10, includeTextPreview: true });

    expect(result.files.map((file) => file.relativePath)).toEqual(
      expect.arrayContaining(['README.md', 'src/index.ts', 'src/module/service.ts']),
    );
    expect(result.files.some((file) => file.relativePath.includes('node_modules'))).toBe(false);
    expect(result.ignoredEntries).toContain('node_modules');
  });

  it('returns overview with extension counts', async () => {
    const root = await createFixture();
    const service = createService();

    const overview = await service.overview({ rootPath: root });

    expect(overview.fileCount).toBe(3);
    expect(overview.extensionCounts).toEqual(
      expect.arrayContaining([
        { extension: '.ts', count: 2 },
        { extension: '.md', count: 1 },
      ]),
    );
  });

  it('returns a compact project profile with billing limits', async () => {
    const root = await createFixture();
    await fs.writeFile(path.join(root, 'package.json'), '{"name":"demo"}\n');
    const service = createService();

    const profile = await service.projectProfile({ rootPath: root });

    expect(profile.tokenPolicy).toMatchObject({
      profile: 'compact',
      exactCodexBillingAvailable: false,
    });
    expect(profile.keyFiles.map((file) => file.relativePath)).toEqual(expect.arrayContaining(['README.md']));
    expect(profile.packageManifests.map((file) => file.relativePath)).toEqual(expect.arrayContaining(['package.json']));
    expect(profile.tokenPolicy.avoidUntilNeeded).toContain('repository.overview');
  });

  it('returns a smaller summary project profile for routine summaries', async () => {
    const root = await createFixture();
    await fs.writeFile(path.join(root, 'package.json'), '{"name":"demo"}\n');
    await fs.writeFile(path.join(root, 'tsconfig.json'), '{}\n');
    await fs.writeFile(path.join(root, 'Dockerfile'), 'FROM node\n');
    await fs.writeFile(path.join(root, 'PRODUCTION_CHECKLIST.md'), '# Checklist\n');
    await fs.writeFile(path.join(root, 'src', 'main.ts'), 'bootstrap();\n');
    const service = createService();

    const profile = await service.projectProfile({ rootPath: root, mode: 'summary' });

    expect(profile.tokenPolicy.profile).toBe('summary');
    expect(profile.keyFiles.length).toBeLessThanOrEqual(5);
    expect(profile.packageManifests.length).toBeLessThanOrEqual(5);
    expect(profile.entrypointHints.length).toBeLessThanOrEqual(5);
    expect(profile.extensionCounts.length).toBeLessThanOrEqual(4);
    expect(profile.largestFiles).toHaveLength(0);
  });

  it('searches files by query and extension', async () => {
    const root = await createFixture();
    const service = createService();

    const result = await service.searchFiles({ rootPath: root, query: 'Service', extension: '.ts' });

    expect(result.matches.map((file) => file.relativePath)).toEqual(['src/module/service.ts']);
  });

  it('caps summary file search results and omits preview text', async () => {
    const root = await createFixture();
    for (let index = 0; index < 20; index += 1) {
      await fs.writeFile(path.join(root, `feature-${index}.md`), `# feature ${index}\n${'x'.repeat(500)}`);
    }
    const service = createService();

    const result = await service.searchFiles({
      rootPath: root,
      query: 'feature',
      mode: 'summary',
      maxMatches: 20,
    });

    expect(result.totalMatches).toBe(20);
    expect(result.returnedMatches).toBe(8);
    expect(result.truncated).toBe(true);
    expect(result.tokenPolicy).toMatchObject({ profile: 'summary', maxMatches: 8 });
    expect(result.matches.every((file) => file.textPreview === undefined)).toBe(true);
  });

  it('reads bounded file context', async () => {
    const root = await createFixture();
    const service = createService();

    const context = await service.readFileContext({
      rootPath: root,
      filePath: 'README.md',
      maxBytes: 6,
    });

    expect(context.relativePath).toBe('README.md');
    expect(context.content).toBe('# Demo');
    expect(context.truncated).toBe(true);
  });

  it('reads compact file excerpts for summary routing', async () => {
    const root = await createFixture();
    await fs.writeFile(path.join(root, 'LONG.md'), '# Long\n' + 'x'.repeat(3000));
    const service = createService();

    const excerpt = await service.readFileExcerpt({
      rootPath: root,
      filePath: 'LONG.md',
      purpose: 'summary',
    });

    expect(excerpt.relativePath).toBe('LONG.md');
    expect(excerpt.excerpt.length).toBeLessThanOrEqual(1200);
    expect(excerpt.truncated).toBe(true);
    expect(excerpt.tokenPolicy.escalationTool).toBe('repository.read_file_context');
  });

  it('reads bounded module context', async () => {
    const root = await createFixture();
    const service = createService();

    const context = await service.readModuleContext({
      rootPath: root,
      modulePath: 'src',
      maxFiles: 2,
      maxDepth: 2,
    });

    expect(context.files).toHaveLength(2);
    expect(context.modulePath).toBe('src');
  });

  it('rejects path traversal outside the repository root', async () => {
    const root = await createFixture();
    const service = createService();

    await expect(
      service.readFileContext({
        rootPath: root,
        filePath: path.join(root, '..', 'outside.txt'),
      }),
    ).rejects.toThrow('outside the repository root');
  });
});
