import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';

export type MemoryCategory =
  | 'architecture'
  | 'business_flow'
  | 'naming_convention'
  | 'folder_convention'
  | 'coding_standard'
  | 'dto_pattern'
  | 'error_pattern'
  | 'known_issue'
  | 'project_decision'
  | 'plan'
  | 'patch'
  | 'verification';

export interface MemoryRecord {
  readonly id: string;
  readonly version: number;
  readonly category: MemoryCategory;
  readonly title: string;
  readonly content: string;
  readonly source: string;
  readonly tags: readonly string[];
  readonly metadata: JsonSchemaObject;
  readonly createdAt: string;
}

export interface RecordMemoryInput {
  readonly rootPath: string;
  readonly category: MemoryCategory;
  readonly title: string;
  readonly content: string;
  readonly source: string;
  readonly tags?: readonly string[];
  readonly metadata?: JsonSchemaObject;
}

export interface SearchMemoryInput {
  readonly rootPath: string;
  readonly query?: string;
  readonly category?: MemoryCategory;
  readonly tags?: readonly string[];
  readonly limit?: number;
}

export interface SearchMemoryResult {
  readonly rootPath: string;
  readonly records: readonly MemoryRecord[];
  readonly totalRecords: number;
}

export interface MemorySummary {
  readonly rootPath: string;
  readonly totalRecords: number;
  readonly categories: readonly {
    readonly category: MemoryCategory;
    readonly count: number;
  }[];
  readonly latestVersion: number;
}

export interface MemoryRootInput {
  readonly rootPath: string;
}

export interface MemoryRefreshResult extends MemorySummary {
  readonly snapshotPath: string;
  readonly refreshedAt: string;
}

export interface MemoryExportResult extends MemorySummary {
  readonly records: readonly MemoryRecord[];
  readonly exportedAt: string;
}
