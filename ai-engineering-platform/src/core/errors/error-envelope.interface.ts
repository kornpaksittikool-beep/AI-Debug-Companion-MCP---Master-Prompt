import type { JsonSchemaObject } from '../registry/interfaces/json-schema.interface.js';

export interface ErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly reason: string;
  readonly suggestion: string;
  readonly correlationId?: string;
  readonly details?: JsonSchemaObject;
}

export const STANDARD_ERROR_SCHEMA = {
  type: 'object',
  required: ['code', 'message', 'reason', 'suggestion'],
  additionalProperties: false,
  properties: {
    code: { type: 'string' },
    message: { type: 'string' },
    reason: { type: 'string' },
    suggestion: { type: 'string' },
    correlationId: { type: 'string' },
    details: { type: 'object' },
  },
} as const;
