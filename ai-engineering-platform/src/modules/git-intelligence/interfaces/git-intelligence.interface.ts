export interface GitRepositoryConfig {
  readonly rootPath: string;
}

export interface GitRecentChangesOptions extends GitRepositoryConfig {
  readonly maxCommits?: number;
}

export interface GitCommitSummary {
  readonly hash: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authoredAt: string;
  readonly subject: string;
}

export interface GitRecentChangesResult {
  readonly rootPath: string;
  readonly commits: readonly GitCommitSummary[];
}

export interface GitBlameOptions extends GitRepositoryConfig {
  readonly filePath: string;
}

export interface GitBlameLine {
  readonly lineNumber: number;
  readonly commitHash: string;
  readonly author: string;
  readonly authoredAt: string;
  readonly content: string;
}

export interface GitBlameResult {
  readonly rootPath: string;
  readonly filePath: string;
  readonly lines: readonly GitBlameLine[];
}

export interface GitFileHistoryOptions extends GitRepositoryConfig {
  readonly filePath: string;
  readonly maxCommits?: number;
}

export interface GitFileHistoryResult {
  readonly rootPath: string;
  readonly filePath: string;
  readonly commits: readonly GitCommitSummary[];
}

export interface GitImpactHintsOptions extends GitRepositoryConfig {
  readonly maxCommits?: number;
}

export type GitImpactRiskLevel = 'low' | 'medium' | 'high';

export interface GitFileImpactHint {
  readonly filePath: string;
  readonly changeCount: number;
  readonly lastCommitHash: string;
  readonly lastSubject: string;
  readonly recentSubjects: readonly string[];
  readonly riskLevel: GitImpactRiskLevel;
  readonly reason: string;
}

export interface GitImpactHintsResult {
  readonly rootPath: string;
  readonly analyzedCommits: number;
  readonly hints: readonly GitFileImpactHint[];
}
