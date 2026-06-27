import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { ProjectMemoryPathService } from '../../src/modules/project-memory/services/project-memory-path.service.js';
import { ProjectMemoryService } from '../../src/modules/project-memory/services/project-memory.service.js';
import {
  MemoryExportTool,
  MemoryRecordTool,
  MemoryRefreshTool,
  MemorySearchTool,
  MemorySummarizeTool,
} from '../../src/modules/project-memory/tools/project-memory.tools.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

async function createFixture(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'project-memory-tools-'));
}

function createService(): ProjectMemoryService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  return new ProjectMemoryService(new ProjectMemoryPathService(safety));
}

describe('Project memory tools', () => {
  it('executes record, search, summarize, refresh, and export handlers', async () => {
    const rootPath = await createFixture();
    const service = createService();

    const record = await new MemoryRecordTool(service).execute({
      rootPath,
      category: 'coding_standard',
      title: 'No any',
      content: 'Avoid any unless unavoidable.',
      source: 'engineering-rules',
      tags: ['typescript'],
    });

    expect(record.version).toBe(1);
    await expect(new MemorySearchTool(service).execute({ rootPath, query: 'avoid' })).resolves.toMatchObject({
      totalRecords: 1,
    });
    await expect(new MemorySummarizeTool(service).execute({ rootPath })).resolves.toMatchObject({
      totalRecords: 1,
    });
    await expect(new MemoryRefreshTool(service).execute({ rootPath })).resolves.toMatchObject({
      totalRecords: 1,
    });
    await expect(new MemoryExportTool(service).execute({ rootPath })).resolves.toMatchObject({
      totalRecords: 1,
    });
  });
});
