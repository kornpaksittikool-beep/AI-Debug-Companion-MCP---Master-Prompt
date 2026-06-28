import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION, type ToolPermission } from '../../../core/security/permission.interface.js';

const TELEMETRY_FILE_PERMISSION: ToolPermission = {
  fileSystem: {
    read: true,
    write: true,
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

export const INTEGRATION_START_SESSION_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.start_session',
  version: '1.0.0',
  description: 'Starts an in-memory integration telemetry session for a Codex or other MCP client workflow.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    required: ['client', 'workspaceRoot'],
    additionalProperties: false,
    properties: {
      client: { type: 'string', enum: ['codex', 'claude', 'cursor', 'custom'] },
      workspaceRoot: { type: 'string' },
      sessionId: { type: 'string' },
      startedAt: { type: 'string' },
      notes: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { client: 'codex', workspaceRoot: '/repo' }, output: { client: 'codex' } }],
};

export const INTEGRATION_RECORD_TOOL_USAGE_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.record_tool_usage',
  version: '1.0.0',
  description: 'Records one MCP tool usage event for adoption and token-saving telemetry.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    required: ['sessionId', 'toolName', 'status'],
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      toolName: { type: 'string' },
      status: { type: 'string', enum: ['success', 'failed'] },
      startedAt: { type: 'string' },
      executionTimeMs: { type: 'number' },
      estimatedInputTokens: { type: 'number' },
      estimatedOutputTokens: { type: 'number' },
      fallbackUsed: { type: 'boolean' },
      fallbackReason: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { sessionId: 's1', toolName: 'repository.overview', status: 'success' }, output: { toolName: 'repository.overview' } }],
};

export const INTEGRATION_READINESS_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.readiness',
  version: '1.0.0',
  description: 'Checks Codex MCP integration readiness from provided server, tool, and instruction evidence.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      configuredServerName: { type: 'string' },
      expectedTools: { type: 'array', items: { type: 'string' } },
      availableTools: { type: 'array', items: { type: 'string' } },
      agentsInstructionLoaded: { type: 'boolean' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { availableTools: ['platform.health'], agentsInstructionLoaded: true }, output: { ready: false } }],
};

export const INTEGRATION_TELEMETRY_SUMMARY_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.telemetry_summary',
  version: '1.0.0',
  description: 'Summarizes recorded MCP usage telemetry and estimated manual-read tokens avoided.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      rootPath: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { toolCalls: 0 } }],
};

export const INTEGRATION_FLUSH_TELEMETRY_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.flush_telemetry',
  version: '1.0.0',
  description: 'Persists in-memory integration telemetry under .ai-engineering-platform/integration-telemetry.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    required: ['rootPath'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: TELEMETRY_FILE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo' }, output: { recordsWritten: 1 } }],
};

export const INTEGRATION_WORKFLOW_INDEX_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.workflow_index',
  version: '1.0.0',
  description: 'Returns the MCP workflow index for routing task types to tools, modules, and files.',
  module: 'integration-telemetry',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      taskType: {
        type: 'string',
        enum: [
          'project_summary',
          'bug_investigation',
          'architecture_review',
          'phase_planning',
          'patch_execution',
          'token_optimization',
          'plugin_workflow',
          'database_analysis',
          'git_analysis',
        ],
      },
      query: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { taskType: 'bug_investigation' }, output: { entries: [] } }],
};

export const INTEGRATION_AUTO_TELEMETRY_SUMMARY_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.auto_telemetry_summary',
  version: '1.0.0',
  description: 'Summarizes automatically recorded MCP execution telemetry and estimated token usage.',
  module: 'integration-telemetry',
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
  examples: [{ input: {}, output: { toolCalls: 1, estimatedTotalTokens: 10 } }],
};

export const INTEGRATION_RESET_AUTO_TELEMETRY_TOOL_DEFINITION: ToolDefinition = {
  name: 'integration.reset_auto_telemetry',
  version: '1.0.0',
  description: 'Clears automatically recorded in-memory MCP execution telemetry.',
  module: 'integration-telemetry',
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
  sideEffects: 'write',
  examples: [{ input: {}, output: { clearedRecords: 1 } }],
};
