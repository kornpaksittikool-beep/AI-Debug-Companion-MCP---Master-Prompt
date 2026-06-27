import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { DatabaseIntelligenceModule } from '../database-intelligence/database-intelligence.module.js';
import { GitIntelligenceModule } from '../git-intelligence/git-intelligence.module.js';
import { InvestigationModule } from '../investigation/investigation.module.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { ImpactService } from './services/impact.service.js';
import { PlanningStoreService } from './services/planning-store.service.js';
import { PlanningService } from './services/planning.service.js';
import {
  PLANNING_APPROVAL_GATE_TOOL_DEFINITION,
  PLANNING_CREATE_PLAN_TOOL_DEFINITION,
  PLANNING_IMPACT_REPORT_TOOL_DEFINITION,
  PLANNING_SUMMARIZE_PLAN_TOOL_DEFINITION,
} from './tools/planning-impact-tool-schemas.js';
import {
  PlanningApprovalGateTool,
  PlanningCreatePlanTool,
  PlanningImpactReportTool,
  PlanningSummarizePlanTool,
} from './tools/planning-impact.tools.js';

@Module({
  imports: [
    CoreModule,
    InvestigationModule,
    RepositoryIntelligenceModule,
    DatabaseIntelligenceModule,
    GitIntelligenceModule,
  ],
  providers: [
    PlanningStoreService,
    PlanningService,
    ImpactService,
    PlanningCreatePlanTool,
    PlanningImpactReportTool,
    PlanningApprovalGateTool,
    PlanningSummarizePlanTool,
  ],
  exports: [PlanningService, ImpactService],
})
export class PlanningImpactModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly createPlanTool: PlanningCreatePlanTool,
    private readonly impactReportTool: PlanningImpactReportTool,
    private readonly approvalGateTool: PlanningApprovalGateTool,
    private readonly summarizePlanTool: PlanningSummarizePlanTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(PLANNING_CREATE_PLAN_TOOL_DEFINITION, this.createPlanTool);
    this.registry.register(PLANNING_IMPACT_REPORT_TOOL_DEFINITION, this.impactReportTool);
    this.registry.register(PLANNING_APPROVAL_GATE_TOOL_DEFINITION, this.approvalGateTool);
    this.registry.register(PLANNING_SUMMARIZE_PLAN_TOOL_DEFINITION, this.summarizePlanTool);
  }
}
