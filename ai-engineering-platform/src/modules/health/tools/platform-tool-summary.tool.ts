import { Injectable } from '@nestjs/common';
import { STANDARD_ERROR_SCHEMA } from '../../../core/errors/error-envelope.interface.js';
import { NO_RETRY } from '../../../core/registry/interfaces/retry-strategy.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import { NO_PERMISSION } from '../../../core/security/permission.interface.js';
import { HealthService } from '../services/health.service.js';

export const PLATFORM_TOOL_SUMMARY_TOOL_DEFINITION: ToolDefinition = {
  name: 'platform.tool_summary',
  version: '1.0.0',
  description: 'Returns a compact registered tool summary grouped by module for low-token routing.',
  module: 'health',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      moduleFilter: {
        type: 'string',
        description: 'Limit the compact summary to one module.',
      },
    },
  },
  outputSchema: {
    type: 'object',
    required: ['platform', 'totalTools', 'modules', 'recommendation'],
    additionalProperties: false,
    properties: {
      platform: {
        type: 'object',
      },
      totalTools: {
        type: 'number',
      },
      modules: {
        type: 'array',
      },
      recommendation: {
        type: 'string',
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
          phase: 'phase-34-skip-tool-summary-for-summaries',
        },
        totalTools: 0,
        modules: [],
        recommendation:
          'Use platform.tool_summary for routing and call platform.metadata with includeTools=true only when full tool descriptions are required.',
      },
    },
  ],
};

@Injectable()
export class PlatformToolSummaryTool implements ToolHandler {
  constructor(private readonly healthService: HealthService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const moduleFilter = typeof input.moduleFilter === 'string' ? input.moduleFilter : undefined;
    return Promise.resolve(this.healthService.getToolSummary(moduleFilter) as unknown as JsonSchemaObject);
  }
}
