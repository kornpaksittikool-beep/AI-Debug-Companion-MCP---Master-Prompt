import { Injectable } from '@nestjs/common';
import type {
  CrossRepositorySearchMatch,
  CrossRepositorySearchOptions,
  CrossRepositorySearchResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryIntelligenceService } from './repository-intelligence.service.js';

const DEFAULT_MAX_MATCHES_PER_REPOSITORY = 25;

@Injectable()
export class RepositoryMultiRootService {
  constructor(private readonly repository: RepositoryIntelligenceService) {}

  async crossRepositorySearch(options: CrossRepositorySearchOptions): Promise<CrossRepositorySearchResult> {
    const matches: CrossRepositorySearchMatch[] = [];
    let truncated = false;

    for (const repositoryOptions of options.repositories) {
      const result = await this.repository.searchFiles({
        ...repositoryOptions,
        query: options.query,
        ...(options.extension ? { extension: options.extension } : {}),
        includeTextPreview: repositoryOptions.includeTextPreview ?? true,
      });
      const maxMatches = options.maxMatchesPerRepository ?? DEFAULT_MAX_MATCHES_PER_REPOSITORY;
      matches.push(
        ...result.matches.slice(0, maxMatches).map((match) => ({
          rootPath: result.rootPath,
          relativePath: match.relativePath,
          extension: match.extension,
          sizeBytes: match.sizeBytes,
          modifiedAt: match.modifiedAt,
          ...(match.textPreview ? { textPreview: match.textPreview } : {}),
        })),
      );
      truncated = truncated || result.truncated || result.matches.length > maxMatches;
    }

    return {
      repositories: options.repositories.length,
      matches,
      truncated,
    };
  }
}
