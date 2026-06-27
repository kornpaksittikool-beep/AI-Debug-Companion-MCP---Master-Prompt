import { Injectable } from '@nestjs/common';
import { STANDARD_ERROR_SCHEMA } from '../../core/errors/error-envelope.interface.js';
import type { JsonSchemaObject } from '../../core/registry/interfaces/json-schema.interface.js';
import { NO_RETRY } from '../../core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../core/registry/interfaces/tool-handler.interface.js';
import { NO_PERMISSION } from '../../core/security/permission.interface.js';
import type { PlatformPlugin, PluginToolRegistration } from '../plugin-api/plugin.interface.js';
import type { PluginManifest } from '../plugin-api/plugin-manifest.interface.js';

export const EXAMPLE_PLUGIN_TOOL_DEFINITION: ToolDefinition = {
  name: 'example.echo',
  version: '1.0.0',
  description: 'Echoes the provided message to validate plugin tool registration.',
  module: 'example-plugin',
  inputSchema: {
    type: 'object',
    required: ['message'],
    additionalProperties: false,
    properties: {
      message: {
        type: 'string',
      },
    },
  },
  outputSchema: {
    type: 'object',
    required: ['message'],
    additionalProperties: false,
    properties: {
      message: {
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
      input: {
        message: 'hello',
      },
      output: {
        message: 'hello',
      },
    },
  ],
};

@Injectable()
export class ExampleEchoTool implements ToolHandler {
  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const message = input.message;
    return Promise.resolve({
      message: typeof message === 'string' ? message : '',
    });
  }
}

@Injectable()
export class ExamplePluginService implements PlatformPlugin {
  constructor(private readonly echoTool: ExampleEchoTool) {}

  getManifest(): PluginManifest {
    return {
      name: 'example-plugin',
      version: '1.0.0',
      description: 'Example plugin used to validate registry-based plugin registration.',
      tools: [EXAMPLE_PLUGIN_TOOL_DEFINITION],
    };
  }

  getTools(): readonly PluginToolRegistration[] {
    return [
      {
        definition: EXAMPLE_PLUGIN_TOOL_DEFINITION,
        handler: this.echoTool,
      },
    ];
  }
}
