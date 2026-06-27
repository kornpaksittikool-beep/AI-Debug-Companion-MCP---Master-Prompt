import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  RepositoryFile,
  RepositoryScanOptions,
  RepositoryScanResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryIgnoreService } from './repository-ignore.service.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const DEFAULT_MAX_FILES = 500;
const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_FILE_SIZE_BYTES = 256 * 1024;
const DEFAULT_PREVIEW_MAX_BYTES = 4096;

interface WalkState {
  readonly files: RepositoryFile[];
  readonly ignoredEntries: string[];
  totalFilesVisited: number;
  truncated: boolean;
}

@Injectable()
export class RepositoryScannerService {
  constructor(
    private readonly ignoreService: RepositoryIgnoreService,
    private readonly safetyService: RepositorySafetyService,
  ) {}

  async scan(options: RepositoryScanOptions): Promise<RepositoryScanResult> {
    const rootPath = this.safetyService.resolveRoot(options.rootPath);
    const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
    const state: WalkState = {
      files: [],
      ignoredEntries: [],
      totalFilesVisited: 0,
      truncated: false,
    };

    await this.walk(rootPath, rootPath, 0, options, state, {
      maxFiles,
      maxDepth,
      maxFileSizeBytes,
    });

    return {
      rootPath,
      files: state.files,
      totalFilesVisited: state.totalFilesVisited,
      ignoredEntries: state.ignoredEntries,
      truncated: state.truncated,
      limits: {
        maxFiles,
        maxDepth,
        maxFileSizeBytes,
      },
    };
  }

  private async walk(
    rootPath: string,
    currentPath: string,
    depth: number,
    options: RepositoryScanOptions,
    state: WalkState,
    limits: { readonly maxFiles: number; readonly maxDepth: number; readonly maxFileSizeBytes: number },
  ): Promise<void> {
    if (state.files.length >= limits.maxFiles) {
      state.truncated = true;
      return;
    }

    if (depth > limits.maxDepth) {
      state.truncated = true;
      return;
    }

    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (state.files.length >= limits.maxFiles) {
        state.truncated = true;
        return;
      }

      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = this.safetyService.toRelative(rootPath, absolutePath);

      if (this.ignoreService.shouldIgnore(relativePath, options.ignorePatterns)) {
        state.ignoredEntries.push(relativePath);
        continue;
      }

      if (entry.isDirectory()) {
        await this.walk(rootPath, absolutePath, depth + 1, options, state, limits);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      state.totalFilesVisited += 1;
      const stat = await fs.stat(absolutePath);
      if (stat.size > limits.maxFileSizeBytes) {
        continue;
      }

      const repositoryFile: RepositoryFile = {
        path: absolutePath,
        relativePath,
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        ...(options.includeTextPreview
          ? {
              textPreview: await this.readPreview(
                absolutePath,
                Math.min(options.previewMaxBytes ?? DEFAULT_PREVIEW_MAX_BYTES, limits.maxFileSizeBytes),
              ),
            }
          : {}),
      };

      state.files.push(repositoryFile);
    }
  }

  private async readPreview(filePath: string, maxBytes: number): Promise<string> {
    const handle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const readResult = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, readResult.bytesRead).toString('utf8');
    } finally {
      await handle.close();
    }
  }
}
