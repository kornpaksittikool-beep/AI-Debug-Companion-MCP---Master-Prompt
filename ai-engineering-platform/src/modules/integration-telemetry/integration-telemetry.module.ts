import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { IntegrationTelemetryPathService } from './services/integration-telemetry-path.service.js';
import { IntegrationTelemetryService } from './services/integration-telemetry.service.js';
import {
  INTEGRATION_AUTO_TELEMETRY_SUMMARY_TOOL_DEFINITION,
  INTEGRATION_FLUSH_TELEMETRY_TOOL_DEFINITION,
  INTEGRATION_READINESS_TOOL_DEFINITION,
  INTEGRATION_RECORD_TOOL_USAGE_TOOL_DEFINITION,
  INTEGRATION_RESET_AUTO_TELEMETRY_TOOL_DEFINITION,
  INTEGRATION_START_SESSION_TOOL_DEFINITION,
  INTEGRATION_TELEMETRY_SUMMARY_TOOL_DEFINITION,
  INTEGRATION_WORKFLOW_INDEX_TOOL_DEFINITION,
} from './tools/integration-telemetry-tool-schemas.js';
import {
  IntegrationAutoTelemetrySummaryTool,
  IntegrationFlushTelemetryTool,
  IntegrationReadinessTool,
  IntegrationRecordToolUsageTool,
  IntegrationResetAutoTelemetryTool,
  IntegrationStartSessionTool,
  IntegrationTelemetrySummaryTool,
  IntegrationWorkflowIndexTool,
} from './tools/integration-telemetry.tools.js';

@Module({
  imports: [CoreModule, RepositoryIntelligenceModule],
  providers: [
    IntegrationTelemetryPathService,
    IntegrationTelemetryService,
    IntegrationStartSessionTool,
    IntegrationRecordToolUsageTool,
    IntegrationReadinessTool,
    IntegrationTelemetrySummaryTool,
    IntegrationFlushTelemetryTool,
    IntegrationWorkflowIndexTool,
    IntegrationAutoTelemetrySummaryTool,
    IntegrationResetAutoTelemetryTool,
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
    private readonly flushTelemetryTool: IntegrationFlushTelemetryTool,
    private readonly workflowIndexTool: IntegrationWorkflowIndexTool,
    private readonly autoTelemetrySummaryTool: IntegrationAutoTelemetrySummaryTool,
    private readonly resetAutoTelemetryTool: IntegrationResetAutoTelemetryTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(INTEGRATION_START_SESSION_TOOL_DEFINITION, this.startSessionTool);
    this.registry.register(INTEGRATION_RECORD_TOOL_USAGE_TOOL_DEFINITION, this.recordToolUsageTool);
    this.registry.register(INTEGRATION_READINESS_TOOL_DEFINITION, this.readinessTool);
    this.registry.register(INTEGRATION_TELEMETRY_SUMMARY_TOOL_DEFINITION, this.telemetrySummaryTool);
    this.registry.register(INTEGRATION_FLUSH_TELEMETRY_TOOL_DEFINITION, this.flushTelemetryTool);
    this.registry.register(INTEGRATION_WORKFLOW_INDEX_TOOL_DEFINITION, this.workflowIndexTool);
    this.registry.register(INTEGRATION_AUTO_TELEMETRY_SUMMARY_TOOL_DEFINITION, this.autoTelemetrySummaryTool);
    this.registry.register(INTEGRATION_RESET_AUTO_TELEMETRY_TOOL_DEFINITION, this.resetAutoTelemetryTool);
  }
}
