import { Injectable } from '@nestjs/common';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  PluginDisableInput,
  PluginInventoryInput,
  PluginInventoryResult,
  PluginLifecycleExecutionInput,
  PluginLifecycleExecutionResult,
  PluginLifecycleResultInput,
  PluginStateRecord,
} from '../interfaces/plugin-marketplace.interface.js';
import { PluginManifestValidatorService } from './plugin-manifest-validator.service.js';
import { PluginStateStoreService } from './plugin-state-store.service.js';

@Injectable()
export class PluginLifecycleExecutorService {
  constructor(
    private readonly stateStore: PluginStateStoreService,
    private readonly validator: PluginManifestValidatorService,
  ) {}

  inventory(input: PluginInventoryInput): Promise<PluginInventoryResult> {
    return this.stateStore.inventory(input.rootPath);
  }

  lifecycleResult(input: PluginLifecycleResultInput): Promise<PluginLifecycleExecutionResult> {
    return this.stateStore.findLifecycleResult(input.rootPath, input.lifecycleId);
  }

  async enable(input: PluginLifecycleExecutionInput): Promise<PluginLifecycleExecutionResult> {
    const validation = this.validator.validate(input.manifest);
    const previousState = await this.stateStore.findPlugin(input.rootPath, input.manifest.name);
    const rejectedReason = this.rejectionReason(validation.valid, this.hasBroadPermissions(input.manifest.tools), input.acknowledgeBroadPermissions);
    if (rejectedReason) {
      return this.stateStore.applyResult(
        input.rootPath,
        this.reject('enable', input.manifest.name, rejectedReason, validation, previousState),
      );
    }

    const nextState = this.createState(input.manifest, 'enabled');
    return this.stateStore.applyResult(
      input.rootPath,
      this.complete('enable', input.manifest.name, previousState, nextState, validation),
    );
  }

  async disable(input: PluginDisableInput): Promise<PluginLifecycleExecutionResult> {
    const previousState = await this.stateStore.findPlugin(input.rootPath, input.pluginName);
    if (!previousState) {
      return this.stateStore.applyResult(
        input.rootPath,
        this.reject('disable', input.pluginName, 'Plugin is not enabled or staged in local state.'),
      );
    }
    const nextState: PluginStateRecord = {
      ...previousState,
      state: 'disabled',
      updatedAt: new Date().toISOString(),
    };
    return this.stateStore.applyResult(
      input.rootPath,
      this.complete('disable', input.pluginName, previousState, nextState),
    );
  }

  async stageUpdate(input: PluginLifecycleExecutionInput): Promise<PluginLifecycleExecutionResult> {
    const validation = this.validator.validate(input.manifest);
    const previousState = await this.stateStore.findPlugin(input.rootPath, input.manifest.name);
    const rejectedReason = this.rejectionReason(validation.valid, this.hasBroadPermissions(input.manifest.tools), input.acknowledgeBroadPermissions);
    if (rejectedReason) {
      return this.stateStore.applyResult(
        input.rootPath,
        this.reject('stage_update', input.manifest.name, rejectedReason, validation, previousState),
      );
    }

    const nextState = this.createState(input.manifest, 'staged_update');
    return this.stateStore.applyResult(
      input.rootPath,
      this.complete('stage_update', input.manifest.name, previousState, nextState, validation),
    );
  }

  private rejectionReason(
    valid: boolean,
    hasBroadPermissions: boolean,
    acknowledged: boolean | undefined,
  ): string | undefined {
    if (!valid) {
      return 'Plugin manifest validation failed.';
    }
    if (hasBroadPermissions && !acknowledged) {
      return 'Plugin declares broad permissions and requires explicit acknowledgement.';
    }
    return undefined;
  }

  private hasBroadPermissions(tools: PluginLifecycleExecutionInput['manifest']['tools']): boolean {
    return tools.some((tool) => {
      const permissions = tool.permissions;
      return (
        permissions.commands.execute ||
        permissions.network.enabled ||
        permissions.git.write ||
        permissions.database.write ||
        permissions.fileSystem.write
      );
    });
  }

  private createState(
    manifest: PluginLifecycleExecutionInput['manifest'],
    state: PluginStateRecord['state'],
  ): PluginStateRecord {
    return {
      name: manifest.name,
      version: manifest.version,
      state,
      manifest,
      updatedAt: new Date().toISOString(),
    };
  }

  private complete(
    action: PluginLifecycleExecutionResult['action'],
    pluginName: string,
    previousState?: PluginStateRecord,
    nextState?: PluginStateRecord,
    validation?: PluginLifecycleExecutionResult['validation'],
  ): PluginLifecycleExecutionResult {
    return {
      lifecycleId: this.createId(action),
      action,
      pluginName,
      status: 'completed',
      reason: 'Lifecycle state update completed in local plugin metadata.',
      ...(previousState ? { previousState } : {}),
      ...(nextState ? { nextState } : {}),
      ...(validation ? { validation } : {}),
      rollbackPlan: this.rollbackFor(action, pluginName, previousState),
      verificationPlan: this.verificationPlan(),
      createdAt: new Date().toISOString(),
    };
  }

  private reject(
    action: PluginLifecycleExecutionResult['action'],
    pluginName: string,
    reason: string,
    validation?: PluginLifecycleExecutionResult['validation'],
    previousState?: PluginStateRecord,
  ): PluginLifecycleExecutionResult {
    return {
      lifecycleId: this.createId(action),
      action,
      pluginName,
      status: 'rejected',
      reason,
      ...(previousState ? { previousState } : {}),
      ...(validation ? { validation } : {}),
      rollbackPlan: ['No state mutation was performed.'],
      verificationPlan: this.verificationPlan(),
      createdAt: new Date().toISOString(),
    };
  }

  private rollbackFor(
    action: PluginLifecycleExecutionResult['action'],
    pluginName: string,
    previousState?: PluginStateRecord,
  ): readonly string[] {
    if (previousState) {
      return [`Restore ${pluginName} to previous local state ${previousState.state} at version ${previousState.version}.`];
    }
    if (action === 'enable' || action === 'stage_update') {
      return [`Remove ${pluginName} from local plugin state metadata.`];
    }
    return [`Re-enable ${pluginName} from a previously approved manifest if needed.`];
  }

  private verificationPlan(): readonly string[] {
    return [
      'Run plugin.inventory and confirm local plugin state.',
      'Run plugin.validate_manifest for the affected manifest.',
      'Run plugin.resolve_compatibility for the affected manifest.',
      'Run platform integration tests before relying on the changed plugin state.',
    ];
  }

  private createId(action: string): string {
    return `plugin_lifecycle_${action}_${createCorrelationId().slice(5)}`;
  }
}
