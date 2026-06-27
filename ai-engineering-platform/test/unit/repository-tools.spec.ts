import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';
import {
  RepositoryOverviewTool,
  RepositoryReadFileContextTool,
  RepositoryScanTool,
  RepositorySearchFilesTool,
} from '../../src/modules/repository-intelligence/tools/repository.tools.js';

async function createFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-tools-'));
  await fs.writeFile(path.join(root, 'README.md'), '# Demo\n');
  await fs.writeFile(path.join(root, 'service.ts'), 'export class Service {}\n');
  return root;
}

function createService(): RepositoryIntelligenceService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  return new RepositoryIntelligenceService(scanner, safety);
}

describe('Repository tools', () => {
  it('executes overview, scan, search, and file context handlers', async () => {
    const rootPath = await createFixture();
    const service = createService();

    await expect(new RepositoryOverviewTool(service).execute({ rootPath })).resolves.toMatchObject({
      fileCount: 2,
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
});
