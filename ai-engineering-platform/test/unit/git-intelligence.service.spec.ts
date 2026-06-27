import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { GitCommandRunnerService } from '../../src/modules/git-intelligence/services/git-command-runner.service.js';
import { GitIntelligenceService } from '../../src/modules/git-intelligence/services/git-intelligence.service.js';
import { GitSafetyService } from '../../src/modules/git-intelligence/services/git-safety.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';

const execFileAsync = promisify(execFile);

async function runGit(rootPath: string, args: readonly string[]): Promise<void> {
  await execFileAsync('git', [...args], { cwd: rootPath, windowsHide: true });
}

async function createGitFixture(): Promise<{ rootPath: string; filePath: string }> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'git-intel-'));
  const filePath = path.join(rootPath, 'README.md');

  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);

  await fs.writeFile(filePath, 'first line\n');
  await runGit(rootPath, ['add', 'README.md']);
  await runGit(rootPath, ['commit', '-m', 'initial readme']);

  await fs.appendFile(filePath, 'second line\n');
  await runGit(rootPath, ['add', 'README.md']);
  await runGit(rootPath, ['commit', '-m', 'expand readme']);

  return { rootPath, filePath };
}

function createService(): GitIntelligenceService {
  const repositorySafety = new RepositorySafetyService(new PathPolicyService());
  const gitSafety = new GitSafetyService(repositorySafety);
  const runner = new GitCommandRunnerService();
  return new GitIntelligenceService(gitSafety, runner);
}

describe('GitIntelligenceService', () => {
  it('reads recent commits with bounded output', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    const result = await service.recentChanges({ rootPath, maxCommits: 1 });

    expect(result.rootPath).toBe(rootPath);
    expect(result.commits).toHaveLength(1);
    expect(result.commits[0]?.subject).toBe('expand readme');
    expect(result.commits[0]?.authorEmail).toBe('test@example.com');
  });

  it('reads commit history for a specific file', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    const result = await service.findCommitByFile({ rootPath, filePath: 'README.md', maxCommits: 5 });

    expect(result.filePath).toBe('README.md');
    expect(result.commits.map((commit) => commit.subject)).toEqual([
      'expand readme',
      'initial readme',
    ]);
  });

  it('reads blame metadata for a file', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    const result = await service.blame({ rootPath, filePath: 'README.md' });

    expect(result.lines).toHaveLength(2);
    expect(result.lines.map((line) => line.content)).toEqual(['first line', 'second line']);
    expect(result.lines.every((line) => line.author === 'Test User')).toBe(true);
  });

  it('rejects commit limits outside the bounded policy', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    await expect(service.recentChanges({ rootPath, maxCommits: 0 })).rejects.toThrow(
      'Invalid git commit limit',
    );
  });

  it('rejects file paths outside the repository root', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    await expect(
      service.findCommitByFile({ rootPath, filePath: path.join(rootPath, '..', 'outside.ts') }),
    ).rejects.toThrow('outside the repository root');
  });

  it('summarizes impact hints from recent file history', async () => {
    const { rootPath } = await createGitFixture();
    const service = createService();

    const result = await service.impactHints({ rootPath, maxCommits: 2 });

    expect(result.analyzedCommits).toBe(2);
    expect(result.hints[0]).toMatchObject({
      filePath: 'README.md',
      changeCount: 2,
      riskLevel: 'medium',
    });
  });
});
