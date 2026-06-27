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

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected string value.');
  }
  return value;
}

async function runGit(rootPath: string, args: readonly string[]): Promise<void> {
  await execFileAsync('git', [...args], { cwd: rootPath, windowsHide: true });
}

async function createGitFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-module-'));
  await fs.writeFile(path.join(rootPath, 'README.md'), '# Patch fixture\n');
  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);
  await runGit(rootPath, ['add', '.']);
  await runGit(rootPath, ['commit', '-m', 'initial patch fixture']);
  return rootPath;
}

describe('PatchVerificationModule integration', () => {
  it('registers patch and verification tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'patch.create_proposal',
        'patch.summarize_proposal',
        'patch.rollback_plan',
        'patch.apply_proposal',
        'patch.rollback_apply',
        'verification.run_check',
        'verification.summarize_result',
      ]),
    );

    await moduleRef.close();
  });

  it('executes approved-plan patch proposal flow through core execution', async () => {
    const rootPath = await createGitFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const plan = await execution.execute({
      toolName: 'planning.create_plan',
      input: {
        objective: 'Fix documentation typo',
        rootPath,
        targetFiles: ['README.md'],
      },
      correlationId: 'corr_patch_plan',
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      throw new Error('Expected planning.create_plan to succeed.');
    }
    const planId = requireString(plan.output.id);

    const approval = await execution.execute({
      toolName: 'planning.approval_gate',
      input: { planId, decision: 'approve' },
      correlationId: 'corr_patch_approval',
    });
    expect(approval.ok).toBe(true);

    const proposal = await execution.execute({
      toolName: 'patch.create_proposal',
      input: {
        planId,
        rootPath,
        changes: [
          {
            operation: 'update',
            filePath: 'README.md',
            summary: 'Clarify documentation wording.',
            proposedContent: '# Patch fixture updated\n',
          },
        ],
      },
      correlationId: 'corr_patch_proposal',
    });

    expect(proposal.ok).toBe(true);
    if (proposal.ok) {
      expect(proposal.output.status).toBe('ready_for_review');
    }

    if (!proposal.ok) {
      throw new Error('Expected patch.create_proposal to succeed.');
    }
    const proposalId = requireString(proposal.output.id);
    const apply = await execution.execute({
      toolName: 'patch.apply_proposal',
      input: { proposalId },
      correlationId: 'corr_patch_apply',
    });
    expect(apply.ok).toBe(true);
    if (!apply.ok) {
      throw new Error('Expected patch.apply_proposal to succeed.');
    }
    expect(apply.output.status).toBe('applied');
    await expect(fs.readFile(path.join(rootPath, 'README.md'), 'utf8')).resolves.toBe('# Patch fixture updated\n');

    const rollback = await execution.execute({
      toolName: 'patch.rollback_apply',
      input: { applyRunId: requireString(apply.output.id) },
      correlationId: 'corr_patch_apply_rollback',
    });
    expect(rollback.ok).toBe(true);
    await expect(fs.readFile(path.join(rootPath, 'README.md'), 'utf8')).resolves.toBe('# Patch fixture\n');

    await moduleRef.close();
  });
});
