import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { PathPolicyService } from '../../../core/security/path-policy.service.js';

@Injectable()
export class RepositorySafetyService {
  constructor(private readonly pathPolicy: PathPolicyService) {}

  resolveRoot(rootPath: string): string {
    if (!rootPath.trim()) {
      throw new PlatformError({
        code: 'INVALID_REPOSITORY_ROOT',
        message: 'Repository root path is required.',
        reason: 'Repository tools require an explicit root path.',
        suggestion: 'Provide an absolute repository root path.',
      });
    }

    return path.resolve(rootPath);
  }

  resolveInsideRoot(rootPath: string, candidatePath: string): string {
    const resolvedRoot = this.resolveRoot(rootPath);
    const resolvedCandidate = path.isAbsolute(candidatePath)
      ? path.resolve(candidatePath)
      : path.resolve(resolvedRoot, candidatePath);

    if (!this.pathPolicy.isPathInsideRoot(resolvedCandidate, resolvedRoot)) {
      throw new PlatformError({
        code: 'PATH_OUTSIDE_REPOSITORY_ROOT',
        message: `Path "${candidatePath}" is outside the repository root.`,
        reason: 'Repository tools reject path traversal and out-of-root access.',
        suggestion: 'Use a path inside the configured repository root.',
      });
    }

    return resolvedCandidate;
  }

  toRelative(rootPath: string, candidatePath: string): string {
    return path.relative(this.resolveRoot(rootPath), path.resolve(candidatePath)).replaceAll('\\', '/');
  }
}
