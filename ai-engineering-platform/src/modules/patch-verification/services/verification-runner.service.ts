import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { CommandPolicyService } from '../../../core/security/command-policy.service.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';
import type {
  SummarizeVerificationResultInput,
  VerificationCommand,
  VerificationResult,
  VerificationRunInput,
} from '../interfaces/patch-verification.interface.js';
import { PatchProposalStoreService } from './patch-proposal-store.service.js';

const execFileAsync = promisify(execFile);

const ALLOWED_COMMANDS: readonly VerificationCommand[] = [
  'pnpm.cmd build',
  'pnpm.cmd lint',
  'pnpm.cmd test',
  'pnpm.cmd test:integration',
  'pnpm.cmd test:cov',
];

@Injectable()
export class VerificationRunnerService {
  constructor(
    private readonly store: PatchProposalStoreService,
    private readonly commandPolicy: CommandPolicyService,
    private readonly safety: RepositorySafetyService,
  ) {}

  async runCheck(input: VerificationRunInput): Promise<VerificationResult> {
    if (!this.commandPolicy.isAllowed(input.command, ALLOWED_COMMANDS)) {
      throw new PlatformError({
        code: 'VERIFICATION_COMMAND_NOT_ALLOWED',
        message: `Verification command "${input.command}" is not allowed.`,
        reason: 'Phase 7 verification only permits explicit project verification commands.',
        suggestion: `Use one of: ${ALLOWED_COMMANDS.join(', ')}.`,
      });
    }

    const rootPath = this.safety.resolveRoot(input.rootPath);
    const [command = '', ...args] = input.command.split(' ');
    const started = Date.now();
    try {
      const executable = process.platform === 'win32' && command.endsWith('.cmd') ? 'cmd.exe' : command;
      const executableArgs =
        process.platform === 'win32' && command.endsWith('.cmd')
          ? ['/d', '/s', '/c', command, ...args]
          : args;
      const result = await execFileAsync(executable, executableArgs, {
        cwd: rootPath,
        timeout: input.timeoutMs ?? 120000,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 10,
      });

      return this.store.saveVerificationResult({
        id: this.createId('verify'),
        rootPath,
        command: input.command,
        exitCode: 0,
        status: 'passed',
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      const executionError = error as { stdout?: string; stderr?: string; code?: number; message?: string };
      return this.store.saveVerificationResult({
        id: this.createId('verify'),
        rootPath,
        command: input.command,
        exitCode: typeof executionError.code === 'number' ? executionError.code : 1,
        status: 'failed',
        stdout: executionError.stdout ?? '',
        stderr: executionError.stderr ?? executionError.message ?? 'Unknown verification failure.',
        durationMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      });
    }
  }

  summarizeResult(input: SummarizeVerificationResultInput): VerificationResult {
    return this.store.getVerificationResult(input.resultId);
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
