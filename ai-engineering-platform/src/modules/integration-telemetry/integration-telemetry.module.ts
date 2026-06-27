import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { IntegrationTelemetryService } from './services/integration-telemetry.service.js';
import {
  INTEGRATION_READINESS_TOOL_DEFINITION,
  INTEGRATION_RECORD_TOOL_USAGE_TOOL_DEFINITION,
  INTEGRATION_START_SESSION_TOOL_DEFINITION,
  INTEGRATION_TELEMETRY_SUMMARY_TOOL_DEFINITION,
} from './tools/integration-telemetry-tool-schemas.js';
import {
  IntegrationReadinessTool,
  IntegrationRecordToolUsageTool,
  IntegrationStartSessionTool,
  IntegrationTelemetrySummaryTool,
} from './tools/integration-telemetry.tools.js';

@Module({
  imports: [CoreModule],
  providers: [
    IntegrationTelemetryService,
    IntegrationStartSessionTool,
    IntegrationRecordToolUsageTool,
    IntegrationReadinessTool,
    IntegrationTelemetrySummaryTool,
  ],
  exports: [IntegrationTelemetryService],
})
export class IntegrationTelemetryModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly startSessionTool: IntegrationStartSessionTool,
    private readonly recordToolUsageTool: IntegrationRecordToolUsageTool,
    private readonly readinessTool: IntegrationReadinessTool,
    private readonly telemetrySummaryTool: IntegrationTelemetrySummaryTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(INTEGRATION_START_SESSION_TOOL_DEFINITION, this.startSessionTool);
    this.registry.register(INTEGRATION_RECORD_TOOL_USAGE_TOOL_DEFINITION, this.recordToolUsageTool);
    this.registry.register(INTEGRATION_READINESS_TOOL_DEFINITION, this.readinessTool);
    this.registry.register(INTEGRATION_TELEMETRY_SUMMARY_TOOL_DEFINITION, this.telemetrySummaryTool);
  }
}
