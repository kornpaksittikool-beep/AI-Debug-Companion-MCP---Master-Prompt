import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  IntegrationReadinessInputDto,
  IntegrationSessionInputDto,
  IntegrationTelemetrySummaryInputDto,
  ToolUsageRecordInputDto,
} from '../dto/integration-telemetry.dto.js';
import { IntegrationTelemetryService } from '../services/integration-telemetry.service.js';

@Injectable()
export class IntegrationStartSessionTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.startSession(input as unknown as IntegrationSessionInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationRecordToolUsageTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.recordToolUsage(input as unknown as ToolUsageRecordInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationReadinessTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.readiness(input as unknown as IntegrationReadinessInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationTelemetrySummaryTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.summary(input as unknown as IntegrationTelemetrySummaryInputDto) as unknown as JsonSchemaObject,
    );
  }
}
