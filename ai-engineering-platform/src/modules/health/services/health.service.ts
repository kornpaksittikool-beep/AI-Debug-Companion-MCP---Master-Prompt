import { Injectable } from '@nestjs/common';
import { ToolRegistryService } from '../../../core/registry/services/tool-registry.service.js';
import type {
  HealthOutputDto,
  PlatformMetadataInputDto,
  PlatformMetadataOutputDto,
  PlatformMetadataToolDto,
  PlatformToolModuleSummaryDto,
  PlatformToolSummaryOutputDto,
} from '../dto/health-output.dto.js';

const PLATFORM_DETAILS = {
  name: 'ai-engineering-platform',
  version: '0.1.0',
  phase: 'phase-29-summary-symbol-guardrails',
} as const;

@Injectable()
export class HealthService {
  constructor(private readonly registry: ToolRegistryService) {}

  getHealth(): HealthOutputDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getMetadata(input: PlatformMetadataInputDto = {}): PlatformMetadataOutputDto {
    const includeTools = input.includeTools ?? true;
    const includeDescriptions = input.includeDescriptions ?? true;

    if (!includeTools) {
      return {
        platform: PLATFORM_DETAILS,
        toolSummary: this.getToolSummary(input.moduleFilter),
      };
    }

    const tools = this.getTools(input.moduleFilter, includeDescriptions);

    return {
      platform: PLATFORM_DETAILS,
      tools,
    };
  }

  getToolSummary(moduleFilter?: string): PlatformToolSummaryOutputDto {
    const tools = this.getTools(moduleFilter, false);
    const moduleMap = new Map<string, string[]>();

    for (const tool of tools) {
      const existing = moduleMap.get(tool.module) ?? [];
      existing.push(tool.name);
      moduleMap.set(tool.module, existing);
    }

    const modules: PlatformToolModuleSummaryDto[] = Array.from(moduleMap.entries())
      .map(([module, toolNames]) => ({
        module,
        toolCount: toolNames.length,
        toolNames: [...toolNames].sort((first, second) => first.localeCompare(second)),
      }))
      .sort((first, second) => first.module.localeCompare(second.module));

    return {
      platform: PLATFORM_DETAILS,
      totalTools: tools.length,
      modules,
      recommendation:
        'Use platform.tool_summary for routing and call platform.metadata with includeTools=true only when full tool descriptions are required.',
    };
  }

  private getTools(moduleFilter: string | undefined, includeDescriptions: boolean): PlatformMetadataToolDto[] {
    return this.registry
      .list()
      .filter((tool) => !moduleFilter || tool.module === moduleFilter)
      .map((tool) => ({
        name: tool.name,
        version: tool.version,
        module: tool.module,
        ...(includeDescriptions ? { description: tool.description } : {}),
      }));
  }
}
