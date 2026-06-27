import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { CacheInvalidationService } from '../../src/modules/performance-security/services/cache-invalidation.service.js';
import { CacheStoreService } from '../../src/modules/performance-security/services/cache-store.service.js';
import { SecurityAuditService } from '../../src/modules/performance-security/services/security-audit.service.js';
import {
  PerformanceCacheSummaryTool,
  PerformanceInvalidateCacheTool,
  SecurityAuditProjectTool,
  SecurityAuditToolPermissionsTool,
} from '../../src/modules/performance-security/tools/performance-security.tools.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';

async function createFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'perf-sec-tools-'));
  await fs.writeFile(path.join(rootPath, 'prompt.txt'), 'system prompt exfiltrate api key\n');
  return rootPath;
}

function createAuditService(): SecurityAuditService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  return new SecurityAuditService(
    new RepositoryIntelligenceService(scanner, safety),
    new ToolRegistryService(),
  );
}

describe('Performance security tools', () => {
  it('executes cache summary and invalidation handlers', async () => {
    const cache = new CacheStoreService();
    cache.set('repository.scan', 'key', { value: true });
    const service = new CacheInvalidationService(cache);

    await expect(new PerformanceCacheSummaryTool(service).execute({})).resolves.toMatchObject({
      totalEntries: 1,
    });
    await expect(new PerformanceInvalidateCacheTool(service).execute({ namespace: 'repository.scan' })).resolves.toMatchObject({
      invalidatedEntries: 1,
    });
  });

  it('executes security audit handlers', async () => {
    const rootPath = await createFixture();
    const service = createAuditService();

    await expect(new SecurityAuditProjectTool(service).execute({ rootPath })).resolves.toMatchObject({
      scannedFiles: 1,
    });
    await expect(new SecurityAuditToolPermissionsTool(service).execute({})).resolves.toMatchObject({
      auditedTools: 0,
    });
  });
});
