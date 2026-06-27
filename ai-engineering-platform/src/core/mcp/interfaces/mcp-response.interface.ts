import type { ErrorEnvelope } from '../../errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../registry/interfaces/json-schema.interface.js';

export type McpToolExecutionResponse =
  | {
      readonly ok: true;
      readonly output: JsonSchemaObject;
      readonly correlationId: string;
    }
  | {
      readonly ok: false;
      readonly error: ErrorEnvelope;
      readonly correlationId: string;
    };
