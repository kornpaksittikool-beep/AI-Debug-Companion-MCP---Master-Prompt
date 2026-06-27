import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';
import type {
  ApplyPatchProposalInput,
  PatchApplyArtifact,
  PatchApplyRun,
  PatchApplySnapshot,
  PatchFileChange,
  RollbackPatchApplyInput,
  VerificationCommand,
  VerificationResult,
} from '../interfaces/patch-verification.interface.js';
import { PatchProposalStoreService } from './patch-proposal-store.service.js';
import { VerificationRunnerService } from './verification-runner.service.js';

const MAX_PATCH_FILE_BYTES = 512 * 1024;

@Injectable()
export class PatchApplyService {
  constructor(
    private readonly store: PatchProposalStoreService,
    private readonly safety: RepositorySafetyService,
    private readonly verification: VerificationRunnerService,
  ) {}

  async applyProposal(input: ApplyPatchProposalInput): Promise<PatchApplyRun> {
    const proposal = this.store.getProposal(input.proposalId);
    if (proposal.status !== 'ready_for_review') {
      throw new PlatformError({
        code: 'PATCH_PROPOSAL_NOT_READY',
        message: `Patch proposal "${proposal.id}" is not ready for application.`,
        reason: 'Only ready_for_review proposals can be applied in Phase 16.',
        suggestion: 'Create and review an approved patch proposal before applying it.',
      });
    }

    const applyRunId = this.createId('apply');
    const createdAt = new Date().toISOString();
    const snapshots = await this.captureSnapshots(applyRunId, proposal.rootPath, proposal.changes);
    this.store.saveSnapshots(applyRunId, snapshots);

    try {
      await this.applyChanges(proposal.rootPath, proposal.changes);
      const verificationResults = input.runVerification
        ? await this.runVerification(proposal.rootPath, proposal.verificationCommands, input.verificationTimeoutMs)
        : [];
      const verificationFailed = verificationResults.some((result) => result.status === 'failed');
      const status = verificationFailed ? 'verification_failed' : 'applied';
      let run = this.saveRun({
        id: applyRunId,
        proposalId: proposal.id,
        rootPath: proposal.rootPath,
        status,
        artifacts: this.toArtifacts(snapshots),
        verificationResults,
        createdAt,
        completedAt: new Date().toISOString(),
      });

      if (verificationFailed && input.rollbackOnFailure) {
        run = await this.rollbackApply({ applyRunId });
      }
      return run;
    } catch (error) {
      return this.saveRun({
        id: applyRunId,
        proposalId: proposal.id,
        rootPath: proposal.rootPath,
        status: 'failed',
        artifacts: this.toArtifacts(snapshots),
        verificationResults: [],
        errorMessage: error instanceof Error ? error.message : 'Unknown patch apply failure.',
        createdAt,
        completedAt: new Date().toISOString(),
      });
    }
  }

  async rollbackApply(input: RollbackPatchApplyInput): Promise<PatchApplyRun> {
    const run = this.store.getApplyRun(input.applyRunId);
    const snapshots = this.store.getSnapshots(run.id);
    if (snapshots.length === 0) {
      throw new PlatformError({
        code: 'PATCH_ROLLBACK_SNAPSHOT_MISSING',
        message: `Patch apply run "${run.id}" has no rollback snapshots.`,
        reason: 'Rollback requires pre-apply snapshots captured during patch application.',
        suggestion: 'Only rollback apply runs created by patch.apply_proposal.',
      });
    }

    for (const snapshot of [...snapshots].reverse()) {
      if (snapshot.originalExisted) {
        await fs.writeFile(snapshot.absolutePath, snapshot.originalContent ?? '', 'utf8');
      } else {
        await fs.rm(snapshot.absolutePath, { force: true });
      }
    }

    return this.saveRun({
      ...run,
      status: 'rolled_back',
      completedAt: new Date().toISOString(),
    });
  }

