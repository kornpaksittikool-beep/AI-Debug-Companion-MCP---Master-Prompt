import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

const aiRequestProperties: JsonSchemaObject = {
  providerId: { type: 'string' },
  modelId: { type: 'string' },
  capability: { type: 'string' },
  prompt: { type: 'string' },
  messages: {
    type: 'array',
    items: { type: 'object', additionalProperties: true, properties: {} },
  },
  requiredContextTokens: { type: 'number' },
  requireJsonMode: { type: 'boolean' },
  requireToolUse: { type: 'boolean' },
};

const aiRequestSchema: JsonSchemaObject = {
  type: 'object',
  required: ['capability'],
  additionalProperties: false,
  properties: aiRequestProperties,
};

export const AI_PROVIDERS_TOOL_DEFINITION: ToolDefinition = {
  name: 'ai.providers',
  version: '1.0.0',
  description: 'Lists provider-neutral AI provider profiles and model metadata.',
  module: 'ai-provider',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { providers: [] } }],
};

export const AI_PROVIDER_METADATA_TOOL_DEFINITION: ToolDefinition = {
  name: 'ai.provider_metadata',
  version: '1.0.0',
  description: 'Returns metadata for one registered AI provider profile.',
  module: 'ai-provider',
  inputSchema: {
    type: 'object',
    required: ['providerId'],
    additionalProperties: false,
    properties: {
      providerId: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { providerId: 'openai' }, output: { id: 'openai' } }],
};

export const AI_VALIDATE_REQUEST_TOOL_DEFINITION: ToolDefinition = {
  name: 'ai.validate_request',
  version: '1.0.0',
  description: 'Validates a normalized AI request against provider and model metadata without calling an AI API.',
  module: 'ai-provider',
  inputSchema: aiRequestSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { capability: 'chat', providerId: 'openai' }, output: { valid: true } }],
};

export const AI_ROUTE_REQUEST_TOOL_DEFINITION: ToolDefinition = {
  name: 'ai.route_request',
  version: '1.0.0',
  description: 'Creates a deterministic provider-neutral AI routing plan without calling an AI API.',
  module: 'ai-provider',
  inputSchema: {
    ...aiRequestSchema,
    properties: {
      ...aiRequestProperties,
      preferredProviderIds: { type: 'array', items: { type: 'string' } },
      excludedProviderIds: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { capability: 'tool_use', preferredProviderIds: ['openai'] }, output: { selected: { providerId: 'openai' } } }],
};
