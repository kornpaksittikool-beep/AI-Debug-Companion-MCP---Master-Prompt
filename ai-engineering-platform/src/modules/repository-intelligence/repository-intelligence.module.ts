import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIgnoreService } from './services/repository-ignore.service.js';
import { RepositoryGraphService } from './services/repository-graph.service.js';
import { RepositoryIndexStoreService } from './services/repository-index-store.service.js';
import { RepositoryIntelligenceService } from './services/repository-intelligence.service.js';
import { RepositoryMultiRootService } from './services/repository-multi-root.service.js';
import { RepositorySafetyService } from './services/repository-safety.service.js';
import { RepositoryScannerService } from './services/repository-scanner.service.js';
import { RepositorySymbolService } from './services/repository-symbol.service.js';
import { TypeScriptGraphParserService } from './services/typescript-graph-parser.service.js';
import { TypeScriptSymbolParserService } from './services/typescript-symbol-parser.service.js';
import {
  REPOSITORY_CALL_GRAPH_TOOL_DEFINITION,
  REPOSITORY_CROSS_REPO_SEARCH_TOOL_DEFINITION,
  REPOSITORY_IMPORT_GRAPH_TOOL_DEFINITION,
  REPOSITORY_INDEX_STATUS_TOOL_DEFINITION,
  REPOSITORY_OVERVIEW_TOOL_DEFINITION,
  REPOSITORY_PROJECT_PROFILE_TOOL_DEFINITION,
  REPOSITORY_READ_FILE_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_READ_MODULE_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_READ_SYMBOL_CONTEXT_TOOL_DEFINITION,
  REPOSITORY_REBUILD_INDEX_TOOL_DEFINITION,
  REPOSITORY_SCAN_TOOL_DEFINITION,
  REPOSITORY_SEARCH_FILES_TOOL_DEFINITION,
  REPOSITORY_SEARCH_SYMBOLS_TOOL_DEFINITION,
} from './tools/repository-tool-schemas.js';
import {
  RepositoryCallGraphTool,
  RepositoryCrossRepoSearchTool,
  RepositoryImportGraphTool,
  RepositoryIndexStatusTool,
  RepositoryOverviewTool,
  RepositoryProjectProfileTool,
  RepositoryReadFileContextTool,
  RepositoryReadModuleContextTool,
  RepositoryReadSymbolContextTool,
  RepositoryRebuildIndexTool,
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
    TypeScriptGraphParserService,
    RepositoryGraphService,
    RepositoryIndexStoreService,
    RepositoryMultiRootService,
    RepositoryProjectProfileTool,
    RepositoryOverviewTool,
    RepositoryScanTool,
    RepositorySearchFilesTool,
    RepositoryReadFileContextTool,
    RepositoryReadModuleContextTool,
    RepositorySearchSymbolsTool,
    RepositoryReadSymbolContextTool,
    RepositoryImportGraphTool,
    RepositoryCallGraphTool,
    RepositoryIndexStatusTool,
    RepositoryRebuildIndexTool,
    RepositoryCrossRepoSearchTool,
  ],
  exports: [
    RepositoryIntelligenceService,
    RepositorySafetyService,
    RepositorySymbolService,
    RepositoryGraphService,
    RepositoryIndexStoreService,
    RepositoryMultiRootService,
  ],
})
export class RepositoryIntelligenceModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly projectProfileTool: RepositoryProjectProfileTool,
    private readonly overviewTool: RepositoryOverviewTool,
    private readonly scanTool: RepositoryScanTool,
    private readonly searchFilesTool: RepositorySearchFilesTool,
    private readonly readFileContextTool: RepositoryReadFileContextTool,
    private readonly readModuleContextTool: RepositoryReadModuleContextTool,
    private readonly searchSymbolsTool: RepositorySearchSymbolsTool,
    private readonly readSymbolContextTool: RepositoryReadSymbolContextTool,
    private readonly importGraphTool: RepositoryImportGraphTool,
    private readonly callGraphTool: RepositoryCallGraphTool,
    private readonly indexStatusTool: RepositoryIndexStatusTool,
    private readonly rebuildIndexTool: RepositoryRebuildIndexTool,
    private readonly crossRepoSearchTool: RepositoryCrossRepoSearchTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(REPOSITORY_PROJECT_PROFILE_TOOL_DEFINITION, this.projectProfileTool);
    this.registry.register(REPOSITORY_OVERVIEW_TOOL_DEFINITION, this.overviewTool);
    this.registry.register(REPOSITORY_SCAN_TOOL_DEFINITION, this.scanTool);
    this.registry.register(REPOSITORY_SEARCH_FILES_TOOL_DEFINITION, this.searchFilesTool);
    this.registry.register(REPOSITORY_READ_FILE_CONTEXT_TOOL_DEFINITION, this.readFileContextTool);
    this.registry.register(REPOSITORY_READ_MODULE_CONTEXT_TOOL_DEFINITION, this.readModuleContextTool);
    this.registry.register(REPOSITORY_SEARCH_SYMBOLS_TOOL_DEFINITION, this.searchSymbolsTool);
    this.registry.register(REPOSITORY_READ_SYMBOL_CONTEXT_TOOL_DEFINITION, this.readSymbolContextTool);
    this.registry.register(REPOSITORY_IMPORT_GRAPH_TOOL_DEFINITION, this.importGraphTool);
    this.registry.register(REPOSITORY_CALL_GRAPH_TOOL_DEFINITION, this.callGraphTool);
    this.registry.register(REPOSITORY_INDEX_STATUS_TOOL_DEFINITION, this.indexStatusTool);
    this.registry.register(REPOSITORY_REBUILD_INDEX_TOOL_DEFINITION, this.rebuildIndexTool);
    this.registry.register(REPOSITORY_CROSS_REPO_SEARCH_TOOL_DEFINITION, this.crossRepoSearchTool);
  }
}
