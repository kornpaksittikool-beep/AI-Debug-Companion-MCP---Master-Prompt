import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { ProjectMemoryPathService } from './services/project-memory-path.service.js';
import { ProjectMemoryService } from './services/project-memory.service.js';
import {
  MEMORY_EXPORT_TOOL_DEFINITION,
  MEMORY_RECORD_TOOL_DEFINITION,
  MEMORY_REFRESH_TOOL_DEFINITION,
  MEMORY_SEARCH_TOOL_DEFINITION,
  MEMORY_SUMMARIZE_TOOL_DEFINITION,
} from './tools/project-memory-tool-schemas.js';
import {
  MemoryExportTool,
  MemoryRecordTool,
  MemoryRefreshTool,
  MemorySearchTool,
  MemorySummarizeTool,
} from './tools/project-memory.tools.js';

@Module({
  imports: [CoreModule, RepositoryIntelligenceModule],
  providers: [
    ProjectMemoryPathService,
    ProjectMemoryService,
    MemoryRecordTool,
    MemorySearchTool,
    MemorySummarizeTool,
    MemoryRefreshTool,
    MemoryExportTool,
  ],
  exports: [ProjectMemoryService],
})
export class ProjectMemoryModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly recordTool: MemoryRecordTool,
    private readonly searchTool: MemorySearchTool,
    private readonly summarizeTool: MemorySummarizeTool,
    private readonly refreshTool: MemoryRefreshTool,
    private readonly exportTool: MemoryExportTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(MEMORY_RECORD_TOOL_DEFINITION, this.recordTool);
    this.registry.register(MEMORY_SEARCH_TOOL_DEFINITION, this.searchTool);
    this.registry.register(MEMORY_SUMMARIZE_TOOL_DEFINITION, this.summarizeTool);
    this.registry.register(MEMORY_REFRESH_TOOL_DEFINITION, this.refreshTool);
    this.registry.register(MEMORY_EXPORT_TOOL_DEFINITION, this.exportTool);
  }
}
