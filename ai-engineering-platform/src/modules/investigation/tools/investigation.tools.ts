import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  AddEvidenceInputDto,
  AddHypothesisInputDto,
  CloseInvestigationInputDto,
  CreateInvestigationInputDto,
  RecordVisitInputDto,
  SummarizeInvestigationInputDto,
} from '../dto/investigation.dto.js';
import { InvestigationService } from '../services/investigation.service.js';

@Injectable()
export class InvestigationCreateTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.investigationService.create(input as unknown as CreateInvestigationInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class InvestigationAddEvidenceTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.investigationService.addEvidence(input as unknown as AddEvidenceInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class InvestigationAddHypothesisTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.investigationService.addHypothesis(input as unknown as AddHypothesisInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class InvestigationRecordVisitTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.investigationService.recordVisit(input as unknown as RecordVisitInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class InvestigationSummarizeTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    const typedInput = input as unknown as SummarizeInvestigationInputDto;
    return Promise.resolve(
      this.investigationService.summarize(typedInput.sessionId) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class InvestigationCloseTool implements ToolHandler {
  constructor(private readonly investigationService: InvestigationService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.investigationService.close(input as unknown as CloseInvestigationInputDto) as unknown as JsonSchemaObject,
    );
  }
}
