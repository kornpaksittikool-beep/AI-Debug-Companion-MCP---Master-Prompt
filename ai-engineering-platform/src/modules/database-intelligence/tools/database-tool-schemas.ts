import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const DATABASE_READ_PERMISSION: ToolPermission = {
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
    read: true,
    write: false,
  },
  network: {
    enabled: false,
  },
};

const connectionSchema: JsonSchemaObject = {
  type: 'object',
  required: ['dialect', 'databasePath', 'rootPath'],
  additionalProperties: false,
  properties: {
    dialect: { type: 'string', enum: ['sqlite'] },
    databasePath: { type: 'string' },
    rootPath: { type: 'string' },
  },
};

const connectionInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['dialect', 'databasePath', 'rootPath'],
  additionalProperties: false,
  properties: connectionSchema.properties as JsonSchemaObject,
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const DATABASE_SCHEMA_TOOL_DEFINITION: ToolDefinition = {
  name: 'database.schema',
  version: '1.0.0',
  description: 'Reads database schema metadata from a read-only SQLite connection.',
  module: 'database-intelligence',
  inputSchema: connectionInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: DATABASE_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [
    {
      input: { dialect: 'sqlite', rootPath: '/repo', databasePath: 'data/app.db' },
      output: { tables: [] },
    },
  ],
};

export const DATABASE_RELATIONS_TOOL_DEFINITION: ToolDefinition = {
  name: 'database.relations',
  version: '1.0.0',
  description: 'Reads database foreign-key relations from a read-only SQLite connection.',
  module: 'database-intelligence',
  inputSchema: connectionInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: DATABASE_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [
    {
      input: { dialect: 'sqlite', rootPath: '/repo', databasePath: 'data/app.db' },
      output: { relations: [] },
    },
  ],
};

export const DATABASE_QUERY_PREVIEW_TOOL_DEFINITION: ToolDefinition = {
  name: 'database.query_preview',
  version: '1.0.0',
  description: 'Runs a read-only query preview with row limits.',
  module: 'database-intelligence',
  inputSchema: {
    type: 'object',
    required: ['connection', 'query'],
    additionalProperties: false,
    properties: {
      connection: connectionSchema,
      query: { type: 'string' },
      maxRows: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: DATABASE_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [
    {
      input: {
        connection: { dialect: 'sqlite', rootPath: '/repo', databasePath: 'data/app.db' },
        query: 'SELECT * FROM users',
        maxRows: 10,
      },
      output: { columns: [], rows: [] },
    },
  ],
};
