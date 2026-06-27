import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { PlanningImpactModule } from '../planning-impact/planning-impact.module.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { PatchProposalStoreService } from './services/patch-proposal-store.service.js';
import { PatchProposalService } from './services/patch-proposal.service.js';
import { VerificationRunnerService } from './services/verification-runner.service.js';
import {
  PATCH_CREATE_PROPOSAL_TOOL_DEFINITION,
  PATCH_ROLLBACK_PLAN_TOOL_DEFINITION,
  PATCH_SUMMARIZE_PROPOSAL_TOOL_DEFINITION,
  VERIFICATION_RUN_CHECK_TOOL_DEFINITION,
  VERIFICATION_SUMMARIZE_RESULT_TOOL_DEFINITION,
} from './tools/patch-verification-tool-schemas.js';
import {
  PatchCreateProposalTool,
  PatchRollbackPlanTool,
  PatchSummarizeProposalTool,
  VerificationRunCheckTool,
  VerificationSummarizeResultTool,
} from './tools/patch-verification.tools.js';

@Module({
  imports: [CoreModule, PlanningImpactModule, RepositoryIntelligenceModule],
  providers: [
    PatchProposalStoreService,
    PatchProposalService,
    VerificationRunnerService,
    PatchCreateProposalTool,
    PatchSummarizeProposalTool,
    PatchRollbackPlanTool,
    VerificationRunCheckTool,
    VerificationSummarizeResultTool,
  ],
  exports: [PatchProposalService, VerificationRunnerService],
})
export class PatchVerificationModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly createProposalTool: PatchCreateProposalTool,
    private readonly summarizeProposalTool: PatchSummarizeProposalTool,
    private readonly rollbackPlanTool: PatchRollbackPlanTool,
    private readonly runCheckTool: VerificationRunCheckTool,
    private readonly summarizeResultTool: VerificationSummarizeResultTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(PATCH_CREATE_PROPOSAL_TOOL_DEFINITION, this.createProposalTool);
    this.registry.register(PATCH_SUMMARIZE_PROPOSAL_TOOL_DEFINITION, this.summarizeProposalTool);
    this.registry.register(PATCH_ROLLBACK_PLAN_TOOL_DEFINITION, this.rollbackPlanTool);
    this.registry.register(VERIFICATION_RUN_CHECK_TOOL_DEFINITION, this.runCheckTool);
    this.registry.register(VERIFICATION_SUMMARIZE_RESULT_TOOL_DEFINITION, this.summarizeResultTool);
  }
}
