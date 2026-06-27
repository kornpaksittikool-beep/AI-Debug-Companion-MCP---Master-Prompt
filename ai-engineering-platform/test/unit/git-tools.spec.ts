import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { GitCommandRunnerService } from '../../src/modules/git-intelligence/services/git-command-runner.service.js';
import { GitIntelligenceService } from '../../src/modules/git-intelligence/services/git-intelligence.service.js';
import { GitSafetyService } from '../../src/modules/git-intelligence/services/git-safety.service.js';
import {
  GitBlameTool,
  GitFindCommitByFileTool,
  GitRecentChangesTool,
} from '../../src/modules/git-intelligence/tools/git.tools.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

const execFileAsync = promisify(execFile);

async function runGit(rootPath: string, args: readonly string[]): Promise<void> {
  await execFileAsync('git', [...args], { cwd: rootPath, windowsHide: true });
}

async function createGitFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'git-tools-'));
  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);
  await fs.writeFile(path.join(rootPath, 'README.md'), 'hello\n');
  await runGit(rootPath, ['add', 'README.md']);
  await runGit(rootPath, ['commit', '-m', 'initial readme']);
  return rootPath;
}

function createService(): GitIntelligenceService {
  const repositorySafety = new RepositorySafetyService(new PathPolicyService());
  return new GitIntelligenceService(
    new GitSafetyService(repositorySafety),
    new GitCommandRunnerService(),
  );
}

describe('Git tools', () => {
  it('executes recent changes, blame, and file history handlers', async () => {
    const rootPath = await createGitFixture();
    const service = createService();

    const recentChanges = await new GitRecentChangesTool(service).execute({ rootPath });
    const blame = await new GitBlameTool(service).execute({ rootPath, filePath: 'README.md' });
    const fileHistory = await new GitFindCommitByFileTool(service).execute({
      rootPath,
      filePath: 'README.md',
    });

    expect(Array.isArray(recentChanges.commits)).toBe(true);
    expect(Array.isArray(blame.lines)).toBe(true);
    expect(Array.isArray(fileHistory.commits)).toBe(true);
  });
});
