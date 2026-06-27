import type { ToolPermission } from '../../security/permission.interface.js';
import type { JsonSchemaObject } from './json-schema.interface.js';
import type { RetryStrategy } from './retry-strategy.interface.js';

export type ToolSideEffect = 'none' | 'read' | 'write';

export interface ToolExample {
  readonly input: JsonSchemaObject;
  readonly output: JsonSchemaObject;
}

export interface ToolDefinition {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly module: string;
  readonly inputSchema: JsonSchemaObject;
  readonly outputSchema: JsonSchemaObject;
  readonly errorSchema: JsonSchemaObject;
  readonly permissions: ToolPermission;
  readonly timeoutMs: number;
  readonly retryStrategy: RetryStrategy;
  readonly sideEffects: ToolSideEffect;
  readonly examples: readonly ToolExample[];
}
