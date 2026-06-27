import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const MEMORY_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: true,
    allowedRoots: ['provided-rootPath/.ai-engineering-platform/memory'],
  },
  commands: {
    execute: false,
    allowList: [],
  },
  git: {
    read: false,
    write: false,
  },
  database: {
    read: false,
    write: false,
  },
  network: {
    enabled: false,
  },
};

const categorySchema: JsonSchemaObject = {
  type: 'string',
  enum: [
    'architecture',
    'business_flow',
    'naming_convention',
    'folder_convention',
    'coding_standard',
    'dto_pattern',
    'error_pattern',
    'known_issue',
    'project_decision',
    'plan',
    'patch',
    'verification',
  ],
};

const rootInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const MEMORY_RECORD_TOOL_DEFINITION: ToolDefinition = {
  name: 'memory.record',
  version: '1.0.0',
  description: 'Records a versioned project memory item in the platform-controlled memory store.',
  module: 'project-memory',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'category', 'title', 'content', 'source'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      category: categorySchema,
      title: { type: 'string' },
      content: { type: 'string' },
      source: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      metadata: { type: 'object', additionalProperties: true, properties: {} },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: MEMORY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo', category: 'architecture', title: 'Modules', content: '...', source: 'analysis' }, output: { version: 1 } }],
};

export const MEMORY_SEARCH_TOOL_DEFINITION: ToolDefinition = {
  name: 'memory.search',
  version: '1.0.0',
  description: 'Searches versioned project memory by query, category, and tags.',
  module: 'project-memory',
  inputSchema: {
    type: 'object',
    required: ['rootPath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      query: { type: 'string' },
      category: categorySchema,
      tags: { type: 'array', items: { type: 'string' } },
      limit: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: MEMORY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', query: 'auth' }, output: { records: [] } }],
};

export const MEMORY_SUMMARIZE_TOOL_DEFINITION: ToolDefinition = {
  name: 'memory.summarize',
  version: '1.0.0',
  description: 'Summarizes project memory counts and latest version.',
  module: 'project-memory',
  inputSchema: rootInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: MEMORY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo' }, output: { totalRecords: 0 } }],
};

export const MEMORY_REFRESH_TOOL_DEFINITION: ToolDefinition = {
  name: 'memory.refresh',
  version: '1.0.0',
  description: 'Rebuilds the project memory snapshot from append-only records.',
  module: 'project-memory',
  inputSchema: rootInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: MEMORY_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo' }, output: { snapshotPath: '/repo/.ai-engineering-platform/memory/snapshot.json' } }],
};

export const MEMORY_EXPORT_TOOL_DEFINITION: ToolDefinition = {
  name: 'memory.export',
  version: '1.0.0',
  description: 'Exports all project memory records and summary metadata.',
  module: 'project-memory',
  inputSchema: rootInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: MEMORY_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo' }, output: { records: [] } }],
};
