import { Injectable } from '@nestjs/common';
import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';
import { HealthService } from '../services/health.service.js';

export const PLATFORM_METADATA_TOOL_DEFINITION: ToolDefinition = {
  name: 'platform.metadata',
  version: '1.0.0',
  description: 'Returns platform version, phase, enabled modules, and registered tool names.',
  module: 'health',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: {
    type: 'object',
    required: ['platform', 'tools'],
    additionalProperties: false,
    properties: {
      platform: {
        type: 'object',
      },
      tools: {
        type: 'array',
      },
    },
  },
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'none',
  examples: [
    {
      input: {},
      output: {
        platform: {
          name: 'ai-engineering-platform',
          version: '0.1.0',
          phase: 'phase-20-durable-telemetry-workflow-index',
        },
        tools: [],
      },
    },
  ],
};

@Injectable()
export class PlatformMetadataTool implements ToolHandler {
  constructor(private readonly healthService: HealthService) {}

  execute(): Promise<JsonSchemaObject> {
    return Promise.resolve(this.healthService.getMetadata() as unknown as JsonSchemaObject);
  }
}
