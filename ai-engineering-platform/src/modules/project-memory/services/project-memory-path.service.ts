import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';

export interface ProjectMemoryPaths {
  readonly rootPath: string;
  readonly memoryDir: string;
  readonly recordsPath: string;
  readonly snapshotPath: string;
}

@Injectable()
export class ProjectMemoryPathService {
  constructor(private readonly safety: RepositorySafetyService) {}

  resolve(rootPath: string): ProjectMemoryPaths {
    const resolvedRoot = this.safety.resolveRoot(rootPath);
    const memoryDir = this.safety.resolveInsideRoot(
      resolvedRoot,
      path.join('.ai-engineering-platform', 'memory'),
    );
    return {
      rootPath: resolvedRoot,
      memoryDir,
      recordsPath: this.safety.resolveInsideRoot(memoryDir, 'records.jsonl'),
      snapshotPath: this.safety.resolveInsideRoot(memoryDir, 'snapshot.json'),
    };
  }
}
