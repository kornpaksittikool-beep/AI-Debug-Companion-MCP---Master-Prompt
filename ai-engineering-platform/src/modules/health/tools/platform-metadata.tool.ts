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
  description: 'Returns platform metadata and optionally registered tool details.',
  module: 'health',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      includeTools: {
        type: 'boolean',
        description: 'Include registered tool records. Defaults to true for backward compatibility.',
      },
      includeDescriptions: {
        type: 'boolean',
        description: 'Include tool descriptions when includeTools is true. Defaults to true.',
      },
      moduleFilter: {
        type: 'string',
        description: 'Limit tool metadata or summary to one module.',
      },
    },
  },
  outputSchema: {
    type: 'object',
    required: ['platform'],
    additionalProperties: false,
    properties: {
      platform: {
        type: 'object',
      },
      tools: {
        type: 'array',
      },
      toolSummary: {
        type: 'object',
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
          phase: 'phase-31-summary-project-profile-mode',
        },
        tools: [],
      },
    },
    {
      input: { includeTools: false },
      output: {
        platform: {
          name: 'ai-engineering-platform',
          version: '0.1.0',
          phase: 'phase-31-summary-project-profile-mode',
        },
        toolSummary: {
          platform: {
            name: 'ai-engineering-platform',
            version: '0.1.0',
            phase: 'phase-31-summary-project-profile-mode',
          },
          totalTools: 0,
          modules: [],
          recommendation:
            'Use platform.tool_summary for routing and call platform.metadata with includeTools=true only when full tool descriptions are required.',
        },
      },
    },
  ],
};

@Injectable()
export class PlatformMetadataTool implements ToolHandler {
  constructor(private readonly healthService: HealthService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(this.healthService.getMetadata(input) as unknown as JsonSchemaObject);
  }
}
