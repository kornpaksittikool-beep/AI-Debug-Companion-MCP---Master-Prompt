import { Injectable } from '@nestjs/common';
import { ToolRegistryService } from '../../../core/registry/services/tool-registry.service.js';
import type { HealthOutputDto, PlatformMetadataOutputDto } from '../dto/health-output.dto.js';

@Injectable()
export class HealthService {
  constructor(private readonly registry: ToolRegistryService) {}

  getHealth(): HealthOutputDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getMetadata(): PlatformMetadataOutputDto {
    const tools = this.registry.list().map((tool) => ({
      name: tool.name,
      version: tool.version,
      module: tool.module,
      description: tool.description,
    }));

    return {
      platform: {
        name: 'ai-engineering-platform',
        version: '0.1.0',
        phase: 'phase-20-durable-telemetry-workflow-index',
      },
      tools,
    };
  }
}
