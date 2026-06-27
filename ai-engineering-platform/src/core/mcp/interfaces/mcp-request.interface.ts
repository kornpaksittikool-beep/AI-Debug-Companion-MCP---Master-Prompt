import type { JsonSchemaObject } from '../../registry/interfaces/json-schema.interface.js';

export interface McpToolExecutionRequest {
  readonly toolName: string;
  readonly input: JsonSchemaObject;
  readonly correlationId?: string;
}
