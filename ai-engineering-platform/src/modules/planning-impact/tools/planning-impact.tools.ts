import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  ApprovalGateInputDto,
  CreatePlanInputDto,
  ImpactReportInputDto,
  SummarizePlanInputDto,
} from '../dto/planning-impact.dto.js';
import { ImpactService } from '../services/impact.service.js';
import { PlanningService } from '../services/planning.service.js';

@Injectable()
export class PlanningCreatePlanTool implements ToolHandler {
  constructor(private readonly service: PlanningService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .createPlan(input as unknown as CreatePlanInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class PlanningImpactReportTool implements ToolHandler {
  constructor(private readonly service: ImpactService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .createImpactReport(input as unknown as ImpactReportInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class PlanningApprovalGateTool implements ToolHandler {
  constructor(private readonly service: PlanningService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.approvalGate(input as unknown as ApprovalGateInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PlanningSummarizePlanTool implements ToolHandler {
  constructor(private readonly service: PlanningService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.summarizePlan(input as unknown as SummarizePlanInputDto) as unknown as JsonSchemaObject,
    );
  }
}
