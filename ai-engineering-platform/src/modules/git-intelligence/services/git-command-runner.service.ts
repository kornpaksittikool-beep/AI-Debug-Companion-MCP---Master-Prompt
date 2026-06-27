import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PlatformError } from '../../../core/errors/platform-error.js';

const execFileAsync = promisify(execFile);
const READ_ONLY_SUBCOMMANDS = ['log', 'blame', 'rev-parse', 'status', 'show'] as const;

export interface GitCommandResult {
  readonly stdout: string;
  readonly stderr: string;
}

@Injectable()
export class GitCommandRunnerService {
  async run(rootPath: string, args: readonly string[], timeoutMs = 5000): Promise<GitCommandResult> {
    this.assertReadOnly(args);

    try {
      const result = await execFileAsync('git', [...args], {
        cwd: rootPath,
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      throw new PlatformError({
        code: 'GIT_COMMAND_FAILED',
        message: 'Git command failed.',
        reason: error instanceof Error ? error.message : 'Unknown git execution error.',
        suggestion: 'Verify the repository path, file path, and git history.',
      });
    }
  }

  private assertReadOnly(args: readonly string[]): void {
    const subcommand = args[0];
    if (!subcommand || !READ_ONLY_SUBCOMMANDS.includes(subcommand as never)) {
      throw new PlatformError({
        code: 'GIT_COMMAND_NOT_ALLOWED',
        message: 'Git command is not allowed.',
        reason: 'Git Intelligence only permits read-only git subcommands.',
        suggestion: 'Use git history, blame, or recent changes tools.',
      });
    }

    if (args.some((arg) => arg === '--output' || arg.startsWith('--output='))) {
      throw new PlatformError({
        code: 'GIT_COMMAND_NOT_ALLOWED',
        message: 'Git command output redirection is not allowed.',
        reason: 'Git Intelligence must not write files through git command options.',
        suggestion: 'Use read-only git options only.',
      });
    }
  }
}
