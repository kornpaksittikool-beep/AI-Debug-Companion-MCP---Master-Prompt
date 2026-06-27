export interface CacheEntryMetadata {
  readonly namespace: string;
  readonly key: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface CacheSummary {
  readonly totalEntries: number;
  readonly namespaces: readonly {
    readonly namespace: string;
    readonly entries: number;
  }[];
}

export interface CacheSummaryInput {
  readonly namespace?: string;
}

export interface CacheInvalidationInput {
  readonly namespace?: string;
  readonly key?: string;
}

export interface CacheInvalidationResult extends CacheSummary {
  readonly invalidatedEntries: number;
}

export type SecurityRiskLevel = 'low' | 'medium' | 'high';

export interface SecurityFinding {
  readonly id: string;
  readonly risk: SecurityRiskLevel;
  readonly category: 'path' | 'command' | 'prompt_injection' | 'plugin' | 'permission';
  readonly source: string;
  readonly message: string;
  readonly suggestion: string;
}

export interface SecurityAuditProjectInput {
  readonly rootPath: string;
  readonly maxFiles?: number;
  readonly maxFileSizeBytes?: number;
}

export interface SecurityAuditProjectResult {
  readonly rootPath: string;
  readonly findings: readonly SecurityFinding[];
  readonly scannedFiles: number;
  readonly truncated: boolean;
}

export interface SecurityAuditToolPermissionsResult {
  readonly findings: readonly SecurityFinding[];
  readonly auditedTools: number;
}
