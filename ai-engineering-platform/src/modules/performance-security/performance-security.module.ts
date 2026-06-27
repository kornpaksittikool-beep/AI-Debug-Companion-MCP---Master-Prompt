import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { RepositoryIntelligenceModule } from '../repository-intelligence/repository-intelligence.module.js';
import { CacheInvalidationService } from './services/cache-invalidation.service.js';
import { CacheStoreService } from './services/cache-store.service.js';
import { RepositoryScanCacheService } from './services/repository-scan-cache.service.js';
import { SecurityAuditService } from './services/security-audit.service.js';
import {
  PERFORMANCE_CACHE_SUMMARY_TOOL_DEFINITION,
  PERFORMANCE_INVALIDATE_CACHE_TOOL_DEFINITION,
  SECURITY_AUDIT_PROJECT_TOOL_DEFINITION,
  SECURITY_AUDIT_TOOL_PERMISSIONS_TOOL_DEFINITION,
} from './tools/performance-security-tool-schemas.js';
import {
  PerformanceCacheSummaryTool,
  PerformanceInvalidateCacheTool,
  SecurityAuditProjectTool,
  SecurityAuditToolPermissionsTool,
} from './tools/performance-security.tools.js';

@Module({
  imports: [CoreModule, RepositoryIntelligenceModule],
  providers: [
    CacheStoreService,
    RepositoryScanCacheService,
    CacheInvalidationService,
    SecurityAuditService,
    PerformanceCacheSummaryTool,
    PerformanceInvalidateCacheTool,
    SecurityAuditProjectTool,
    SecurityAuditToolPermissionsTool,
  ],
  exports: [CacheStoreService, RepositoryScanCacheService, CacheInvalidationService, SecurityAuditService],
})
export class PerformanceSecurityModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly cacheSummaryTool: PerformanceCacheSummaryTool,
    private readonly invalidateCacheTool: PerformanceInvalidateCacheTool,
    private readonly auditProjectTool: SecurityAuditProjectTool,
    private readonly auditToolPermissionsTool: SecurityAuditToolPermissionsTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(PERFORMANCE_CACHE_SUMMARY_TOOL_DEFINITION, this.cacheSummaryTool);
    this.registry.register(PERFORMANCE_INVALIDATE_CACHE_TOOL_DEFINITION, this.invalidateCacheTool);
    this.registry.register(SECURITY_AUDIT_PROJECT_TOOL_DEFINITION, this.auditProjectTool);
    this.registry.register(SECURITY_AUDIT_TOOL_PERMISSIONS_TOOL_DEFINITION, this.auditToolPermissionsTool);
  }
}
