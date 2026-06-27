import { Injectable } from '@nestjs/common';

const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  '.turbo',
  '.nx',
  '.cache',
  '.pnpm-store',
  'tmp',
] as const;

@Injectable()
export class RepositoryIgnoreService {
  shouldIgnore(relativePath: string, customPatterns: readonly string[] = []): boolean {
    const normalized = relativePath.replaceAll('\\', '/');
    const segments = normalized.split('/').filter(Boolean);
    const patterns = [...DEFAULT_IGNORES, ...customPatterns];

    return patterns.some((pattern) => {
      const normalizedPattern = pattern.replaceAll('\\', '/');
      return segments.includes(normalizedPattern) || normalized.includes(normalizedPattern);
    });
  }
}
