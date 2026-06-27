import type { ToolDefinition } from '../../core/registry/interfaces/tool-definition.interface.js';

export type PluginRuntimeKind = 'node' | 'python' | 'external';

export interface PluginCompatibility {
  readonly platformVersionRange: string;
  readonly nodeVersionRange?: string;
  readonly runtime: PluginRuntimeKind;
}

export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly compatibility?: PluginCompatibility;
  readonly tools: readonly ToolDefinition[];
}
