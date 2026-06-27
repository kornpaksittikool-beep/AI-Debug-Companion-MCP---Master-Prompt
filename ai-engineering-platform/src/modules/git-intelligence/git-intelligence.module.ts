import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { GitCommandRunnerService } from './services/git-command-runner.service.js';
import { GitIntelligenceService } from './services/git-intelligence.service.js';
import { GitSafetyService } from './services/git-safety.service.js';
import {
  GIT_BLAME_TOOL_DEFINITION,
  GIT_FIND_COMMIT_BY_FILE_TOOL_DEFINITION,
  GIT_IMPACT_HINTS_TOOL_DEFINITION,
  GIT_RECENT_CHANGES_TOOL_DEFINITION,
} from './tools/git-tool-schemas.js';
import {
  GitBlameTool,
  GitFindCommitByFileTool,
  GitImpactHintsTool,
  GitRecentChangesTool,
} from './tools/git.tools.js';

@Module({
  imports: [CoreModule, RepositoryIntelligenceModule],
  providers: [
    GitSafetyService,
    GitCommandRunnerService,
    GitIntelligenceService,
    GitRecentChangesTool,
    GitBlameTool,
    GitFindCommitByFileTool,
    GitImpactHintsTool,
  ],
  exports: [GitIntelligenceService],
})
export class GitIntelligenceModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly recentChangesTool: GitRecentChangesTool,
    private readonly blameTool: GitBlameTool,
    private readonly findCommitByFileTool: GitFindCommitByFileTool,
    private readonly impactHintsTool: GitImpactHintsTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(GIT_RECENT_CHANGES_TOOL_DEFINITION, this.recentChangesTool);
    this.registry.register(GIT_BLAME_TOOL_DEFINITION, this.blameTool);
    this.registry.register(GIT_FIND_COMMIT_BY_FILE_TOOL_DEFINITION, this.findCommitByFileTool);
    this.registry.register(GIT_IMPACT_HINTS_TOOL_DEFINITION, this.impactHintsTool);
  }
}
