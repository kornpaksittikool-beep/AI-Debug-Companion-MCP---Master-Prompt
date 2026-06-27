import { Injectable } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistryService } from '../../registry/services/tool-registry.service.js';
import { McpExecutionService } from './mcp-execution.service.js';
import type { McpTransport } from '../interfaces/mcp-transport.interface.js';
import type { JsonSchemaObject } from '../../registry/interfaces/json-schema.interface.js';

@Injectable()
export class McpStdioServerService implements McpTransport {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly execution: McpExecutionService,
  ) {}

  async start(): Promise<void> {
    const server = new Server(
      {
        name: 'ai-engineering-platform',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: this.registry.list().map((tool): Tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as unknown as Tool['inputSchema'],
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const result = await this.execution.execute({
        toolName: request.params.name,
        input: this.toJsonSchemaObject(request.params.arguments),
      });

      if (!result.ok) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.error),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.output),
          },
        ],
      };
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
  }

  private toJsonSchemaObject(value: unknown): JsonSchemaObject {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonSchemaObject;
    }

    return {};
  }
}
