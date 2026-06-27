import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type { PatchProposal, VerificationResult } from '../interfaces/patch-verification.interface.js';

@Injectable()
export class PatchProposalStoreService {
  private readonly proposals = new Map<string, PatchProposal>();
  private readonly verificationResults = new Map<string, VerificationResult>();

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
}
