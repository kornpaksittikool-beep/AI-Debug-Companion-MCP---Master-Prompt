import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { CommandPolicyService } from '../../src/core/security/command-policy.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
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
