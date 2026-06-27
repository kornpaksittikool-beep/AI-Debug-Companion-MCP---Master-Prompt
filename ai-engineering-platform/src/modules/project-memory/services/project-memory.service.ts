import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  MemoryCategory,
  MemoryExportResult,
  MemoryRecord,
  MemoryRefreshResult,
  MemoryRootInput,
  MemorySummary,
  RecordMemoryInput,
  SearchMemoryInput,
  SearchMemoryResult,
} from '../interfaces/project-memory.interface.js';
import { ProjectMemoryPathService } from './project-memory-path.service.js';

const DEFAULT_SEARCH_LIMIT = 25;
const MAX_SEARCH_LIMIT = 100;

@Injectable()
export class ProjectMemoryService {
  constructor(private readonly paths: ProjectMemoryPathService) {}

  async record(input: RecordMemoryInput): Promise<MemoryRecord> {
    this.ensureText(input.title, 'title');
    this.ensureText(input.content, 'content');
    this.ensureText(input.source, 'source');
    const paths = this.paths.resolve(input.rootPath);
    await fs.mkdir(paths.memoryDir, { recursive: true });
    const existing = await this.readRecords(input.rootPath);
    const record: MemoryRecord = {
      id: this.createId('mem'),
      version: this.nextVersion(existing),
      category: input.category,
      title: input.title.trim(),
      content: input.content.trim(),
      source: input.source.trim(),
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    await fs.appendFile(paths.recordsPath, `${JSON.stringify(record)}\n`, 'utf8');
    return record;
  }

  async search(input: SearchMemoryInput): Promise<SearchMemoryResult> {
    const records = await this.readRecords(input.rootPath);
    const query = input.query?.trim().toLowerCase();
    const tags = new Set(input.tags ?? []);
    const limit = this.normalizeLimit(input.limit);
    const filtered = records.filter((record) => {
      const queryMatches = query
        ? `${record.title}\n${record.content}\n${record.source}`.toLowerCase().includes(query)
        : true;
      const categoryMatches = input.category ? record.category === input.category : true;
      const tagsMatch = tags.size > 0 ? record.tags.some((tag) => tags.has(tag)) : true;
      return queryMatches && categoryMatches && tagsMatch;
    });

    return {
      rootPath: this.paths.resolve(input.rootPath).rootPath,
      records: filtered.slice(0, limit),
      totalRecords: filtered.length,
    };
  }

  async summarize(input: MemoryRootInput): Promise<MemorySummary> {
    const records = await this.readRecords(input.rootPath);
    return this.toSummary(this.paths.resolve(input.rootPath).rootPath, records);
  }

  async refresh(input: MemoryRootInput): Promise<MemoryRefreshResult> {
    const paths = this.paths.resolve(input.rootPath);
    await fs.mkdir(paths.memoryDir, { recursive: true });
    const records = await this.readRecords(input.rootPath);
    const summary = this.toSummary(paths.rootPath, records);
    const refreshedAt = new Date().toISOString();
    await fs.writeFile(
      paths.snapshotPath,
      JSON.stringify({ ...summary, records, refreshedAt }, null, 2),
      'utf8',
    );

    return {
      ...summary,
      snapshotPath: paths.snapshotPath,
      refreshedAt,
    };
  }

  async export(input: MemoryRootInput): Promise<MemoryExportResult> {
    const records = await this.readRecords(input.rootPath);
    return {
      ...this.toSummary(this.paths.resolve(input.rootPath).rootPath, records),
      records,
      exportedAt: new Date().toISOString(),
    };
  }

  private async readRecords(rootPath: string): Promise<readonly MemoryRecord[]> {
    const paths = this.paths.resolve(rootPath);
    try {
      const content = await fs.readFile(paths.recordsPath, 'utf8');
      return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as MemoryRecord);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private toSummary(rootPath: string, records: readonly MemoryRecord[]): MemorySummary {
    const counts = new Map<MemoryCategory, number>();
    for (const record of records) {
      counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
    }

    return {
      rootPath,
      totalRecords: records.length,
      categories: [...counts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
      latestVersion: records.at(-1)?.version ?? 0,
    };
  }

  private nextVersion(records: readonly MemoryRecord[]): number {
    return (records.at(-1)?.version ?? 0) + 1;
  }

  private normalizeLimit(value: number | undefined): number {
    const limit = value ?? DEFAULT_SEARCH_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_LIMIT) {
      throw new PlatformError({
        code: 'INVALID_MEMORY_SEARCH_LIMIT',
        message: 'Invalid memory search limit.',
        reason: `Search limit must be an integer between 1 and ${MAX_SEARCH_LIMIT}.`,
        suggestion: 'Use a smaller bounded limit or omit the value.',
      });
    }
    return limit;
  }

  private ensureText(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new PlatformError({
        code: 'INVALID_MEMORY_RECORD',
        message: `Memory field "${fieldName}" is required.`,
        reason: 'Project memory records require traceable, meaningful content.',
        suggestion: `Provide a non-empty "${fieldName}" value.`,
      });
    }
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
