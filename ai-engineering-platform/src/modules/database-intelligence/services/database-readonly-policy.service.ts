import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';

const FORBIDDEN_SQL_TOKENS = [
  'insert',
  'update',
  'delete',
  'drop',
  'alter',
  'create',
  'truncate',
  'attach',
  'detach',
  'replace',
  'vacuum',
  'reindex',
  'begin',
  'commit',
  'rollback',
] as const;

@Injectable()
export class DatabaseReadonlyPolicyService {
  assertReadOnly(query: string): void {
    const normalized = this.stripComments(query).trim().toLowerCase();

    if (!normalized) {
      throw new PlatformError({
        code: 'INVALID_DATABASE_QUERY',
        message: 'Database query is required.',
        reason: 'Query preview requires a non-empty read-only SQL statement.',
        suggestion: 'Provide a SELECT, WITH, or safe PRAGMA query.',
      });
    }

    if (!this.startsWithAllowedRead(normalized)) {
      throw new PlatformError({
        code: 'DATABASE_QUERY_NOT_READ_ONLY',
        message: 'Only read-only database queries are allowed.',
        reason: 'Query preview is restricted to SELECT, WITH, and safe PRAGMA statements.',
        suggestion: 'Use a read-only query or schema/relation tools.',
      });
    }

    const tokens = normalized.match(/\b[a-z_]+\b/g) ?? [];
    const forbidden = tokens.find((token) => FORBIDDEN_SQL_TOKENS.includes(token as never));

    if (forbidden) {
      throw new PlatformError({
        code: 'DATABASE_QUERY_MUTATION_REJECTED',
        message: `Database query contains forbidden token "${forbidden}".`,
        reason: 'Mutation and transaction statements are not allowed in query preview.',
        suggestion: 'Remove mutation statements and use a read-only query.',
      });
    }
  }

  private startsWithAllowedRead(query: string): boolean {
    return query.startsWith('select ') || query.startsWith('with ') || this.isSafePragma(query);
  }

  private isSafePragma(query: string): boolean {
    return (
      query.startsWith('pragma table_info') ||
      query.startsWith('pragma foreign_key_list') ||
      query.startsWith('pragma database_list')
    );
  }

  private stripComments(query: string): string {
    return query
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  }
}
