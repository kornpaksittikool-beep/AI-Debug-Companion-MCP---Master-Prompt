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

async function createFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'planning-module-'));
  await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
  await fs.writeFile(path.join(rootPath, 'src', 'login.service.ts'), 'export class LoginService {}\n');
  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);
  await runGit(rootPath, ['add', '.']);
  await runGit(rootPath, ['commit', '-m', 'initial login service']);
  return rootPath;
}

describe('PlanningImpactModule integration', () => {
  it('registers planning tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'planning.create_plan',
        'planning.impact_report',
        'planning.approval_gate',
        'planning.summarize_plan',
      ]),
    );

    await moduleRef.close();
  });

  it('executes create plan and approval gate through core execution', async () => {
    const rootPath = await createFixture();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const createResult = await execution.execute({
      toolName: 'planning.create_plan',
      input: {
        objective: 'Fix login validation bug',
        rootPath,
        targetSymbols: ['LoginService'],
      },
      correlationId: 'corr_plan',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      throw new Error('Expected planning.create_plan to succeed.');
    }

    const planId = requireString(createResult.output.id);
    const approvalResult = await execution.execute({
      toolName: 'planning.approval_gate',
      input: {
        planId,
        decision: 'request_approval',
      },
      correlationId: 'corr_approval',
    });

    expect(approvalResult.ok).toBe(true);
    if (approvalResult.ok) {
      expect(approvalResult.output.status).toBe('pending_approval');
    }

    await moduleRef.close();
  });
});
