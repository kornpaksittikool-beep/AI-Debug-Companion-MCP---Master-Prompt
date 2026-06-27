import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { PathPolicyService } from '../../../core/security/path-policy.service.js';
import type {
  PluginInventoryResult,
  PluginLifecycleExecutionResult,
  PluginStateRecord,
} from '../interfaces/plugin-marketplace.interface.js';

interface PluginStateFile {
  readonly version: number;
  readonly plugins: readonly PluginStateRecord[];
  readonly lifecycleResults: readonly PluginLifecycleExecutionResult[];
}

interface PluginStatePaths {
  readonly rootPath: string;
  readonly pluginDir: string;
  readonly statePath: string;
}

@Injectable()
export class PluginStateStoreService {
  constructor(private readonly pathPolicy: PathPolicyService) {}

  async inventory(rootPath: string): Promise<PluginInventoryResult> {
    const paths = this.resolvePaths(rootPath);
    const state = await this.readState(paths);
    return {
      rootPath: paths.rootPath,
      plugins: state.plugins,
      lifecycleResults: state.lifecycleResults,
    };
  }

  async findLifecycleResult(rootPath: string, lifecycleId: string): Promise<PluginLifecycleExecutionResult> {
    const state = await this.readState(this.resolvePaths(rootPath));
    const result = state.lifecycleResults.find((item) => item.lifecycleId === lifecycleId);
    if (!result) {
      throw new PlatformError({
        code: 'PLUGIN_LIFECYCLE_RESULT_NOT_FOUND',
        message: `Plugin lifecycle result "${lifecycleId}" was not found.`,
        reason: 'The requested lifecycle result does not exist in the local plugin state.',
        suggestion: 'Call plugin.inventory to inspect available lifecycle result IDs.',
      });
    }
    return result;
  }

  async applyResult(rootPath: string, result: PluginLifecycleExecutionResult): Promise<PluginLifecycleExecutionResult> {
    const paths = this.resolvePaths(rootPath);
    const state = await this.readState(paths);
    const plugins = new Map(state.plugins.map((plugin) => [plugin.name, plugin]));

    if (result.nextState) {
      plugins.set(result.nextState.name, result.nextState);
    }

    const nextState: PluginStateFile = {
      version: state.version + 1,
      plugins: [...plugins.values()].sort((a, b) => a.name.localeCompare(b.name)),
      lifecycleResults: [...state.lifecycleResults, result],
    };

    await fs.mkdir(paths.pluginDir, { recursive: true });
    await fs.writeFile(paths.statePath, JSON.stringify(nextState, null, 2), 'utf8');
    return result;
  }

  async findPlugin(rootPath: string, pluginName: string): Promise<PluginStateRecord | undefined> {
    const state = await this.readState(this.resolvePaths(rootPath));
    return state.plugins.find((plugin) => plugin.name === pluginName);
  }

  private async readState(paths: PluginStatePaths): Promise<PluginStateFile> {
    try {
      const content = await fs.readFile(paths.statePath, 'utf8');
      return JSON.parse(content) as PluginStateFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { version: 1, plugins: [], lifecycleResults: [] };
      }
      throw error;
    }
  }

  private resolvePaths(rootPath: string): PluginStatePaths {
    const resolvedRoot = path.resolve(rootPath);
    const pluginDir = path.resolve(resolvedRoot, '.ai-engineering-platform', 'plugins');
    const statePath = path.resolve(pluginDir, 'state.json');

    if (!this.pathPolicy.isPathInsideRoot(pluginDir, resolvedRoot) || !this.pathPolicy.isPathInsideRoot(statePath, resolvedRoot)) {
      throw new PlatformError({
        code: 'INVALID_PLUGIN_STATE_PATH',
        message: 'Plugin state path is outside the project root.',
        reason: 'Plugin state must be stored below .ai-engineering-platform/plugins inside the project root.',
        suggestion: 'Provide a valid project root path.',
      });
    }

    return {
      rootPath: resolvedRoot,
      pluginDir,
      statePath,
    };
  }
}
