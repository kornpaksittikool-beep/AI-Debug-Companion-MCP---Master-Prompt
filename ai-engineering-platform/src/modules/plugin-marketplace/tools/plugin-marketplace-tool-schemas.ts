import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolPermission } from '../../../core/security/permission.interface.js';

const PLUGIN_MARKETPLACE_PERMISSION: ToolPermission = {
  fileSystem: {
    read: false,
    write: false,
    allowedRoots: [],
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

const manifestSchema: JsonSchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    description: { type: 'string' },
    compatibility: { type: 'object', additionalProperties: true, properties: {} },
    tools: { type: 'array', items: { type: 'object', additionalProperties: true, properties: {} } },
  },
};

const lifecycleInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['manifest'],
  additionalProperties: false,
  properties: {
    manifest: manifestSchema,
    targetVersion: { type: 'string' },
    reason: { type: 'string' },
  },
};

const lifecycleExecutionInputSchema: JsonSchemaObject = {
  type: 'object',
  required: ['rootPath', 'manifest'],
  additionalProperties: false,
  properties: {
    rootPath: { type: 'string' },
    manifest: manifestSchema,
    targetVersion: { type: 'string' },
    reason: { type: 'string' },
    acknowledgeBroadPermissions: { type: 'boolean' },
  },
};

export const PLUGIN_CATALOG_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.catalog',
  version: '1.0.0',
  description: 'Returns marketplace-ready metadata for bundled and known plugins.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { plugins: [] } }],
};

export const PLUGIN_VALIDATE_MANIFEST_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.validate_manifest',
  version: '1.0.0',
  description: 'Validates plugin manifest metadata, compatibility, tools, schemas, permissions, timeout, and retry strategy.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    required: ['manifest'],
    additionalProperties: false,
    properties: {
      manifest: manifestSchema,
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] } }, output: { valid: false } }],
};

export const PLUGIN_RESOLVE_COMPATIBILITY_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.resolve_compatibility',
  version: '1.0.0',
  description: 'Resolves plugin platform, Node.js, and runtime compatibility from manifest metadata.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    required: ['manifest'],
    additionalProperties: false,
    properties: {
      manifest: manifestSchema,
      platformVersion: { type: 'string' },
      nodeVersion: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] } }, output: { compatible: false } }],
};

export const PLUGIN_INSTALL_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.install_plan',
  version: '1.0.0',
  description: 'Creates a reviewable plugin installation plan without installing or executing plugin code.',
  module: 'plugin-marketplace',
  inputSchema: lifecycleInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] } }, output: { status: 'requires_approval' } }],
};

export const PLUGIN_REMOVE_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.remove_plan',
  version: '1.0.0',
  description: 'Creates a reviewable plugin removal plan without disabling plugin code.',
  module: 'plugin-marketplace',
  inputSchema: lifecycleInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] } }, output: { status: 'requires_approval' } }],
};

export const PLUGIN_UPDATE_PLAN_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.update_plan',
  version: '1.0.0',
  description: 'Creates a reviewable plugin update plan without replacing plugin code.',
  module: 'plugin-marketplace',
  inputSchema: lifecycleInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] }, targetVersion: '1.1.0' }, output: { status: 'requires_approval' } }],
};

export const PLUGIN_SDK_METADATA_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.sdk_metadata',
  version: '1.0.0',
  description: 'Returns language plugin and external tool plugin SDK metadata.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: {}, output: { languagePluginSdk: { version: '1.0.0' } } }],
};

export const PLUGIN_INVENTORY_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.inventory',
  version: '1.0.0',
  description: 'Returns local plugin state inventory and lifecycle execution history.',
  module: 'plugin-marketplace',
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
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo' }, output: { plugins: [] } }],
};

export const PLUGIN_ENABLE_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.enable',
  version: '1.0.0',
  description: 'Enables a local plugin manifest in plugin state metadata after validation and compatibility checks.',
  module: 'plugin-marketplace',
  inputSchema: lifecycleExecutionInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo', manifest: { name: 'example', version: '1.0.0', description: 'Example.', tools: [] } }, output: { status: 'completed' } }],
};

export const PLUGIN_DISABLE_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.disable',
  version: '1.0.0',
  description: 'Disables a local plugin in plugin state metadata without deleting plugin files.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'pluginName'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      pluginName: { type: 'string' },
      reason: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo', pluginName: 'example' }, output: { status: 'completed' } }],
};

export const PLUGIN_STAGE_UPDATE_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.stage_update',
  version: '1.0.0',
  description: 'Stages a local plugin update in plugin state metadata after validation and compatibility checks.',
  module: 'plugin-marketplace',
  inputSchema: lifecycleExecutionInputSchema,
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 5000,
  retryStrategy: NO_RETRY,
  sideEffects: 'write',
  examples: [{ input: { rootPath: '/repo', manifest: { name: 'example', version: '1.1.0', description: 'Example.', tools: [] } }, output: { status: 'completed' } }],
};

export const PLUGIN_LIFECYCLE_RESULT_TOOL_DEFINITION: ToolDefinition = {
  name: 'plugin.lifecycle_result',
  version: '1.0.0',
  description: 'Returns a stored plugin lifecycle execution result by ID.',
  module: 'plugin-marketplace',
  inputSchema: {
    type: 'object',
    required: ['rootPath', 'lifecycleId'],
    additionalProperties: false,
    properties: {
      rootPath: { type: 'string' },
      lifecycleId: { type: 'string' },
    },
  },
  outputSchema: resultObjectSchema,
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: PLUGIN_MARKETPLACE_PERMISSION,
  timeoutMs: 3000,
  retryStrategy: NO_RETRY,
  sideEffects: 'read',
  examples: [{ input: { rootPath: '/repo', lifecycleId: 'plugin_lifecycle_enable_123' }, output: { status: 'completed' } }],
};
