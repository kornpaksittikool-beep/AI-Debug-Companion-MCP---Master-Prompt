import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const PERFORMANCE_SECURITY_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: false,
    allowedRoots: ['provided-rootPath'],
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

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const PERFORMANCE_CACHE_SUMMARY_TOOL_DEFINITION: ToolDefinition = {
  name: 'performance.cache_summary',
  version: '1.0.0',
  description: 'Returns in-memory cache summary metadata by namespace.',
  module: 'performance-security',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { namespace: { type: 'string' } },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PERFORMANCE_SECURITY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { totalEntries: 0 } }],
};

export const PERFORMANCE_INVALIDATE_CACHE_TOOL_DEFINITION: ToolDefinition = {
  name: 'performance.invalidate_cache',
  version: '1.0.0',
  description: 'Invalidates in-memory cache entries by namespace and optional key.',
  module: 'performance-security',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      namespace: { type: 'string' },
      key: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PERFORMANCE_SECURITY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { namespace: 'repository.scan' }, output: { invalidatedEntries: 1 } }],
};

export const SECURITY_AUDIT_PROJECT_TOOL_DEFINITION: ToolDefinition = {
  name: 'security.audit_project',
  version: '1.0.0',
  description: 'Scans bounded project file previews for prompt-injection and secret-handling markers.',
  module: 'performance-security',
  inputSchema: {
    type: 'object',
    required: ['rootPath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      maxFiles: { type: 'number' },
      maxFileSizeBytes: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PERFORMANCE_SECURITY_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo' }, output: { findings: [] } }],
};

export const SECURITY_AUDIT_TOOL_PERMISSIONS_TOOL_DEFINITION: ToolDefinition = {
  name: 'security.audit_tool_permissions',
  version: '1.0.0',
  description: 'Audits registered tool permissions for broad write, command, network, and git access.',
  module: 'performance-security',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PERFORMANCE_SECURITY_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { findings: [] } }],
};
