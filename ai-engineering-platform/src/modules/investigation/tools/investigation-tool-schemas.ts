import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';

const sessionSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

const createInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['input'],
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    input: { type: 'string' },
    problemType: {
      type: 'string',
      enum: ['error', 'stack_trace', 'log', 'screenshot', 'issue', 'feature_request', 'unknown'],
    },
  },
};

const sessionIdInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['sessionId'],
  additionalProperties: false,
  properties: {
    sessionId: { type: 'string' },
  },
};

export const INVESTIGATION_CREATE_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.create',
  version: '1.0.0',
  description: 'Creates an investigation session and classifies the initial problem input.',
  module: 'investigation',
  inputSchema: createInputSchema,
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [
    {
      input: { input: 'TypeError: Cannot read properties of undefined' },
      output: { id: 'inv_example', status: 'open', problemType: 'error' },
    },
  ],
};

export const INVESTIGATION_ADD_EVIDENCE_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.add_evidence',
  version: '1.0.0',
  description: 'Adds traceable evidence to an open investigation session.',
  module: 'investigation',
  inputSchema: {
    type: 'object',
    required: ['sessionId', 'sourceType', 'source', 'summary'],
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      sourceType: {
        type: 'string',
        enum: [
          'user_input',
          'file',
          'log',
          'stack_trace',
          'test_result',
          'build_result',
          'api_contract',
          'database_schema',
          'git_history',
          'other',
        ],
      },
      source: { type: 'string' },
      summary: { type: 'string' },
      detail: { type: 'string' },
      metadata: { type: 'object' },
    },
  },
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [
    {
      input: {
        sessionId: 'inv_example',
        sourceType: 'user_input',
        source: 'user message',
        summary: 'User reported a runtime error.',
      },
      output: { id: 'inv_example', evidence: [] },
    },
  ],
};

export const INVESTIGATION_ADD_HYPOTHESIS_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.add_hypothesis',
  version: '1.0.0',
  description: 'Adds a confidence-scored hypothesis to an open investigation session.',
  module: 'investigation',
  inputSchema: {
    type: 'object',
    required: ['sessionId', 'statement', 'confidence'],
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      statement: { type: 'string' },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      evidenceIds: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [
    {
      input: {
        sessionId: 'inv_example',
        statement: 'The bug is likely caused by missing null validation.',
        confidence: 'medium',
      },
      output: { id: 'inv_example', hypotheses: [] },
    },
  ],
};

export const INVESTIGATION_RECORD_VISIT_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.record_visit',
  version: '1.0.0',
  description: 'Records a visited resource during investigation.',
  module: 'investigation',
  inputSchema: {
    type: 'object',
    required: ['sessionId', 'type', 'reference', 'reason'],
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      type: { type: 'string', enum: ['file', 'api', 'database_table', 'log', 'command', 'url'] },
      reference: { type: 'string' },
      reason: { type: 'string' },
    },
  },
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [
    {
      input: {
        sessionId: 'inv_example',
        type: 'file',
        reference: 'src/example.ts',
        reason: 'Check related logic.',
      },
      output: { id: 'inv_example', visitedResources: [] },
    },
  ],
};

export const INVESTIGATION_SUMMARIZE_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.summarize',
  version: '1.0.0',
  description: 'Returns the current investigation session state.',
  module: 'investigation',
  inputSchema: sessionIdInputSchema,
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { sessionId: 'inv_example' }, output: { id: 'inv_example' } }],
};

export const INVESTIGATION_CLOSE_TOOL_DEFINITION: ToolDefinition = {
  name: 'investigation.close',
  version: '1.0.0',
  description: 'Closes an investigation with a conclusion backed by evidence.',
  module: 'investigation',
  inputSchema: {
    type: 'object',
    required: ['sessionId', 'summary'],
    additionalProperties: false,
    properties: {
      sessionId: { type: 'string' },
      summary: { type: 'string' },
      rootCause: { type: 'string' },
      evidenceIds: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: sessionSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [
    {
      input: {
        sessionId: 'inv_example',
        summary: 'Root cause confirmed with traceable evidence.',
      },
      output: { id: 'inv_example', status: 'closed' },
    },
  ],
};

export const INVESTIGATION_TOOL_DEFINITIONS = [
  INVESTIGATION_CREATE_TOOL_DEFINITION,
  INVESTIGATION_ADD_EVIDENCE_TOOL_DEFINITION,
  INVESTIGATION_ADD_HYPOTHESIS_TOOL_DEFINITION,
  INVESTIGATION_RECORD_VISIT_TOOL_DEFINITION,
  INVESTIGATION_SUMMARIZE_TOOL_DEFINITION,
  INVESTIGATION_CLOSE_TOOL_DEFINITION,
] as const;
