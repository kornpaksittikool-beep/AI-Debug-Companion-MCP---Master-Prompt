import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const GIT_READ_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: false,
    allowedRoots: ['provided-rootPath'],
  },
  commands: {
    execute: true,
    allowList: ['git log', 'git blame'],
  },
  git: {
    read: true,
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

const recentChangesInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
    maxCommits: { type: 'number' },
  },
};

const fileHistoryInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath', 'filePath'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
    filePath: { type: 'string' },
    maxCommits: { type: 'number' },
  },
};

const blameInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath', 'filePath'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
    filePath: { type: 'string' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const GIT_RECENT_CHANGES_TOOL_DEFINITION: ToolDefinition = {
  name: 'git.recent_changes',
  version: '1.0.0',
  description: 'Reads recent git commits from a repository using read-only git log.',
  module: 'git-intelligence',
  inputSchema: recentChangesInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: GIT_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxCommits: 5 }, output: { commits: [] } }],
};

export const GIT_BLAME_TOOL_DEFINITION: ToolDefinition = {
  name: 'git.blame',
  version: '1.0.0',
  description: 'Reads line ownership metadata for one file using read-only git blame.',
  module: 'git-intelligence',
  inputSchema: blameInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: GIT_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', filePath: 'src/app.ts' }, output: { lines: [] } }],
};

export const GIT_FIND_COMMIT_BY_FILE_TOOL_DEFINITION: ToolDefinition = {
  name: 'git.find_commit_by_file',
  version: '1.0.0',
  description: 'Reads commit history that affected one file using read-only git log.',
  module: 'git-intelligence',
  inputSchema: fileHistoryInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: GIT_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [
    {
      input: { rootPath: '/repo', filePath: 'README.md', maxCommits: 5 },
      output: { commits: [] },
    },
  ],
};

export const GIT_IMPACT_HINTS_TOOL_DEFINITION: ToolDefinition = {
  name: 'git.impact_hints',
  version: '1.0.0',
  description: 'Summarizes file-level change frequency hints from recent read-only git history.',
  module: 'git-intelligence',
  inputSchema: recentChangesInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: GIT_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', maxCommits: 20 }, output: { hints: [] } }],
};
