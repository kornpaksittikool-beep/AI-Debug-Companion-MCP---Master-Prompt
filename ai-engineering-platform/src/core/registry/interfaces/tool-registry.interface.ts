import type { ToolDefinition } from './tool-definition.interface.js';
import type { ToolHandler } from './tool-handler.interface.js';

export interface RegisteredTool {
  readonly definition: ToolDefinition;
  readonly handler: ToolHandler;
}

export interface ToolRegistry {
  register(definition: ToolDefinition, handler: ToolHandler): void;
  get(name: string): RegisteredTool;
  list(): readonly ToolDefinition[];
}
