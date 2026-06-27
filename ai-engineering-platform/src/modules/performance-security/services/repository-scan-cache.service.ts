import { Injectable } from '@nestjs/common';
import type {
  RepositoryScanOptions,
  RepositoryScanResult,
} from '../../repository-intelligence/interfaces/repository-intelligence.interface.js';
import { RepositoryIntelligenceService } from '../../repository-intelligence/services/repository-intelligence.service.js';
import { CacheStoreService } from './cache-store.service.js';

const REPOSITORY_SCAN_NAMESPACE = 'repository.scan';
const DEFAULT_TTL_MS = 30_000;

@Injectable()
export class RepositoryScanCacheService {
  constructor(
    private readonly cache: CacheStoreService,
    private readonly repository: RepositoryIntelligenceService,
  ) {}

  async scan(options: RepositoryScanOptions): Promise<RepositoryScanResult> {
    const key = JSON.stringify(options);
    const cached = this.cache.get<RepositoryScanResult>(REPOSITORY_SCAN_NAMESPACE, key);
    if (cached) {
      return cached;
    }
    const result = await this.repository.scan(options);
    return this.cache.set(REPOSITORY_SCAN_NAMESPACE, key, result, DEFAULT_TTL_MS);
  }
}
