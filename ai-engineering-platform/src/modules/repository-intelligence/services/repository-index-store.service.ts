import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  RepositoryIndexFileEntry,
  RepositoryIndexSnapshot,
  RepositoryIndexStatusOptions,
  RepositoryIndexStatusResult,
  RepositoryFile,
  RepositoryRebuildIndexOptions,
  RepositoryRebuildIndexResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryGraphService } from './repository-graph.service.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const INDEX_DIRECTORY = '.ai-engineering-platform/repository-index';
const INDEX_FILE = 'index.json';

@Injectable()
export class RepositoryIndexStoreService {
  constructor(
    private readonly safety: RepositorySafetyService,
    private readonly graph: RepositoryGraphService,
  ) {}

  async status(options: RepositoryIndexStatusOptions): Promise<RepositoryIndexStatusResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const existing = await this.readSnapshot(rootPath);
    if (!existing && options.rebuildIfMissing) {
      await this.rebuild({ ...options, force: true });
      return this.status({ ...options, rebuildIfMissing: false });
    }

    const currentSnapshot = await this.graph.buildGraphSnapshot(options);
    const comparison = this.compare(currentSnapshot.files, existing);
    return {
      rootPath,
      indexExists: Boolean(existing),
      indexedFiles: existing?.files.length ?? 0,
      currentFiles: currentSnapshot.files.length,
      changedFiles: comparison.changedFiles,
      missingFiles: comparison.missingFiles,
      deletedFiles: comparison.deletedFiles,
      ...(existing?.generatedAt ? { generatedAt: existing.generatedAt } : {}),
      stale:
        !existing ||
        comparison.changedFiles.length > 0 ||
        comparison.missingFiles.length > 0 ||
        comparison.deletedFiles.length > 0,
    };
  }

  async rebuild(options: RepositoryRebuildIndexOptions): Promise<RepositoryRebuildIndexResult> {
    const previous = await this.readSnapshot(this.safety.resolveRoot(options.rootPath));
    const snapshot = await this.graph.buildGraphSnapshot(options);
    const generatedAt = new Date().toISOString();
    const files: RepositoryIndexFileEntry[] = snapshot.files.map((file) => ({
      relativePath: file.relativePath,
      sizeBytes: file.sizeBytes,
      modifiedAt: file.modifiedAt,
      indexedAt: generatedAt,
    }));
    const next: RepositoryIndexSnapshot = {
      rootPath: snapshot.rootPath,
      generatedAt,
      files,
      importEdges: snapshot.importEdges,
      callEdges: snapshot.callEdges,
      truncated: snapshot.truncated,
    };
    await this.writeSnapshot(next);

    const previousByPath = new Map(previous?.files.map((file) => [file.relativePath, file]) ?? []);
    const changedFiles = files
      .filter((file) => {
        const previousFile = previousByPath.get(file.relativePath);
        return !previousFile || previousFile.sizeBytes !== file.sizeBytes || previousFile.modifiedAt !== file.modifiedAt;
      })
      .map((file) => file.relativePath);

    return {
      rootPath: snapshot.rootPath,
      indexedFiles: files.length,
      importEdges: snapshot.importEdges.length,
      callEdges: snapshot.callEdges.length,
      changedFiles,
      reusedFiles: files.length - changedFiles.length,
      generatedAt,
      indexPath: this.indexFilePath(snapshot.rootPath),
    };
  }

  private compare(
    currentFiles: readonly RepositoryFile[],
    snapshot: RepositoryIndexSnapshot | undefined,
  ): {
    readonly changedFiles: readonly string[];
    readonly missingFiles: readonly string[];
    readonly deletedFiles: readonly string[];
  } {
    if (!snapshot) {
      return {
        changedFiles: [],
        missingFiles: currentFiles.map((file) => file.relativePath),
        deletedFiles: [],
      };
    }

    const currentByPath = new Map(currentFiles.map((file) => [file.relativePath, file]));
    const indexedByPath = new Map(snapshot.files.map((file) => [file.relativePath, file]));
    const changedFiles = currentFiles
      .filter((file) => {
        const indexed = indexedByPath.get(file.relativePath);
        return indexed && (indexed.sizeBytes !== file.sizeBytes || indexed.modifiedAt !== file.modifiedAt);
      })
      .map((file) => file.relativePath);
    const missingFiles = currentFiles
      .filter((file) => !indexedByPath.has(file.relativePath))
      .map((file) => file.relativePath);
    const deletedFiles = snapshot.files
      .filter((file) => !currentByPath.has(file.relativePath))
      .map((file) => file.relativePath);

    return { changedFiles, missingFiles, deletedFiles };
  }

  private async readSnapshot(rootPath: string): Promise<RepositoryIndexSnapshot | undefined> {
    try {
      const content = await fs.readFile(this.indexFilePath(rootPath), 'utf8');
      return JSON.parse(content) as RepositoryIndexSnapshot;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  private async writeSnapshot(snapshot: RepositoryIndexSnapshot): Promise<void> {
    const directory = path.dirname(this.indexFilePath(snapshot.rootPath));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(this.indexFilePath(snapshot.rootPath), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  }

  private indexFilePath(rootPath: string): string {
    return this.safety.resolveInsideRoot(rootPath, path.join(INDEX_DIRECTORY, INDEX_FILE));
  }
}
