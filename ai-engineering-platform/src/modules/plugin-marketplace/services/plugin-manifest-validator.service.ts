import { Injectable } from '@nestjs/common';
import type { ToolDefinition } from '../../../core/registry/interfaces/tool-definition.interface.js';
import type { PluginManifest } from '../../../plugins/plugin-api/plugin-manifest.interface.js';
import type {
  PluginManifestValidationIssue,
  PluginManifestValidationResult,
} from '../interfaces/plugin-marketplace.interface.js';

@Injectable()
export class PluginManifestValidatorService {
  validate(manifest: PluginManifest): PluginManifestValidationResult {
    const issues: PluginManifestValidationIssue[] = [];

    this.requireText(manifest.name, 'name', issues);
    this.requireText(manifest.version, 'version', issues);
    this.requireText(manifest.description, 'description', issues);

    if (!manifest.compatibility) {
      issues.push({
        field: 'compatibility',
        message: 'Plugin compatibility metadata is missing.',
        suggestion: 'Declare platformVersionRange and runtime before marketplace installation.',
      });
    } else {
      this.requireText(manifest.compatibility.platformVersionRange, 'compatibility.platformVersionRange', issues);
      if (!['node', 'python', 'external'].includes(manifest.compatibility.runtime)) {
        issues.push({
          field: 'compatibility.runtime',
          message: 'Plugin runtime is not supported.',
          suggestion: 'Use one of: node, python, external.',
        });
      }
    }

    const seenTools = new Set<string>();
    manifest.tools.forEach((tool, index) => this.validateTool(tool, index, seenTools, issues));

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private validateTool(
    tool: ToolDefinition,
    index: number,
    seenTools: Set<string>,
    issues: PluginManifestValidationIssue[],
  ): void {
    const prefix = `tools.${index}`;
    this.requireText(tool.name, `${prefix}.name`, issues);
    this.requireText(tool.version, `${prefix}.version`, issues);
    this.requireText(tool.description, `${prefix}.description`, issues);
    this.requireText(tool.module, `${prefix}.module`, issues);

    if (tool.name && seenTools.has(tool.name)) {
      issues.push({
        field: `${prefix}.name`,
        message: `Duplicate tool name "${tool.name}" in plugin manifest.`,
        suggestion: 'Tool names must be unique inside a plugin and across the platform registry.',
      });
    }
    if (tool.name) {
      seenTools.add(tool.name);
    }

    if (!tool.inputSchema || tool.inputSchema.type !== 'object') {
      issues.push({
        field: `${prefix}.inputSchema`,
        message: 'Tool input schema must be an object schema.',
        suggestion: 'Declare a JSON schema object for tool input.',
      });
    }

    if (!tool.outputSchema || tool.outputSchema.type !== 'object') {
      issues.push({
        field: `${prefix}.outputSchema`,
        message: 'Tool output schema must be an object schema.',
        suggestion: 'Declare a JSON schema object for tool output.',
      });
    }

    if (!tool.errorSchema || tool.errorSchema.type !== 'object') {
      issues.push({
        field: `${prefix}.errorSchema`,
        message: 'Tool error schema must be an object schema.',
        suggestion: 'Use the standard error schema or a compatible object schema.',
      });
    }

    if (!tool.permissions) {
      issues.push({
        field: `${prefix}.permissions`,
        message: 'Tool permissions are missing.',
        suggestion: 'Declare file system, command, git, database, and network permissions.',
      });
    }

    if (!tool.timeoutMs || tool.timeoutMs <= 0) {
      issues.push({
        field: `${prefix}.timeoutMs`,
        message: 'Tool timeout must be greater than zero.',
        suggestion: 'Set timeoutMs to a positive number.',
      });
    }

    if (!tool.retryStrategy || tool.retryStrategy.maxAttempts < 1) {
      issues.push({
        field: `${prefix}.retryStrategy`,
        message: 'Tool retry strategy must allow at least one attempt.',
        suggestion: 'Set maxAttempts to 1 when retries are disabled.',
      });
    }
  }

  private requireText(
    value: string | undefined,
    field: string,
    issues: PluginManifestValidationIssue[],
  ): void {
    if (!value?.trim()) {
      issues.push({
        field,
        message: `Plugin manifest field "${field}" is required.`,
        suggestion: `Provide a non-empty ${field} value.`,
      });
    }
  }
}
