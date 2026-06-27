import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIgnoreService } from './services/repository-ignore.service.js';
import { RepositoryIntelligenceService } from './services/repository-intelligence.service.js';
import { RepositorySafetyService } from './services/repository-safety.service.js';
import { RepositoryScannerService } from './services/repository-scanner.service.js';
import { RepositorySymbolService } from './services/repository-symbol.service.js';
import { TypeScriptSymbolParserService } from './services/typescript-symbol-parser.service.js';
import {
  REPOSITORY_OVERVIEW_TOOL_DEFINITION,
  REPOSITORY_READ_FILE_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_READ_MODULE_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_READ_SYMBOL_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_SCAN_TOOL_DEFINITION,
  REPOSITORY_SEARCH_FILES_TOOL_DEFINITION,
  REPOSITORY_SEARCH_SYMBOLS_TOOL_DEFINITION,
} from './tools/repository-tool-schemas.js';
import {
  RepositoryOverviewTool,
  RepositoryReadFileContextTool,
  RepositoryReadModuleContextTool,
  RepositoryReadSymbolContextTool,
  RepositoryScanTool,
  RepositorySearchFilesTool,
  RepositorySearchSymbolsTool,
} from './tools/repository.tools.js';

@Module({
  imports: [CoreModule],
  providers: [
    RepositoryIgnoreService,
    RepositorySafetyService,
    RepositoryScannerService,
    RepositoryIntelligenceService,
    TypeScriptSymbolParserService,
    RepositorySymbolService,
    RepositoryOverviewTool,
    RepositoryScanTool,
    RepositorySearchFilesTool,
    RepositoryReadFileContextTool,
    RepositoryReadModuleContextTool,
    RepositorySearchSymbolsTool,
    RepositoryReadSymbolContextTool,
  ],
  exports: [RepositoryIntelligenceService, RepositorySafetyService, RepositorySymbolService],
})
export class RepositoryIntelligenceModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly overviewTool: RepositoryOverviewTool,
    private readonly scanTool: RepositoryScanTool,
    private readonly searchFilesTool: RepositorySearchFilesTool,
    private readonly readFileContextTool: RepositoryReadFileContextTool,
    private readonly readModuleContextTool: RepositoryReadModuleContextTool,
    private readonly searchSymbolsTool: RepositorySearchSymbolsTool,
    private readonly readSymbolContextTool: RepositoryReadSymbolContextTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(REPOSITORY_OVERVIEW_TOOL_DEFINITION, this.overviewTool);
    this.registry.register(REPOSITORY_SCAN_TOOL_DEFINITION, this.scanTool);
    this.registry.register(REPOSITORY_SEARCH_FILES_TOOL_DEFINITION, this.searchFilesTool);
    this.registry.register(REPOSITORY_READ_FILE_CONTEXT_TOOL_DEFINITION, this.readFileContextTool);
    this.registry.register(REPOSITORY_READ_MODULE_CONTEXT_TOOL_DEFINITION, this.readModuleContextTool);
    this.registry.register(REPOSITORY_SEARCH_SYMBOLS_TOOL_DEFINITION, this.searchSymbolsTool);
    this.registry.register(REPOSITORY_READ_SYMBOL_CONTEXT_TOOL_DEFINITION, this.readSymbolContextTool);
  }
}
