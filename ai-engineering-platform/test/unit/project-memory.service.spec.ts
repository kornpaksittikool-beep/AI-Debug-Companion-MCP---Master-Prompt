import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { ProjectMemoryPathService } from '../../src/modules/project-memory/services/project-memory-path.service.js';
import { ProjectMemoryService } from '../../src/modules/project-memory/services/project-memory.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

async function createFixture(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'project-memory-'));
}

function createService(): ProjectMemoryService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  return new ProjectMemoryService(new ProjectMemoryPathService(safety));
}

describe('ProjectMemoryService', () => {
  it('records versioned memory and searches by query, category, and tags', async () => {
    const rootPath = await createFixture();
    const service = createService();

    const first = await service.record({
      rootPath,
      category: 'architecture',
      title: 'Module boundaries',
      content: 'Planning and patch workflows are separate modules.',
      source: 'phase-8-test',
      tags: ['module', 'boundary'],
    });
    const second = await service.record({
      rootPath,
      category: 'known_issue',
      title: 'SQLite warning',
      content: 'Node sqlite is experimental.',
      source: 'phase-4-report',
      tags: ['sqlite'],
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    await expect(service.search({ rootPath, query: 'patch', category: 'architecture' })).resolves.toMatchObject({
      totalRecords: 1,
    });
    await expect(service.search({ rootPath, tags: ['sqlite'] })).resolves.toMatchObject({
      totalRecords: 1,
    });
  });

  it('summarizes, refreshes, and exports memory records', async () => {
    const rootPath = await createFixture();
    const service = createService();
    await service.record({
      rootPath,
      category: 'project_decision',
      title: 'Use JSONL memory',
      content: 'Phase 8 starts with append-only JSONL storage.',
      source: 'phase-8',
    });

    const summary = await service.summarize({ rootPath });
    const refresh = await service.refresh({ rootPath });
    const exported = await service.export({ rootPath });

    expect(summary.totalRecords).toBe(1);
    expect(refresh.snapshotPath.endsWith('.ai-engineering-platform\\memory\\snapshot.json') || refresh.snapshotPath.endsWith('.ai-engineering-platform/memory/snapshot.json')).toBe(true);
    await expect(fs.stat(refresh.snapshotPath)).resolves.toBeDefined();
    expect(exported.records).toHaveLength(1);
  });

  it('rejects invalid search limits', async () => {
    const rootPath = await createFixture();
    const service = createService();

    await expect(service.search({ rootPath, limit: 0 })).rejects.toThrow('Invalid memory search limit');
  });
});
