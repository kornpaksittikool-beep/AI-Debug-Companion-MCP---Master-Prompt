import type { ToolDefinition } from '../../core/registry/interfaces/tool-definition.interface.js';

export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly tools: readonly ToolDefinition[];
}
