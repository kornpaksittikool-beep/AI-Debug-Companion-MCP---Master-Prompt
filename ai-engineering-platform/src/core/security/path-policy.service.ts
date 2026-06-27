import { Injectable } from '@nestjs/common';
import * as path from 'node:path';

@Injectable()
export class PathPolicyService {
  isPathInsideRoot(candidatePath: string, rootPath: string): boolean {
    const resolvedCandidate = path.resolve(candidatePath);
    const resolvedRoot = path.resolve(rootPath);
    const relativePath = path.relative(resolvedRoot, resolvedCandidate);

    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  }
}
