import type { ToolDefinition } from '../../core/registry/interfaces/tool-definition.interface.js';

export interface ExternalToolCommandPolicy {
  readonly command: string;
  readonly argsAllowList: readonly string[];
  readonly timeoutMs: number;
}

export interface ExternalToolPluginSdk {
  readonly sdkType: 'external-tool';
  readonly version: string;
  readonly tools: readonly ToolDefinition[];
  readonly commandPolicies: readonly ExternalToolCommandPolicy[];
}
