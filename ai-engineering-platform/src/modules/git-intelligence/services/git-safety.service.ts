import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';

@Injectable()
export class GitSafetyService {
  constructor(private readonly repositorySafety: RepositorySafetyService) {}

  resolveGitRoot(rootPath: string): string {
    const resolvedRoot = this.repositorySafety.resolveRoot(rootPath);
    if (!fs.existsSync(path.join(resolvedRoot, '.git'))) {
      throw new PlatformError({
        code: 'GIT_REPOSITORY_NOT_FOUND',
        message: `Path "${rootPath}" is not a git repository.`,
        reason: 'Git intelligence requires a repository root containing a .git directory.',
        suggestion: 'Run git init or provide an existing git repository root.',
      });
    }

    return resolvedRoot;
  }

  resolveFileInsideRepo(rootPath: string, filePath: string): string {
    return this.repositorySafety.resolveInsideRoot(this.resolveGitRoot(rootPath), filePath);
  }

  toRepoRelative(rootPath: string, filePath: string): string {
    return this.repositorySafety.toRelative(this.resolveGitRoot(rootPath), filePath);
  }
}