  private async captureSnapshots(
    applyRunId: string,
    rootPath: string,
    changes: readonly PatchFileChange[],
  ): Promise<readonly PatchApplySnapshot[]> {
    const resolvedRoot = this.safety.resolveRoot(rootPath);
    const snapshots: PatchApplySnapshot[] = [];
    for (const change of changes) {
      const absolutePath = this.safety.resolveInsideRoot(resolvedRoot, change.filePath);
      const exists = await this.exists(absolutePath);
      await this.validateChange(change, absolutePath, exists);
      snapshots.push({
        applyRunId,
        filePath: change.filePath,
        operation: change.operation,
        absolutePath,
        originalExisted: exists,
        ...(exists ? { originalContent: await fs.readFile(absolutePath, 'utf8') } : {}),
      });
    }
    return snapshots;
  }

  private async validateChange(change: PatchFileChange, absolutePath: string, exists: boolean): Promise<void> {
    if (change.operation === 'create' && exists) {
      throw new PlatformError({
        code: 'PATCH_CREATE_TARGET_EXISTS',
        message: `Cannot create "${change.filePath}" because it already exists.`,
        reason: 'Phase 16 create operations refuse to overwrite existing files.',
        suggestion: 'Use an update operation when changing an existing file.',
      });
    }
    if ((change.operation === 'update' || change.operation === 'delete') && !exists) {
      throw new PlatformError({
        code: 'PATCH_TARGET_MISSING',
        message: `Cannot ${change.operation} "${change.filePath}" because it does not exist.`,
        reason: 'Update and delete operations require an existing target file.',
        suggestion: 'Use a create operation for new files or correct the target path.',
      });
    }
    if (change.operation !== 'delete' && change.proposedContent === undefined) {
      throw new PlatformError({
        code: 'PATCH_CONTENT_REQUIRED',
        message: `Patch change for "${change.filePath}" requires proposedContent.`,
        reason: 'Phase 16 deterministic create and update operations use whole-file replacement.',
        suggestion: 'Provide proposedContent or use delete for removals.',
      });
    }
    if (exists) {
      const stat = await fs.stat(absolutePath);
      if (stat.size > MAX_PATCH_FILE_BYTES) {
        throw new PlatformError({
          code: 'PATCH_FILE_TOO_LARGE',
          message: `Patch target "${change.filePath}" exceeds the Phase 16 size limit.`,
          reason: 'Large or binary-like files are blocked from whole-file patch application.',
          suggestion: `Use files at or below ${MAX_PATCH_FILE_BYTES} bytes in Phase 16.`,
        });
      }
    }
  }

  private async applyChanges(rootPath: string, changes: readonly PatchFileChange[]): Promise<void> {
    const resolvedRoot = this.safety.resolveRoot(rootPath);
    for (const change of changes) {
      const absolutePath = this.safety.resolveInsideRoot(resolvedRoot, change.filePath);
      if (change.operation === 'delete') {
        await fs.rm(absolutePath);
        continue;
      }
      await fs.mkdir(this.parentDirectory(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, change.proposedContent ?? '', 'utf8');
    }
  }

  private async runVerification(
    rootPath: string,
    commands: readonly string[],
    timeoutMs: number | undefined,
  ): Promise<readonly VerificationResult[]> {
    const results: VerificationResult[] = [];
    for (const command of commands) {
      results.push(
        await this.verification.runCheck({
          rootPath,
          command: command as VerificationCommand,
          ...(timeoutMs ? { timeoutMs } : {}),
        }),
      );
    }
    return results;
  }

  private toArtifacts(snapshots: readonly PatchApplySnapshot[]): readonly PatchApplyArtifact[] {
    return snapshots.map((snapshot) => ({
      filePath: snapshot.filePath,
      operation: snapshot.operation,
      originalExisted: snapshot.originalExisted,
      contentCaptured: snapshot.originalExisted,
    }));
  }

  private saveRun(run: PatchApplyRun): PatchApplyRun {
    return this.store.saveApplyRun(run);
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private parentDirectory(filePath: string): string {
    return filePath.slice(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
