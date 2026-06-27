import type { JsonSchemaObject } from './json-schema.interface.js';

export interface ToolExecutionContext {
  readonly correlationId: string;
  readonly startedAt: Date;
}

export interface ToolHandler {
  execute(input: JsonSchemaObject, context: ToolExecutionContext): Promise<JsonSchemaObject>;
}
