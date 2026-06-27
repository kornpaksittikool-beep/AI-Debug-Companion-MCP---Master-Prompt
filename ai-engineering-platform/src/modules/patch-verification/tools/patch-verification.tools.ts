import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  ApplyPatchProposalInputDto,
  CreatePatchProposalInputDto,
  RollbackPatchApplyInputDto,
  RollbackPlanInputDto,
  SummarizePatchProposalInputDto,
  SummarizeVerificationResultInputDto,
  VerificationRunInputDto,
} from '../dto/patch-verification.dto.js';
import { PatchApplyService } from '../services/patch-apply.service.js';
import { PatchProposalService } from '../services/patch-proposal.service.js';
import { VerificationRunnerService } from '../services/verification-runner.service.js';

@Injectable()
export class PatchCreateProposalTool implements ToolHandler {
  constructor(private readonly service: PatchProposalService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.createProposal(input as unknown as CreatePatchProposalInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PatchSummarizeProposalTool implements ToolHandler {
  constructor(private readonly service: PatchProposalService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.summarizeProposal(input as unknown as SummarizePatchProposalInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PatchRollbackPlanTool implements ToolHandler {
  constructor(private readonly service: PatchProposalService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.rollbackPlan(input as unknown as RollbackPlanInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class PatchApplyProposalTool implements ToolHandler {
  constructor(private readonly service: PatchApplyService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .applyProposal(input as unknown as ApplyPatchProposalInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class PatchRollbackApplyTool implements ToolHandler {
  constructor(private readonly service: PatchApplyService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .rollbackApply(input as unknown as RollbackPatchApplyInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class VerificationRunCheckTool implements ToolHandler {
  constructor(private readonly service: VerificationRunnerService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return this.service
      .runCheck(input as unknown as VerificationRunInputDto)
      .then((result) => result as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class VerificationSummarizeResultTool implements ToolHandler {
  constructor(private readonly service: VerificationRunnerService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.summarizeResult(input as unknown as SummarizeVerificationResultInputDto) as unknown as JsonSchemaObject,
    );
  }
}
