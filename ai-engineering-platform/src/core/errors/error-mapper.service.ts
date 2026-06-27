import { Injectable } from '@nestjs/common';
import { PlatformError } from './platform-error.js';
import type { ErrorEnvelope } from './error-envelope.interface.js';

@Injectable()
export class ErrorMapperService {
  toEnvelope(error: unknown, correlationId?: string): ErrorEnvelope {
    if (error instanceof PlatformError) {
      return error.toEnvelope(correlationId);
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'The tool execution failed unexpectedly.',
      reason: error instanceof Error ? error.message : 'Unknown error.',
      suggestion: 'Review server logs using the correlation ID and retry after the issue is fixed.',
      ...(correlationId ? { correlationId } : {}),
    };
  }
}
