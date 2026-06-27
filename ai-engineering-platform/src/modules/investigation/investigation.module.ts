import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { InvestigationSessionStore } from './services/investigation-session.store.js';
import { InvestigationService } from './services/investigation.service.js';
import { ProblemClassifierService } from './services/problem-classifier.service.js';
import {
  INVESTIGATION_ADD_EVIDENCE_TOOL_DEFINITION,
  INVESTIGATION_ADD_HYPOTHESIS_TOOL_DEFINITION,
  INVESTIGATION_CLOSE_TOOL_DEFINITION,
  INVESTIGATION_CREATE_TOOL_DEFINITION,
  INVESTIGATION_RECORD_VISIT_TOOL_DEFINITION,
  INVESTIGATION_SUMMARIZE_TOOL_DEFINITION,
} from './tools/investigation-tool-schemas.js';
import {
  InvestigationAddEvidenceTool,
  InvestigationAddHypothesisTool,
  InvestigationCloseTool,
  InvestigationCreateTool,
  InvestigationRecordVisitTool,
  InvestigationSummarizeTool,
} from './tools/investigation.tools.js';

@Module({
  imports: [CoreModule],
  providers: [
    InvestigationSessionStore,
    InvestigationService,
    ProblemClassifierService,
    InvestigationCreateTool,
    InvestigationAddEvidenceTool,
    InvestigationAddHypothesisTool,
    InvestigationRecordVisitTool,
    InvestigationSummarizeTool,
    InvestigationCloseTool,
  ],
  exports: [InvestigationService],
})
export class InvestigationModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly createTool: InvestigationCreateTool,
    private readonly addEvidenceTool: InvestigationAddEvidenceTool,
    private readonly addHypothesisTool: InvestigationAddHypothesisTool,
    private readonly recordVisitTool: InvestigationRecordVisitTool,
    private readonly summarizeTool: InvestigationSummarizeTool,
    private readonly closeTool: InvestigationCloseTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(INVESTIGATION_CREATE_TOOL_DEFINITION, this.createTool);
    this.registry.register(INVESTIGATION_ADD_EVIDENCE_TOOL_DEFINITION, this.addEvidenceTool);
    this.registry.register(INVESTIGATION_ADD_HYPOTHESIS_TOOL_DEFINITION, this.addHypothesisTool);
    this.registry.register(INVESTIGATION_RECORD_VISIT_TOOL_DEFINITION, this.recordVisitTool);
    this.registry.register(INVESTIGATION_SUMMARIZE_TOOL_DEFINITION, this.summarizeTool);
    this.registry.register(INVESTIGATION_CLOSE_TOOL_DEFINITION, this.closeTool);
  }
}
