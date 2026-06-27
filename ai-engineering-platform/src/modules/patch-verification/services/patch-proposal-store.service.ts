import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type {
  PatchApplyRun,
  PatchApplySnapshot,
  PatchProposal,
  VerificationResult,
} from '../interfaces/patch-verification.interface.js';

@Injectable()
export class PatchProposalStoreService {
  private readonly proposals = new Map<string, PatchProposal>();
  private readonly verificationResults = new Map<string, VerificationResult>();
  private readonly applyRuns = new Map<string, PatchApplyRun>();
  private readonly snapshots = new Map<string, readonly PatchApplySnapshot[]>();

  saveProposal(proposal: PatchProposal): PatchProposal {
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  getProposal(proposalId: string): PatchProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new PlatformError({
        code: 'PATCH_PROPOSAL_NOT_FOUND',
        message: `Patch proposal "${proposalId}" was not found.`,
        reason: 'The patch proposal store does not contain the requested ID.',
        suggestion: 'Create a patch proposal first or provide a valid proposal ID.',
      });
    }

    return proposal;
  }

  saveVerificationResult(result: VerificationResult): VerificationResult {
    this.verificationResults.set(result.id, result);
    return result;
  }

  getVerificationResult(resultId: string): VerificationResult {
    const result = this.verificationResults.get(resultId);
    if (!result) {
      throw new PlatformError({
        code: 'VERIFICATION_RESULT_NOT_FOUND',
        message: `Verification result "${resultId}" was not found.`,
        reason: 'The verification store does not contain the requested ID.',
        suggestion: 'Run a verification check first or provide a valid result ID.',
      });
    }

    return result;
  }

  saveApplyRun(run: PatchApplyRun): PatchApplyRun {
    this.applyRuns.set(run.id, run);
    return run;
  }

  getApplyRun(applyRunId: string): PatchApplyRun {
    const run = this.applyRuns.get(applyRunId);
    if (!run) {
      throw new PlatformError({
        code: 'PATCH_APPLY_RUN_NOT_FOUND',
        message: `Patch apply run "${applyRunId}" was not found.`,
        reason: 'The patch apply store does not contain the requested ID.',
        suggestion: 'Apply a patch proposal first or provide a valid apply run ID.',
      });
    }

    return run;
  }

  saveSnapshots(applyRunId: string, snapshots: readonly PatchApplySnapshot[]): void {
    this.snapshots.set(applyRunId, snapshots);
  }

  getSnapshots(applyRunId: string): readonly PatchApplySnapshot[] {
    return this.snapshots.get(applyRunId) ?? [];
  }
}
