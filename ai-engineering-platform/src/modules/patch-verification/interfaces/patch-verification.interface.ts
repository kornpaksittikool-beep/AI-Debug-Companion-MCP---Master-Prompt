export type PatchOperation = 'create' | 'update' | 'delete';

export type PatchProposalStatus = 'draft' | 'ready_for_review' | 'blocked';

export interface PatchFileChange {
  readonly operation: PatchOperation;
  readonly filePath: string;
  readonly summary: string;
  readonly proposedContent?: string;
}

export interface PatchRollbackStep {
  readonly order: number;
  readonly description: string;
}

export interface PatchRollbackPlan {
  readonly proposalId: string;
  readonly strategy: string;
  readonly steps: readonly PatchRollbackStep[];
  readonly requiredArtifacts: readonly string[];
}

export interface PatchProposal {
  readonly id: string;
  readonly planId: string;
  readonly rootPath: string;
  readonly status: PatchProposalStatus;
  readonly objective: string;
  readonly changes: readonly PatchFileChange[];
  readonly rollbackPlan: PatchRollbackPlan;
  readonly verificationCommands: readonly string[];
  readonly createdAt: string;
}

export interface CreatePatchProposalInput {
  readonly planId: string;
  readonly rootPath: string;
  readonly changes: readonly PatchFileChange[];
  readonly verificationCommands?: readonly string[];
}

export interface SummarizePatchProposalInput {
  readonly proposalId: string;
}

export interface RollbackPlanInput {
  readonly proposalId: string;
}

export type VerificationCommand =
  | 'pnpm.cmd build'
  | 'pnpm.cmd lint'
  | 'pnpm.cmd test'
  | 'pnpm.cmd test:integration'
  | 'pnpm.cmd test:cov';

export interface VerificationRunInput {
  readonly rootPath: string;
  readonly command: VerificationCommand;
  readonly timeoutMs?: number;
}

export interface VerificationResult {
  readonly id: string;
  readonly rootPath: string;
  readonly command: VerificationCommand;
  readonly exitCode: number;
  readonly status: 'passed' | 'failed';
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly createdAt: string;
}

export interface SummarizeVerificationResultInput {
  readonly resultId: string;
}

export type PatchApplyStatus = 'applied' | 'failed' | 'verification_failed' | 'rolled_back';

export interface PatchApplyArtifact {
  readonly filePath: string;
  readonly operation: PatchOperation;
  readonly originalExisted: boolean;
  readonly contentCaptured: boolean;
}

export interface PatchApplySnapshot {
  readonly applyRunId: string;
  readonly filePath: string;
  readonly operation: PatchOperation;
  readonly absolutePath: string;
  readonly originalExisted: boolean;
  readonly originalContent?: string;
}

export interface PatchApplyRun {
  readonly id: string;
  readonly proposalId: string;
  readonly rootPath: string;
  readonly status: PatchApplyStatus;
  readonly artifacts: readonly PatchApplyArtifact[];
  readonly verificationResults: readonly VerificationResult[];
  readonly errorMessage?: string;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface ApplyPatchProposalInput {
  readonly proposalId: string;
  readonly runVerification?: boolean;
  readonly rollbackOnFailure?: boolean;
  readonly verificationTimeoutMs?: number;
}

export interface RollbackPatchApplyInput {
  readonly applyRunId: string;
}
