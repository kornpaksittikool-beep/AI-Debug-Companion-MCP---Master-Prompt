import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { CommandPolicyService } from '../../src/core/security/command-policy.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { PatchApplyService } from '../../src/modules/patch-verification/services/patch-apply.service.js';
import { PatchProposalStoreService } from '../../src/modules/patch-verification/services/patch-proposal-store.service.js';
import { PatchProposalService } from '../../src/modules/patch-verification/services/patch-proposal.service.js';
import { VerificationRunnerService } from '../../src/modules/patch-verification/services/verification-runner.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { PlanningService } from '../../src/modules/planning-impact/services/planning.service.js';
import { createPlanningFixture } from './planning-impact.fixture.js';

async function createPackageFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-runner-'));
  await fs.writeFile(
    path.join(rootPath, 'package.json'),
    JSON.stringify({ scripts: { build: 'node -e "process.exit(0)"' } }),
  );
  return rootPath;
}

async function createApprovedPlan(): Promise<{
  readonly rootPath: string;
  readonly planning: PlanningService;
  readonly store: PatchProposalStoreService;
  readonly safety: RepositorySafetyService;
  readonly planId: string;
}> {
  const fixture = await createPlanningFixture();
  const planning = new PlanningService(
    fixture.store,
    fixture.investigation,
    fixture.repository,
    fixture.symbols,
    fixture.database,
    fixture.git,
  );
  const plan = await planning.createPlan({
    objective: 'Fix login validation bug',
    rootPath: fixture.rootPath,
    targetFiles: ['src/auth/login.service.ts'],
  });
  planning.approvalGate({ planId: plan.id, decision: 'approve' });
  return {
    rootPath: fixture.rootPath,
    planning,
    store: new PatchProposalStoreService(),
    safety: new RepositorySafetyService(new PathPolicyService()),
    planId: plan.id,
  };
}

describe('PatchProposalService', () => {
  it('creates a reviewable proposal only when the plan is approved', async () => {
    const fixture = await createApprovedPlan();
    const service = new PatchProposalService(fixture.store, fixture.planning, fixture.safety);

    const proposal = service.createProposal({
      planId: fixture.planId,
      rootPath: fixture.rootPath,
      changes: [
        {
          operation: 'update',
          filePath: 'src/auth/login.service.ts',
          summary: 'Adjust login validation behavior.',
          proposedContent: 'export class LoginService {}\n',
        },
      ],
    });

    expect(proposal.status).toBe('ready_for_review');
    expect(proposal.rollbackPlan.steps[0]?.description).toContain('Restore previous contents');
    expect(service.summarizeProposal({ proposalId: proposal.id }).id).toBe(proposal.id);
    expect(service.rollbackPlan({ proposalId: proposal.id }).proposalId).toBe(proposal.id);
  });

  it('rejects proposals for unapproved plans', async () => {
    const fixture = await createPlanningFixture();
    const planning = new PlanningService(
      fixture.store,
      fixture.investigation,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );
    const plan = await planning.createPlan({ objective: 'Fix login validation bug' });
    const service = new PatchProposalService(
      new PatchProposalStoreService(),
      planning,
      new RepositorySafetyService(new PathPolicyService()),
    );

    expect(() =>
      service.createProposal({
        planId: plan.id,
        rootPath: fixture.rootPath,
        changes: [{ operation: 'update', filePath: 'README.md', summary: 'Update readme.' }],
      }),
    ).toThrow('is not approved');
  });
});

