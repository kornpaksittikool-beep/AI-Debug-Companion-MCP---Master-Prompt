import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import { ExecutionTelemetryService } from '../../../core/telemetry/execution-telemetry.service.js';
import type {
  IntegrationReadinessInputDto,
  IntegrationSessionInputDto,
  TelemetryFlushInputDto,
  ToolUsageRecordInputDto,
  WorkflowIndexInputDto,
} from '../dto/integration-telemetry.dto.js';
import { IntegrationTelemetryService } from '../services/integration-telemetry.service.js';

@Injectable()
export class IntegrationStartSessionTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.startSession(
        input as unknown as IntegrationSessionInputDto,
      ) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationRecordToolUsageTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.recordToolUsage(
        input as unknown as ToolUsageRecordInputDto,
      ) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationReadinessTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.readiness(
        input as unknown as IntegrationReadinessInputDto,
      ) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationTelemetrySummaryTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  async execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const summary = await this.service.summary(input);
    return summary as unknown as JsonSchemaObject;
  }
}

@Injectable()
export class IntegrationFlushTelemetryTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  async execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return (await this.service.flush(
      input as unknown as TelemetryFlushInputDto,
    )) as unknown as JsonSchemaObject;
  }
}

@Injectable()
export class IntegrationWorkflowIndexTool implements ToolHandler {
  constructor(private readonly service: IntegrationTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.workflowIndex(
        input as unknown as WorkflowIndexInputDto,
      ) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class IntegrationAutoTelemetrySummaryTool implements ToolHandler {
  constructor(private readonly telemetry: ExecutionTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(this.telemetry.summary(input) as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class IntegrationResetAutoTelemetryTool implements ToolHandler {
  constructor(private readonly telemetry: ExecutionTelemetryService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    void input;
    return Promise.resolve(this.telemetry.reset() as unknown as JsonSchemaObject);
  }
}
