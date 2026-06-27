import { Injectable } from '@nestjs/common';
import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';
import { HealthService } from '../services/health.service.js';

export const HEALTH_TOOL_DEFINITION: ToolDefinition = {
  name: 'platform.health',
  version: '1.0.0',
  description: 'Returns platform health and readiness information.',
  module: 'health',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: {
    type: 'object',
    required: ['status', 'timestamp'],
    additionalProperties: false,
    properties: {
      status: {
        type: 'string',
        enum: ['ok', 'degraded', 'unavailable'],
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
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
        status: 'ok',
        timestamp: '2026-06-27T00:00:00.000Z',
      },
    },
  ],
};

@Injectable()
export class HealthTool implements ToolHandler {
  constructor(private readonly healthService: HealthService) {}

  execute(): Promise<JsonSchemaObject> {
    return Promise.resolve(this.healthService.getHealth() as unknown as JsonSchemaObject);
  }
}