describe('PatchApplyService', () => {
  it('applies update changes and rolls them back from snapshots', async () => {
    const fixture = await createApprovedPlan();
    const targetPath = path.join(fixture.rootPath, 'README.md');
    await fs.writeFile(targetPath, '# Original\n');
    const proposalService = new PatchProposalService(fixture.store, fixture.planning, fixture.safety);
    const verification = new VerificationRunnerService(
      fixture.store,
      new CommandPolicyService(),
      fixture.safety,
    );
    const apply = new PatchApplyService(fixture.store, fixture.safety, verification);
    const proposal = proposalService.createProposal({
      planId: fixture.planId,
      rootPath: fixture.rootPath,
      changes: [
        {
          operation: 'update',
          filePath: 'README.md',
          summary: 'Update documentation.',
          proposedContent: '# Updated\n',
        },
      ],
    });

    const applied = await apply.applyProposal({ proposalId: proposal.id });
    expect(applied.status).toBe('applied');
    await expect(fs.readFile(targetPath, 'utf8')).resolves.toBe('# Updated\n');

    const rolledBack = await apply.rollbackApply({ applyRunId: applied.id });
    expect(rolledBack.status).toBe('rolled_back');
    await expect(fs.readFile(targetPath, 'utf8')).resolves.toBe('# Original\n');
  });

  it('applies create and delete changes with rollback support', async () => {
    const fixture = await createApprovedPlan();
    await fs.writeFile(path.join(fixture.rootPath, 'obsolete.txt'), 'remove me\n');
    const proposalService = new PatchProposalService(fixture.store, fixture.planning, fixture.safety);
    const verification = new VerificationRunnerService(
      fixture.store,
      new CommandPolicyService(),
      fixture.safety,
    );
    const apply = new PatchApplyService(fixture.store, fixture.safety, verification);
    const proposal = proposalService.createProposal({
      planId: fixture.planId,
      rootPath: fixture.rootPath,
      changes: [
        {
          operation: 'create',
          filePath: 'created.txt',
          summary: 'Create new file.',
          proposedContent: 'created\n',
        },
        {
          operation: 'delete',
          filePath: 'obsolete.txt',
          summary: 'Remove obsolete file.',
        },
      ],
    });

    const applied = await apply.applyProposal({ proposalId: proposal.id });
    expect(applied.status).toBe('applied');
    await expect(fs.readFile(path.join(fixture.rootPath, 'created.txt'), 'utf8')).resolves.toBe('created\n');
    await expect(fs.access(path.join(fixture.rootPath, 'obsolete.txt'))).rejects.toThrow();

    await apply.rollbackApply({ applyRunId: applied.id });
    await expect(fs.access(path.join(fixture.rootPath, 'created.txt'))).rejects.toThrow();
    await expect(fs.readFile(path.join(fixture.rootPath, 'obsolete.txt'), 'utf8')).resolves.toBe('remove me\n');
  });

  it('rejects unsafe or incomplete apply changes before writing files', async () => {
    const fixture = await createApprovedPlan();
    await fs.writeFile(path.join(fixture.rootPath, 'README.md'), '# Safe\n');
    const proposalService = new PatchProposalService(fixture.store, fixture.planning, fixture.safety);
    const verification = new VerificationRunnerService(
      fixture.store,
      new CommandPolicyService(),
      fixture.safety,
    );
    const apply = new PatchApplyService(fixture.store, fixture.safety, verification);
    const proposal = proposalService.createProposal({
      planId: fixture.planId,
      rootPath: fixture.rootPath,
      changes: [
        {
          operation: 'update',
          filePath: 'README.md',
          summary: 'Missing content.',
        },
      ],
    });

    await expect(apply.applyProposal({ proposalId: proposal.id })).rejects.toThrow('requires proposedContent');
    await expect(fs.readFile(path.join(fixture.rootPath, 'README.md'), 'utf8')).resolves.toBe('# Safe\n');
  });
});

describe('VerificationRunnerService', () => {
  it('runs allow-listed verification commands and stores results', async () => {
    const rootPath = await createPackageFixture();
    const store = new PatchProposalStoreService();
    const service = new VerificationRunnerService(
      store,
      new CommandPolicyService(),
      new RepositorySafetyService(new PathPolicyService()),
    );

    const result = await service.runCheck({ rootPath, command: 'pnpm.cmd build', timeoutMs: 30000 });

    expect(result.status).toBe('passed');
    expect(service.summarizeResult({ resultId: result.id }).id).toBe(result.id);
  });

  it('rejects commands outside the verification allow-list', async () => {
    const rootPath = await createPackageFixture();
    const service = new VerificationRunnerService(
      new PatchProposalStoreService(),
      new CommandPolicyService(),
      new RepositorySafetyService(new PathPolicyService()),
    );

    await expect(
      service.runCheck({ rootPath, command: 'npm install' as never }),
    ).rejects.toThrow('is not allowed');
  });
});
