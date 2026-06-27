import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../errors/platform-error.js';
import type { ToolDefinition } from '../interfaces/tool-definition.interface.js';
import type { RegisteredTool, ToolRegistry } from '../interfaces/tool-registry.interface.js';
import type { ToolHandler } from '../interfaces/tool-handler.interface.js';

@Injectable()
export class ToolRegistryService implements ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.validateDefinition(definition);

    if (this.tools.has(definition.name)) {
      throw new PlatformError({
        code: 'TOOL_ALREADY_REGISTERED',
        message: `Tool "${definition.name}" is already registered.`,
        reason: 'Tool names must be unique across built-in modules and plugins.',
        suggestion: 'Rename the tool or remove the duplicate registration.',
      });
    }

    this.tools.set(definition.name, { definition, handler });
  }

  get(name: string): RegisteredTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new PlatformError({
        code: 'TOOL_NOT_FOUND',
        message: `Tool "${name}" is not registered.`,
        reason: 'The registry could not resolve a handler for the requested tool.',
        suggestion: 'Call platform.metadata to inspect registered tools.',
      });
    }

    return tool;
  }

  list(): readonly ToolDefinition[] {
    return [...this.tools.values()].map((tool) => tool.definition);
  }

  private validateDefinition(definition: ToolDefinition): void {
    const requiredStringFields = [
      ['name', definition.name],
      ['version', definition.version],
      ['description', definition.description],
      ['module', definition.module],
    ] as const;

    for (const [field, value] of requiredStringFields) {
      if (!value.trim()) {
        throw new PlatformError({
          code: 'INVALID_TOOL_DEFINITION',
          message: `Tool definition field "${field}" is required.`,
          reason: 'A tool contract is incomplete.',
          suggestion: 'Provide all required tool metadata before registration.',
        });
      }
    }

    if (definition.timeoutMs <= 0) {
      throw new PlatformError({
        code: 'INVALID_TOOL_TIMEOUT',
        message: `Tool "${definition.name}" has an invalid timeout.`,
        reason: 'Tool timeout must be greater than zero.',
        suggestion: 'Set timeoutMs to a positive number.',
      });
    }

    if (definition.retryStrategy.maxAttempts < 1) {
      throw new PlatformError({
        code: 'INVALID_RETRY_STRATEGY',
        message: `Tool "${definition.name}" has an invalid retry strategy.`,
        reason: 'Retry maxAttempts must be at least one.',
        suggestion: 'Set maxAttempts to 1 when retries are disabled.',
      });
    }
  }
}
