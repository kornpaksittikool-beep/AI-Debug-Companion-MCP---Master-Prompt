import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const PLANNING_READ_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: false,
    allowedRoots: ['provided-rootPath'],
  },
  commands: {
    execute: true,
    allowList: ['git log'],
  },
  git: {
    read: true,
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

const databaseConnectionSchema: JsonSchemaObject = {
  type: 'object',
  required: ['dialect', 'databasePath', 'rootPath'],
  additionalProperties: false,
  properties: {
    dialect: { type: 'string', enum: ['sqlite'] },
    databasePath: { type: 'string' },
    rootPath: { type: 'string' },
  },
};

const createPlanInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['objective'],
  additionalProperties: false,
  properties: {
    objective: { type: 'string' },
    rootPath: { type: 'string' },
    investigationSessionId: { type: 'string' },
    level: {
      type: 'string',
      enum: ['quick_fix', 'normal_fix', 'refactor', 'architecture_change'],
    },
    targetFiles: { type: 'array', items: { type: 'string' } },
    targetSymbols: { type: 'array', items: { type: 'string' } },
    databaseConnection: databaseConnectionSchema,
  },
};

const impactReportInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['objective'],
  additionalProperties: false,
  properties: {
    objective: { type: 'string' },
    rootPath: { type: 'string' },
    planId: { type: 'string' },
    targetFiles: { type: 'array', items: { type: 'string' } },
    targetSymbols: { type: 'array', items: { type: 'string' } },
    databaseConnection: databaseConnectionSchema,
    maxGitCommits: { type: 'number' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const PLANNING_CREATE_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'planning.create_plan',
  version: '1.0.0',
  description: 'Creates a read-only engineering plan with evidence, risk, rollback, and verification strategy.',
  module: 'planning-impact',
  inputSchema: createPlanInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLANNING_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { objective: 'Fix failing login test', rootPath: '/repo' }, output: { status: 'draft' } }],
};

export const PLANNING_IMPACT_REPORT_TOOL_DEFINITION: ToolDefinition = {
  name: 'planning.impact_report',
  version: '1.0.0',
  description: 'Generates a read-only impact report from plan, repository, symbol, database, and git evidence.',
  module: 'planning-impact',
  inputSchema: impactReportInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLANNING_READ_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { objective: 'Assess payment change', rootPath: '/repo' }, output: { areas: [] } }],
};

export const PLANNING_APPROVAL_GATE_TOOL_DEFINITION: ToolDefinition = {
  name: 'planning.approval_gate',
  version: '1.0.0',
  description: 'Updates the approval state for a generated engineering plan without applying patches.',
  module: 'planning-impact',
  inputSchema: {
    type: 'object',
    required: ['planId', 'decision'],
    additionalProperties: false,
    properties: {
      planId: { type: 'string' },
      decision: { type: 'string', enum: ['request_approval', 'approve', 'reject'] },
      reason: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLANNING_READ_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { planId: 'plan_123', decision: 'request_approval' }, output: { status: 'pending_approval' } }],
};

export const PLANNING_SUMMARIZE_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'planning.summarize_plan',
  version: '1.0.0',
  description: 'Returns a generated engineering plan by ID.',
  module: 'planning-impact',
  inputSchema: {
    type: 'object',
    required: ['planId'],
    additionalProperties: false,
    properties: {
      planId: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLANNING_READ_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { planId: 'plan_123' }, output: { id: 'plan_123' } }],
};
