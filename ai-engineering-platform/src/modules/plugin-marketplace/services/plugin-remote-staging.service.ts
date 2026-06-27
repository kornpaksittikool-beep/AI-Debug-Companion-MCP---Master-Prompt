import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { PathPolicyService } from '../../../core/security/path-policy.service.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  PluginLifecycleRisk,
  RemotePluginStagedInventoryInput,
  RemotePluginStagedInventoryResult,
  RemotePluginStagedRecord,
  RemotePluginStageInput,
  RemotePluginStagePlan,
  RemotePluginStagePlanInput,
  RemotePluginStageResult,
} from '../interfaces/plugin-marketplace.interface.js';
import { PluginCompatibilityService } from './plugin-compatibility.service.js';
import { PluginManifestValidatorService } from './plugin-manifest-validator.service.js';
import { PluginRemoteArtifactVerifierService } from './plugin-remote-artifact-verifier.service.js';

interface RemoteStagingFile {
  readonly version: number;
  readonly stagedPlugins: readonly RemotePluginStagedRecord[];
}

@Injectable()
export class PluginRemoteStagingService {
  constructor(
    private readonly pathPolicy: PathPolicyService,
    private readonly validator: PluginManifestValidatorService,
    private readonly compatibility: PluginCompatibilityService,
    private readonly verifier: PluginRemoteArtifactVerifierService,
  ) {}

  createStagePlan(input: RemotePluginStagePlanInput): RemotePluginStagePlan {
    const validation = this.validator.validate(input.manifest);
    const sourceIssues = this.verifier.validateSource(input.source);
    const compatibility = this.compatibility.resolve({ manifest: input.manifest });
    const valid = validation.valid && sourceIssues.length === 0 && compatibility.compatible;
    const risk = this.estimateRisk(valid, input.manifest.tools.some((tool) => tool.permissions.network.enabled));

    return {
      planId: `plugin_remote_stage_${input.manifest.name}_${Date.now()}`,
      pluginName: input.manifest.name,
      version: input.manifest.version,
      status: 'requires_approval',
      risk,
      source: input.source,
      validation: {
        valid,
        issues: [...validation.issues, ...sourceIssues],
        compatibility,
      },
      artifactRequirements: [
        'Artifact content must be verified with SHA-256 before staging.',
        'Signature metadata is accepted as metadata only in Phase 17.',
        'Remote plugin code must not be imported or executed during staging.',
      ],
      steps: [
        'Validate source metadata and manifest compatibility.',
        'Verify artifact checksum.',
        'Write remote staging metadata under .ai-engineering-platform/plugins/remote-staging.',
        'Review staged metadata before any future enable workflow.',
      ],
      rollbackPlan: [`Remove staged remote metadata for ${input.manifest.name}.`],
      verificationPlan: [
        'Run plugin.staged_inventory and confirm staged record metadata.',
        'Run plugin.verify_artifact for the remote source.',
        'Run plugin.validate_manifest for the staged manifest.',
        'Run platform integration tests before enabling future remote execution support.',
      ],
    };
  }

  async stageRemote(input: RemotePluginStageInput): Promise<RemotePluginStageResult> {
    const verification = this.verifier.verify({
      source: input.source,
      artifactContent: input.artifactContent,
    });
    const validation = this.validator.validate(input.manifest);
    if (!verification.valid || !validation.valid) {
      return {
        status: 'rejected',
        reason: 'Remote plugin staging rejected because verification or manifest validation failed.',
        verification,
      };
    }

    const paths = this.resolvePaths(input.rootPath);
    const state = await this.readState(paths.statePath);
    const record: RemotePluginStagedRecord = {
      stagingId: `remote_stage_${createCorrelationId().slice(5)}`,
      pluginName: input.manifest.name,
      version: input.manifest.version,
      manifest: input.manifest,
      source: input.source,
      verification,
      state: 'staged_remote',
      stagedAt: new Date().toISOString(),
      rollbackPlan: [`Remove staged remote metadata for ${input.manifest.name}.`],
      verificationPlan: [
        'Review staged manifest and source metadata.',
        'Run plugin.staged_inventory.',
        'Do not execute plugin code until a future sandbox execution phase is approved.',
      ],
    };
    const nextState: RemoteStagingFile = {
      version: state.version + 1,
      stagedPlugins: [
        ...state.stagedPlugins.filter((plugin) => plugin.pluginName !== record.pluginName),
        record,
      ].sort((a, b) => a.pluginName.localeCompare(b.pluginName)),
    };

    await fs.mkdir(paths.directory, { recursive: true });
    await fs.writeFile(paths.statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
    return {
      status: 'completed',
      reason: 'Remote plugin metadata staged without importing, installing, or executing plugin code.',
      record,
      verification,
    };
  }

  async stagedInventory(input: RemotePluginStagedInventoryInput): Promise<RemotePluginStagedInventoryResult> {
    const paths = this.resolvePaths(input.rootPath);
    const state = await this.readState(paths.statePath);
    return {
      rootPath: paths.rootPath,
      stagedPlugins: state.stagedPlugins,
    };
  }

  private estimateRisk(valid: boolean, declaresNetworkPermission: boolean): PluginLifecycleRisk {
    if (!valid) {
      return 'high';
    }
    return declaresNetworkPermission ? 'medium' : 'low';
  }

  private async readState(statePath: string): Promise<RemoteStagingFile> {
    try {
      const content = await fs.readFile(statePath, 'utf8');
      return JSON.parse(content) as RemoteStagingFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { version: 1, stagedPlugins: [] };
      }
      throw error;
    }
  }

  private resolvePaths(rootPath: string): { readonly rootPath: string; readonly directory: string; readonly statePath: string } {
    const resolvedRoot = path.resolve(rootPath);
    const directory = path.resolve(resolvedRoot, '.ai-engineering-platform', 'plugins', 'remote-staging');
    const statePath = path.resolve(directory, 'state.json');
    if (!this.pathPolicy.isPathInsideRoot(directory, resolvedRoot) || !this.pathPolicy.isPathInsideRoot(statePath, resolvedRoot)) {
      throw new PlatformError({
        code: 'INVALID_REMOTE_PLUGIN_STAGING_PATH',
        message: 'Remote plugin staging path is outside the project root.',
        reason: 'Remote plugin staging metadata must stay inside .ai-engineering-platform/plugins/remote-staging.',
        suggestion: 'Provide a valid project root path.',
      });
    }
    return { rootPath: resolvedRoot, directory, statePath };
  }
}
