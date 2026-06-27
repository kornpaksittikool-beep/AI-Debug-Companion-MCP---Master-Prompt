import { Injectable } from '@nestjs/common';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { ToolRegistryService } from '../../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceService } from '../../repository-intelligence/services/repository-intelligence.service.js';
import type {
  SecurityAuditProjectInput,
  SecurityAuditProjectResult,
  SecurityAuditToolPermissionsResult,
  SecurityFinding,
  SecurityRiskLevel,
} from '../interfaces/performance-security.interface.js';

const PROMPT_INJECTION_MARKERS = [
  'ignore previous instructions',
  'ignore all previous instructions',
  'system prompt',
  'developer message',
  'exfiltrate',
  'send secrets',
  'api key',
] as const;

@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly repository: RepositoryIntelligenceService,
    private readonly registry: ToolRegistryService,
  ) {}

  async auditProject(input: SecurityAuditProjectInput): Promise<SecurityAuditProjectResult> {
    const scan = await this.repository.scan({
      rootPath: input.rootPath,
      maxFiles: input.maxFiles ?? 200,
      maxFileSizeBytes: input.maxFileSizeBytes ?? 64 * 1024,
      includeTextPreview: true,
      previewMaxBytes: 4096,
    });
    const findings: SecurityFinding[] = [];

    for (const file of scan.files) {
      const preview = file.textPreview?.toLowerCase() ?? '';
      for (const marker of PROMPT_INJECTION_MARKERS) {
        if (preview.includes(marker)) {
          findings.push(
            this.createFinding({
              risk: this.markerRisk(marker),
              category: 'prompt_injection',
              source: file.relativePath,
              message: `Potential prompt-injection marker "${marker}" found in file preview.`,
              suggestion: 'Review this file before using its content as trusted AI context.',
            }),
          );
        }
      }
    }

    return {
      rootPath: scan.rootPath,
      findings,
      scannedFiles: scan.files.length,
      truncated: scan.truncated,
    };
  }

  auditToolPermissions(): SecurityAuditToolPermissionsResult {
    const findings: SecurityFinding[] = [];
    const tools = this.registry.list();

    for (const tool of tools) {
      const permissions = tool.permissions;
      if (permissions.network.enabled) {
        findings.push(
          this.createFinding({
            risk: 'high',
            category: 'permission',
            source: tool.name,
            message: 'Tool has network access enabled.',
            suggestion: 'Confirm network access is required and documented.',
          }),
        );
      }
      if (permissions.fileSystem.write && permissions.fileSystem.allowedRoots.length === 0) {
        findings.push(
          this.createFinding({
            risk: 'high',
            category: 'path',
            source: tool.name,
            message: 'Tool can write files without declared allowed roots.',
            suggestion: 'Declare narrow allowed roots for every write-capable tool.',
          }),
        );
      }
      if (permissions.commands.execute && permissions.commands.allowList.length === 0) {
        findings.push(
          this.createFinding({
            risk: 'high',
            category: 'command',
            source: tool.name,
            message: 'Tool can execute commands without an allow-list.',
            suggestion: 'Define explicit command allow-list entries.',
          }),
        );
      }
      if (permissions.git.write) {
        findings.push(
          this.createFinding({
            risk: 'medium',
            category: 'permission',
            source: tool.name,
            message: 'Tool has git write permission.',
            suggestion: 'Require explicit approval and rollback documentation for git write tools.',
          }),
        );
      }
    }

    return {
      findings,
      auditedTools: tools.length,
    };
  }

  private markerRisk(marker: string): SecurityRiskLevel {
    return marker.includes('secret') || marker.includes('api key') || marker.includes('exfiltrate')
      ? 'high'
      : 'medium';
  }

  private createFinding(input: Omit<SecurityFinding, 'id'>): SecurityFinding {
    return {
      id: `sec_${createCorrelationId().slice(5)}`,
      ...input,
    };
  }
}
