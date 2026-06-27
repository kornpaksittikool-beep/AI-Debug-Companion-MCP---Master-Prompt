import type { JsonSchemaObject } from '../registry/interfaces/json-schema.interface.js';
import type { ErrorEnvelope } from './error-envelope.interface.js';

export interface PlatformErrorOptions {
  readonly code: string;
  readonly message: string;
  readonly reason: string;
  readonly suggestion: string;
  readonly details?: JsonSchemaObject;
  readonly cause?: unknown;
}

export class PlatformError extends Error {
  readonly code: string;
  readonly reason: string;
  readonly suggestion: string;
  readonly details?: JsonSchemaObject;
  override readonly cause?: unknown;

  constructor(options: PlatformErrorOptions) {
    super(options.message);
    this.name = 'PlatformError';
    this.code = options.code;
    this.reason = options.reason;
    this.suggestion = options.suggestion;
    if (options.details) {
      this.details = options.details;
    }
    this.cause = options.cause;
  }

  toEnvelope(correlationId?: string): ErrorEnvelope {
    return {
      code: this.code,
      message: this.message,
      reason: this.reason,
      suggestion: this.suggestion,
      ...(correlationId ? { correlationId } : {}),
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
