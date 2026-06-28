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

const projectProfileSchema: JsonSchemaObject = {
  ...boundedScanSchema,
  properties: {
    ...(boundedScanSchema.properties as JsonSchemaObject),
    maxKeyFiles: { type: 'number' },
    maxLargestFiles: { type: 'number' },
    maxExtensions: { type: 'number' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const REPOSITORY_PROJECT_PROFILE_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.project_profile',
  version: '1.0.0',
  description:
    'Returns a compact repository profile for low-token project summaries, including key files, manifests, entrypoints, and billing limitations.',
  module: 'repository-intelligence',
  inputSchema: projectProfileSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxFiles: 200 }, output: { tokenPolicy: { profile: 'compact' } } }],
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
      maxMatches: { type: 'number' },
      mode: { type: 'string', enum: ['full', 'compact', 'summary'] },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', query: 'service', mode: 'summary', maxMatches: 8 }, output: { matches: [] } }],
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

export const REPOSITORY_READ_FILE_EXCERPT_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.read_file_excerpt',
  version: '1.0.0',
  description: 'Reads a compact excerpt for one file, optimized for low-token project summaries and routing.',
  module: 'repository-intelligence',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'filePath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      filePath: { type: 'string' },
      maxBytes: { type: 'number' },
      purpose: { type: 'string', enum: ['summary', 'routing', 'debug', 'review'] },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', filePath: 'README.md', purpose: 'summary' }, output: { excerpt: '' } }],
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

export const REPOSITORY_IMPORT_GRAPH_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.import_graph',
  version: '1.0.0',
  description: 'Builds a bounded TypeScript and JavaScript import graph with relative import resolution.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      includeExternal: { type: 'boolean' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 7000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxFiles: 100 }, output: { edges: [] } }],
};

export const REPOSITORY_CALL_GRAPH_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.call_graph',
  version: '1.0.0',
  description: 'Builds a bounded best-effort TypeScript and JavaScript call graph.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      query: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 7000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', query: 'save' }, output: { edges: [] } }],
};

export const REPOSITORY_INDEX_STATUS_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.index_status',
  version: '1.0.0',
  description: 'Returns persistent repository index freshness and changed-file metadata.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      rebuildIfMissing: { type: 'boolean' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: {
    ...REPOSITORY_READ_PERMISSION,
    fileSystem: {
      ...REPOSITORY_READ_PERMISSION.fileSystem,
      write: true,
    },
  },
  timeoutMs: 7000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo' }, output: { stale: true } }],
};

export const REPOSITORY_REBUILD_INDEX_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.rebuild_index',
  version: '1.0.0',
  description: 'Rebuilds the persistent repository graph index under .ai-engineering-platform.',
  module: 'repository-intelligence',
  inputSchema: {
    ...boundedScanSchema,
    properties: {
      ...(boundedScanSchema.properties as JsonSchemaObject),
      force: { type: 'boolean' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: {
    ...REPOSITORY_READ_PERMISSION,
    fileSystem: {
      ...REPOSITORY_READ_PERMISSION.fileSystem,
      write: true,
    },
  },
  timeoutMs: 10000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo', force: true }, output: { indexedFiles: 10 } }],
};

export const REPOSITORY_CROSS_REPO_SEARCH_TOOL_DEFINITION: ToolDefinition = {
  name: 'repository.cross_repo_search',
  version: '1.0.0',
  description: 'Searches multiple bounded repository roots and returns normalized matches.',
  module: 'repository-intelligence',
  inputSchema: {
    type: 'object',
    required: ['repositories', 'query'],
    additionalProperties: false,
    properties: {
      repositories: {
        type: 'array',
        items: boundedScanSchema,
      },
      query: { type: 'string' },
      extension: { type: 'string' },
      maxMatchesPerRepository: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: REPOSITORY_READ_PERMISSION,
  timeoutMs: 10000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { repositories: [{ rootPath: '/repo-a' }], query: 'Service' }, output: { matches: [] } }],
};
