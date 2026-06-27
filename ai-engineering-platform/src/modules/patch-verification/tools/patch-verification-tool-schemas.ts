import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const PATCH_VERIFICATION_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: false,
    allowedRoots: ['provided-rootPath'],
  },
  commands: {
    execute: true,
    allowList: [
      'pnpm.cmd build',
      'pnpm.cmd lint',
      'pnpm.cmd test',
      'pnpm.cmd test:integration',
      'pnpm.cmd test:cov',
    ],
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

const PATCH_APPLY_PERMISSION: ToolPermission = {
  ...PATCH_VERIFICATION_PERMISSION,
  fileSystem: {
    read: true,
    write: true,
    allowedRoots: ['proposal-rootPath'],
  },
};

const patchChangeSchema: JsonSchemaObject = {
  type: 'object',
  required: ['operation', 'filePath', 'summary'],
  additionalProperties: false,
  properties: {
    operation: { type: 'string', enum: ['create', 'update', 'delete'] },
    filePath: { type: 'string' },
    summary: { type: 'string' },
    proposedContent: { type: 'string' },
  },
};

const resultObjectSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

export const PATCH_CREATE_PROPOSAL_TOOL_DEFINITION: ToolDefinition = {
  name: 'patch.create_proposal',
  version: '1.0.0',
  description: 'Creates a reviewable patch proposal from an approved plan without modifying files.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['planId', 'rootPath', 'changes'],
    additionalProperties: false,
    properties: {
      planId: { type: 'string' },
      rootPath: { type: 'string' },
      changes: { type: 'array', items: patchChangeSchema },
      verificationCommands: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_VERIFICATION_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { planId: 'plan_123', rootPath: '/repo', changes: [] }, output: { status: 'ready_for_review' } }],
};

export const PATCH_SUMMARIZE_PROPOSAL_TOOL_DEFINITION: ToolDefinition = {
  name: 'patch.summarize_proposal',
  version: '1.0.0',
  description: 'Returns a patch proposal by ID.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['proposalId'],
    additionalProperties: false,
    properties: { proposalId: { type: 'string' } },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_VERIFICATION_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { proposalId: 'patch_123' }, output: { id: 'patch_123' } }],
};

export const PATCH_ROLLBACK_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'patch.rollback_plan',
  version: '1.0.0',
  description: 'Returns the rollback plan for a patch proposal.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['proposalId'],
    additionalProperties: false,
    properties: { proposalId: { type: 'string' } },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_VERIFICATION_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { proposalId: 'patch_123' }, output: { steps: [] } }],
};

export const PATCH_APPLY_PROPOSAL_TOOL_DEFINITION: ToolDefinition = {
  name: 'patch.apply_proposal',
  version: '1.0.0',
  description: 'Applies an approved patch proposal using deterministic whole-file operations with rollback snapshots.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['proposalId'],
    additionalProperties: false,
    properties: {
      proposalId: { type: 'string' },
      runVerification: { type: 'boolean' },
      rollbackOnFailure: { type: 'boolean' },
      verificationTimeoutMs: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_APPLY_PERMISSION,
  timeoutMs: 120000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { proposalId: 'patch_123', runVerification: true }, output: { status: 'applied' } }],
};

export const PATCH_ROLLBACK_APPLY_TOOL_DEFINITION: ToolDefinition = {
  name: 'patch.rollback_apply',
  version: '1.0.0',
  description: 'Rolls back a patch apply run using captured pre-apply snapshots.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['applyRunId'],
    additionalProperties: false,
    properties: {
      applyRunId: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_APPLY_PERMISSION,
  timeoutMs: 30000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { applyRunId: 'apply_123' }, output: { status: 'rolled_back' } }],
};

export const VERIFICATION_RUN_CHECK_TOOL_DEFINITION: ToolDefinition = {
  name: 'verification.run_check',
  version: '1.0.0',
  description: 'Runs an allow-listed verification command and records the result.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'command'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      command: {
        type: 'string',
        enum: ['pnpm.cmd build', 'pnpm.cmd lint', 'pnpm.cmd test', 'pnpm.cmd test:integration', 'pnpm.cmd test:cov'],
      },
      timeoutMs: { type: 'number' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_VERIFICATION_PERMISSION,
  timeoutMs: 120000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', command: 'pnpm.cmd build' }, output: { status: 'passed' } }],
};

export const VERIFICATION_SUMMARIZE_RESULT_TOOL_DEFINITION: ToolDefinition = {
  name: 'verification.summarize_result',
  version: '1.0.0',
  description: 'Returns a recorded verification result by ID.',
  module: 'patch-verification',
  inputSchema: {
    type: 'object',
    required: ['resultId'],
    additionalProperties: false,
    properties: { resultId: { type: 'string' } },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PATCH_VERIFICATION_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { resultId: 'verify_123' }, output: { id: 'verify_123' } }],
};
