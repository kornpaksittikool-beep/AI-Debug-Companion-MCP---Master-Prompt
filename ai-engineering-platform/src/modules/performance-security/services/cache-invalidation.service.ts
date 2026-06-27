import { Injectable } from '@nestjs/common';
import type {
  CacheInvalidationInput,
  CacheInvalidationResult,
  CacheSummaryInput,
  CacheSummary,
} from '../interfaces/performance-security.interface.js';
import { CacheStoreService } from './cache-store.service.js';

@Injectable()
export class CacheInvalidationService {
  constructor(private readonly cache: CacheStoreService) {}

  summary(input: CacheSummaryInput): CacheSummary {
    return this.cache.summary(input.namespace);
  }

  invalidate(input: CacheInvalidationInput): CacheInvalidationResult {
    const invalidatedEntries = this.cache.invalidate(input.namespace, input.key);
    return {
      ...this.cache.summary(input.namespace),
      invalidatedEntries,
    };
  }
}
