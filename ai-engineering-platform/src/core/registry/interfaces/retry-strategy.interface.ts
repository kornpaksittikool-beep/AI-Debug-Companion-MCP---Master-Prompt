export interface RetryStrategy {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly retryableErrors: readonly string[];
}

export const NO_RETRY: RetryStrategy = {
  enabled: false,
  maxAttempts: 1,
  backoffMs: 0,
  retryableErrors: [],
};
