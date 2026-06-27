import type { ToolDefinition } from '../../core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../core/registry/interfaces/tool-handler.interface.js';
import type { PluginManifest } from './plugin-manifest.interface.js';

export interface PluginToolRegistration {
  readonly definition: ToolDefinition;
  readonly handler: ToolHandler;
}

export interface PlatformPlugin {
  getManifest(): PluginManifest;
  getTools(): readonly PluginToolRegistration[];
}
