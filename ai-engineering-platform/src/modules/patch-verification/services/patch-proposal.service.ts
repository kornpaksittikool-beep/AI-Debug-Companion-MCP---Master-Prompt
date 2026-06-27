import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { PlanningService } from '../../planning-impact/services/planning.service.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';
import type {
  CreatePatchProposalInput,
  PatchProposal,
  PatchRollbackPlan,
  RollbackPlanInput,
  SummarizePatchProposalInput,
} from '../interfaces/patch-verification.interface.js';
import { PatchProposalStoreService } from './patch-proposal-store.service.js';

const DEFAULT_VERIFICATION_COMMANDS = ['pnpm.cmd build', 'pnpm.cmd lint', 'pnpm.cmd test'] as const;

@Injectable()
export class PatchProposalService {
  constructor(
    private readonly store: PatchProposalStoreService,
    private readonly planning: PlanningService,
    private readonly safety: RepositorySafetyService,
  ) {}

  createProposal(input: CreatePatchProposalInput): PatchProposal {
    const plan = this.planning.summarizePlan({ planId: input.planId });
    if (plan.status !== 'approved') {
      throw new PlatformError({
        code: 'PATCH_PLAN_NOT_APPROVED',
        message: `Plan "${input.planId}" is not approved.`,
        reason: 'Patch proposals require an approved Phase 6 plan before Phase 7 work can proceed.',
        suggestion: 'Use planning.approval_gate with decision "approve" before creating a patch proposal.',
      });
    }
    if (input.changes.length === 0) {
      throw new PlatformError({
        code: 'PATCH_PROPOSAL_EMPTY',
        message: 'Patch proposal must include at least one file change.',
        reason: 'A proposal without file changes cannot be reviewed or verified.',
        suggestion: 'Provide one or more create, update, or delete file changes.',
      });
    }

    const rootPath = this.safety.resolveRoot(input.rootPath);
    for (const change of input.changes) {
      this.safety.resolveInsideRoot(rootPath, change.filePath);
      if (!change.summary.trim()) {
        throw new PlatformError({
          code: 'PATCH_CHANGE_INVALID',
          message: `Patch change for "${change.filePath}" is missing a summary.`,
          reason: 'Every proposed file change needs a reviewable summary.',
          suggestion: 'Add a concise reason for the proposed file change.',
        });
      }
    }

    const proposalId = this.createId('patch');
    const rollbackPlan = this.createRollbackPlan(proposalId, input);
    const proposal: PatchProposal = {
      id: proposalId,
      planId: input.planId,
      rootPath,
      status: 'ready_for_review',
      objective: plan.objective,
      changes: input.changes,
      rollbackPlan,
      verificationCommands: input.verificationCommands ?? DEFAULT_VERIFICATION_COMMANDS,
      createdAt: new Date().toISOString(),
    };

    return this.store.saveProposal(proposal);
  }

  summarizeProposal(input: SummarizePatchProposalInput): PatchProposal {
    return this.store.getProposal(input.proposalId);
  }

  rollbackPlan(input: RollbackPlanInput): PatchRollbackPlan {
    return this.store.getProposal(input.proposalId).rollbackPlan;
  }

  private createRollbackPlan(proposalId: string, input: CreatePatchProposalInput): PatchRollbackPlan {
    return {
      proposalId,
      strategy: 'Review-only rollback plan. If a future apply step fails, restore original file contents from captured pre-apply artifacts or git diff.',
      requiredArtifacts: ['Pre-apply git diff', 'Original file content snapshot', 'Verification result log'],
      steps: input.changes.map((change, index) => ({
        order: index + 1,
        description: this.rollbackDescription(change.operation, change.filePath),
      })),
    };
  }

  private rollbackDescription(operation: string, filePath: string): string {
    if (operation === 'create') {
      return `Remove created file "${filePath}".`;
    }
    if (operation === 'delete') {
      return `Restore deleted file "${filePath}" from the pre-apply snapshot.`;
    }
    return `Restore previous contents for "${filePath}" from the pre-apply snapshot.`;
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
