import { CommandPolicyService } from '../../src/core/security/command-policy.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { PatchApplyService } from '../../src/modules/patch-verification/services/patch-apply.service.js';
import { PatchProposalStoreService } from '../../src/modules/patch-verification/services/patch-proposal-store.service.js';
import { PatchProposalService } from '../../src/modules/patch-verification/services/patch-proposal.service.js';
import { VerificationRunnerService } from '../../src/modules/patch-verification/services/verification-runner.service.js';
import {
  PatchApplyProposalTool,
  PatchCreateProposalTool,
  PatchRollbackApplyTool,
  PatchRollbackPlanTool,
  PatchSummarizeProposalTool,
  VerificationRunCheckTool,
  VerificationSummarizeResultTool,
} from '../../src/modules/patch-verification/tools/patch-verification.tools.js';
import { PlanningService } from '../../src/modules/planning-impact/services/planning.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { createPlanningFixture } from './planning-impact.fixture.js';

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected string value.');
  }
  return value;
}

describe('Patch verification tools', () => {
  it('executes patch proposal and verification handlers', async () => {
    const fixture = await createPlanningFixture();
    await fs.writeFile(
      path.join(fixture.rootPath, 'package.json'),
      JSON.stringify({ scripts: { build: 'node -e "process.exit(0)"' } }),
    );
    const planning = new PlanningService(
      fixture.store,
      fixture.investigation,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );
    const plan = await planning.createPlan({ objective: 'Fix login validation bug', rootPath: fixture.rootPath });
    planning.approvalGate({ planId: plan.id, decision: 'approve' });
    const store = new PatchProposalStoreService();
    const proposalService = new PatchProposalService(
      store,
      planning,
      new RepositorySafetyService(new PathPolicyService()),
    );
    const verification = new VerificationRunnerService(
      store,
      new CommandPolicyService(),
      new RepositorySafetyService(new PathPolicyService()),
    );
    const apply = new PatchApplyService(
      store,
      new RepositorySafetyService(new PathPolicyService()),
      verification,
    );

    const proposal = await new PatchCreateProposalTool(proposalService).execute({
      planId: plan.id,
      rootPath: fixture.rootPath,
      changes: [
        {
          operation: 'update',
          filePath: 'README.md',
          summary: 'Update readme.',
          proposedContent: '# Updated by tool\n',
        },
      ],
    });
    const proposalId = requireString(proposal.id);

    await expect(new PatchSummarizeProposalTool(proposalService).execute({ proposalId })).resolves.toMatchObject({
      id: proposalId,
    });
    await expect(new PatchRollbackPlanTool(proposalService).execute({ proposalId })).resolves.toMatchObject({
      proposalId,
    });
    const applyResult = await new PatchApplyProposalTool(apply).execute({ proposalId });
    const applyRunId = requireString(applyResult.id);
    expect(applyResult.status).toBe('applied');
    await expect(new PatchRollbackApplyTool(apply).execute({ applyRunId })).resolves.toMatchObject({
      status: 'rolled_back',
    });

    const verificationResult = await new VerificationRunCheckTool(verification).execute({
      rootPath: fixture.rootPath,
      command: 'pnpm.cmd build',
      timeoutMs: 30000,
    });
    const resultId = requireString(verificationResult.id);
    await expect(new VerificationSummarizeResultTool(verification).execute({ resultId })).resolves.toMatchObject({
      id: resultId,
    });
  });
});
