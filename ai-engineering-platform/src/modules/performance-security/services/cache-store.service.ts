import { Injectable } from '@nestjs/common';
import type { CacheSummary } from '../interfaces/performance-security.interface.js';

interface CacheEntry<TValue> {
  readonly namespace: string;
  readonly key: string;
  readonly value: TValue;
  readonly createdAt: number;
  readonly ttlMs?: number;
}

@Injectable()
export class CacheStoreService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  set<TValue>(namespace: string, key: string, value: TValue, ttlMs?: number): TValue {
    this.entries.set(this.toStoreKey(namespace, key), {
      namespace,
      key,
      value,
      createdAt: Date.now(),
      ...(ttlMs ? { ttlMs } : {}),
    });
    return value;
  }

  get<TValue>(namespace: string, key: string): TValue | undefined {
    const storeKey = this.toStoreKey(namespace, key);
    const entry = this.entries.get(storeKey);
    if (!entry) {
      return undefined;
    }
    if (entry.ttlMs && Date.now() - entry.createdAt > entry.ttlMs) {
      this.entries.delete(storeKey);
      return undefined;
    }
    return entry.value as TValue;
  }

  invalidate(namespace?: string, key?: string): number {
    let invalidated = 0;
    for (const [storeKey, entry] of this.entries.entries()) {
      const namespaceMatches = namespace ? entry.namespace === namespace : true;
      const keyMatches = key ? entry.key === key : true;
      if (namespaceMatches && keyMatches) {
        this.entries.delete(storeKey);
        invalidated += 1;
      }
    }
    return invalidated;
  }

  summary(namespace?: string): CacheSummary {
    const counts = new Map<string, number>();
    for (const entry of this.entries.values()) {
      if (entry.ttlMs && Date.now() - entry.createdAt > entry.ttlMs) {
        continue;
      }
      if (namespace && entry.namespace !== namespace) {
        continue;
      }
      counts.set(entry.namespace, (counts.get(entry.namespace) ?? 0) + 1);
    }

    return {
      totalEntries: [...counts.values()].reduce((sum, count) => sum + count, 0),
      namespaces: [...counts.entries()]
        .map(([entryNamespace, entries]) => ({ namespace: entryNamespace, entries }))
        .sort((a, b) => a.namespace.localeCompare(b.namespace)),
    };
  }

  private toStoreKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }
}
