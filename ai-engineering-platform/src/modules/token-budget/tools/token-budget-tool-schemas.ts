import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';

const contextItemSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'content'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    content: { type: 'string' },
    kind: { type: 'string' },
    source: { type: 'string' },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
  },
};

const estimateInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['items'],
  additionalProperties: false,
  properties: {
    items: { type: 'array', items: contextItemSchema },
    budgetTokens: { type: 'number' },
    charsPerToken: { type: 'number' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const TOKEN_BUDGET_ESTIMATE_TOOL_DEFINITION: ToolDefinition = {
  name: 'token_budget.estimate',
  version: '1.0.0',
  description: 'Estimates approximate token usage for candidate context items before sending them to an AI model.',
  module: 'token-budget',
  inputSchema: estimateInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { items: [{ id: 'readme', content: 'hello' }], budgetTokens: 100 }, output: { estimatedTokens: 2 } }],
};

export const TOKEN_BUDGET_COMPRESS_CONTEXT_TOOL_DEFINITION: ToolDefinition = {
  name: 'token_budget.compress_context',
  version: '1.0.0',
  description: 'Compresses candidate context items to fit an approximate token budget while preserving priority order.',
  module: 'token-budget',
  inputSchema: {
    ...estimateInputSchema,
    required: ['items', 'maxTokens'],
    properties: {
      ...(estimateInputSchema.properties as JsonSchemaObject),
      maxTokens: { type: 'number' },
      preserveHeadTokens: { type: 'number' },
      preserveTailTokens: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { items: [{ id: 'file', content: 'long content' }], maxTokens: 10 }, output: { truncated: false } }],
};

export const TOKEN_BUDGET_RECOMMEND_STRATEGY_TOOL_DEFINITION: ToolDefinition = {
  name: 'token_budget.recommend_strategy',
  version: '1.0.0',
  description: 'Recommends a token-aware MCP evidence gathering flow for a repository task.',
  module: 'token-budget',
  inputSchema: {
    type: 'object',
    required: ['objective'],
    additionalProperties: false,
    properties: {
      objective: { type: 'string' },
      currentTokens: { type: 'number' },
      maxTokens: { type: 'number' },
      availableTools: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { objective: 'debug login bug', maxTokens: 4000 }, output: { status: 'unknown' } }],
};
