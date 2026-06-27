import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

const execFileAsync = promisify(execFile);

async function runGit(rootPath: string, args: readonly string[]): Promise<void> {
  await execFileAsync('git', [...args], { cwd: rootPath, windowsHide: true });
}

async function createGitFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'git-module-'));
  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);
  await fs.writeFile(path.join(rootPath, 'README.md'), 'hello\n');
  await runGit(rootPath, ['add', 'README.md']);
  await runGit(rootPath, ['commit', '-m', 'initial readme']);
  return rootPath;
}

describe('GitIntelligenceModule integration', () => {
  it('registers git tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'git.recent_changes',
        'git.blame',
        'git.find_commit_by_file',
        'git.impact_hints',
      ]),
    );

    await moduleRef.close();
  });

  it('executes recent changes through core execution', async () => {
    const rootPath = await createGitFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'git.recent_changes',
      input: { rootPath, maxCommits: 1 },
      correlationId: 'corr_git',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.commits).toHaveLength(1);
    }

    await moduleRef.close();
  });
});
