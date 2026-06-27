import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const REPOSITORY_READ_PERMISSION: ToolPermission = {
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

const boundedScanSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
    maxFiles: { type: 'number' },
    maxDepth: { type: 'number' },
    maxFileSizeBytes: { type: 'number' },
    includeTextPreview: { type: 'boolean' },
    previewMaxBytes: { type: 'number' },
    ignorePatterns: { type: 'array', items: { type: 'string' } },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const REPOSITORY_OVERVIEW_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.overview',
  version: '1.0.0',
  description: 'Returns a bounded overview of repository files and extension distribution.',
  module: 'repository-intelligence',
  inputSchema: boundedScanSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxFiles: 100 }, output: { fileCount: 10 } }],
};

export const REPOSITORY_SCAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.scan',
  version: '1.0.0',
  description: 'Scans repository files with ignore rules, path validation, and explicit bounds.',
  module: 'repository-intelligence',
  inputSchema: boundedScanSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxFiles: 100 }, output: { files: [] } }],
};

export const REPOSITORY_SEARCH_FILES_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.search_files',
  version: '1.0.0',
  description: 'Searches bounded repository file index by file path, extension, or text preview.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      query: { type: 'string' },
      extension: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', query: 'service' }, output: { matches: [] } }],
};

export const REPOSITORY_READ_FILE_CONTEXT_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.read_file_context',
  version: '1.0.0',
  description: 'Reads bounded content for one file inside the repository root.',
  module: 'repository-intelligence',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'filePath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      filePath: { type: 'string' },
      maxBytes: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', filePath: 'README.md' }, output: { content: '' } }],
};

export const REPOSITORY_READ_MODULE_CONTEXT_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.read_module_context',
  version: '1.0.0',
  description: 'Reads bounded file context for files under a module directory.',
  module: 'repository-intelligence',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'modulePath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      modulePath: { type: 'string' },
      maxFiles: { type: 'number' },
      maxDepth: { type: 'number' },
      maxFileSizeBytes: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', modulePath: 'src/core' }, output: { files: [] } }],
};

export const REPOSITORY_SEARCH_SYMBOLS_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.search_symbols',
  version: '1.0.0',
  description: 'Searches TypeScript and JavaScript symbols using a bounded AST-backed index.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      query: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['class', 'function', 'method', 'interface', 'type', 'enum', 'variable'],
      },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', query: 'Service' }, output: { symbols: [] } }],
};

export const REPOSITORY_READ_SYMBOL_CONTEXT_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.read_symbol_context',
  version: '1.0.0',
  description: 'Reads bounded context for a specific TypeScript or JavaScript symbol.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    required: ['rootPath', 'symbolName'],
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      symbolName: { type: 'string' },
      filePath: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['class', 'function', 'method', 'interface', 'type', 'enum', 'variable'],
      },
      maxBytes: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [
    {
      input: { rootPath: '/repo', symbolName: 'Service', filePath: 'src/service.ts' },
      output: { context: '' },
    },
  ],
};
