import type {
  GitBlameOptions,
  GitFileHistoryOptions,
  GitImpactHintsOptions,
  GitRecentChangesOptions,
} from '../interfaces/git-intelligence.interface.js';

export type GitRecentChangesInputDto = GitRecentChangesOptions;

export type GitBlameInputDto = GitBlameOptions;

export type GitFindCommitByFileInputDto = GitFileHistoryOptions;

export type GitImpactHintsInputDto = GitImpactHintsOptions;
