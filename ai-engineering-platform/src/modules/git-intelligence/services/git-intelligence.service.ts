import { Injectable } from '@nestjs/common';
import type {
  GitBlameOptions,
  GitBlameLine,
  GitBlameResult,
  GitCommitSummary,
  GitFileHistoryOptions,
  GitFileHistoryResult,
  GitFileImpactHint,
  GitImpactHintsOptions,
  GitImpactHintsResult,
  GitRecentChangesOptions,
  GitRecentChangesResult,
} from '../interfaces/git-intelligence.interface.js';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { GitCommandRunnerService } from './git-command-runner.service.js';
import { GitSafetyService } from './git-safety.service.js';

const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';
const DEFAULT_MAX_COMMITS = 20;
const MAX_COMMITS_LIMIT = 100;

@Injectable()
export class GitIntelligenceService {
  constructor(
    private readonly safety: GitSafetyService,
    private readonly runner: GitCommandRunnerService,
  ) {}

  async recentChanges(options: GitRecentChangesOptions): Promise<GitRecentChangesResult> {
    const rootPath = this.safety.resolveGitRoot(options.rootPath);
    const maxCommits = this.normalizeMaxCommits(options.maxCommits);
    const result = await this.runner.run(rootPath, [
      'log',
      `-${maxCommits}`,
      `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s${RECORD_SEPARATOR}`,
    ]);

    return {
      rootPath,
      commits: this.parseCommitSummaries(result.stdout),
    };
  }

  async blame(options: GitBlameOptions): Promise<GitBlameResult> {
    const rootPath = this.safety.resolveGitRoot(options.rootPath);
    const filePath = this.safety.resolveFileInsideRepo(rootPath, options.filePath);
    const relativePath = this.safety.toRepoRelative(rootPath, filePath);
    const result = await this.runner.run(rootPath, [
      'blame',
      '--line-porcelain',
      '--',
      relativePath,
    ]);

    return {
      rootPath,
      filePath: relativePath,
      lines: this.parseBlame(result.stdout),
    };
  }

  async findCommitByFile(options: GitFileHistoryOptions): Promise<GitFileHistoryResult> {
    const rootPath = this.safety.resolveGitRoot(options.rootPath);
    const filePath = this.safety.resolveFileInsideRepo(rootPath, options.filePath);
    const relativePath = this.safety.toRepoRelative(rootPath, filePath);
    const maxCommits = this.normalizeMaxCommits(options.maxCommits);
    const result = await this.runner.run(rootPath, [
      'log',
      `-${maxCommits}`,
      `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s${RECORD_SEPARATOR}`,
      '--',
      relativePath,
    ]);

    return {
      rootPath,
      filePath: relativePath,
      commits: this.parseCommitSummaries(result.stdout),
    };
  }

  async impactHints(options: GitImpactHintsOptions): Promise<GitImpactHintsResult> {
    const rootPath = this.safety.resolveGitRoot(options.rootPath);
    const maxCommits = this.normalizeMaxCommits(options.maxCommits);
    const result = await this.runner.run(rootPath, [
      'log',
      `-${maxCommits}`,
      `--pretty=format:${RECORD_SEPARATOR}%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s`,
      '--name-only',
    ]);
    const records = this.parseCommitFileRecords(result.stdout);
    const byFile = new Map<string, GitFileImpactHint>();

    for (const record of records) {
      for (const filePath of record.filePaths) {
        const existing = byFile.get(filePath);
        const recentSubjects = existing
          ? [...existing.recentSubjects, record.commit.subject].slice(0, 5)
          : [record.commit.subject];
        const changeCount = (existing?.changeCount ?? 0) + 1;
        byFile.set(filePath, {
          filePath,
          changeCount,
          lastCommitHash: existing?.lastCommitHash ?? record.commit.hash,
          lastSubject: existing?.lastSubject ?? record.commit.subject,
          recentSubjects,
          riskLevel: this.toRiskLevel(changeCount),
          reason: this.toImpactReason(changeCount),
        });
      }
    }

    return {
      rootPath,
      analyzedCommits: records.length,
      hints: [...byFile.values()].sort(
        (a, b) => b.changeCount - a.changeCount || a.filePath.localeCompare(b.filePath),
      ),
    };
  }

  private parseCommitSummaries(output: string): readonly GitCommitSummary[] {
    return output
      .split(RECORD_SEPARATOR)
      .map((record) => record.trim())
      .filter(Boolean)
      .map((record) => {
        const [hash = '', authorName = '', authorEmail = '', authoredAt = '', subject = ''] =
          record.split(FIELD_SEPARATOR);
        return {
          hash,
          authorName,
          authorEmail,
          authoredAt,
          subject,
        };
      });
  }

  private parseCommitFileRecords(
    output: string,
  ): readonly { readonly commit: GitCommitSummary; readonly filePaths: readonly string[] }[] {
    return output
      .split(RECORD_SEPARATOR)
      .map((record) => record.trim())
      .filter(Boolean)
      .map((record) => {
        const [header = '', ...fileLines] = record.split(/\r?\n/);
        const [hash = '', authorName = '', authorEmail = '', authoredAt = '', subject = ''] =
          header.split(FIELD_SEPARATOR);
        return {
          commit: { hash, authorName, authorEmail, authoredAt, subject },
          filePaths: fileLines.map((line) => line.trim()).filter(Boolean),
        };
      });
  }

  private toRiskLevel(changeCount: number): GitFileImpactHint['riskLevel'] {
    if (changeCount >= 3) {
      return 'high';
    }
    if (changeCount === 2) {
      return 'medium';
    }
    return 'low';
  }

  private toImpactReason(changeCount: number): string {
    if (changeCount >= 3) {
      return 'File changed repeatedly in the recent git window.';
    }
    if (changeCount === 2) {
      return 'File changed more than once in the recent git window.';
    }
    return 'File changed once in the recent git window.';
  }

  private normalizeMaxCommits(value: number | undefined): number {
    const maxCommits = value ?? DEFAULT_MAX_COMMITS;
    if (!Number.isInteger(maxCommits) || maxCommits < 1 || maxCommits > MAX_COMMITS_LIMIT) {
      throw new PlatformError({
        code: 'GIT_INVALID_LIMIT',
        message: 'Invalid git commit limit.',
        reason: `maxCommits must be an integer between 1 and ${MAX_COMMITS_LIMIT}.`,
        suggestion: 'Provide a bounded maxCommits value such as 10 or omit it for the default.',
      });
    }

    return maxCommits;
  }

  private parseBlame(output: string): GitBlameResult['lines'] {
    const lines = output.split('\n');
    const blameLines: GitBlameLine[] = [];
    let currentHash = '';
    let currentLineNumber = 0;
    let currentAuthor = '';
    let currentAuthoredAt = '';

    for (const line of lines) {
      const header = /^([0-9a-f]{40})\s+\d+\s+(\d+)/.exec(line);
      if (header) {
        currentHash = header[1] ?? '';
        currentLineNumber = Number(header[2] ?? 0);
        continue;
      }

      if (line.startsWith('author ')) {
        currentAuthor = line.slice('author '.length);
        continue;
      }

      if (line.startsWith('author-time ')) {
        currentAuthoredAt = new Date(Number(line.slice('author-time '.length)) * 1000).toISOString();
        continue;
      }

      if (line.startsWith('\t')) {
        blameLines.push({
          lineNumber: currentLineNumber,
          commitHash: currentHash,
          author: currentAuthor,
          authoredAt: currentAuthoredAt,
          content: line.slice(1),
        });
      }
    }

    return blameLines;
  }
}
