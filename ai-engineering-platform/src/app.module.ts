import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { DatabaseIntelligenceModule } from './modules/database-intelligence/database-intelligence.module.js';
import { GitIntelligenceModule } from './modules/git-intelligence/git-intelligence.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { InvestigationModule } from './modules/investigation/investigation.module.js';
import { PatchVerificationModule } from './modules/patch-verification/patch-verification.module.js';
import { PerformanceSecurityModule } from './modules/performance-security/performance-security.module.js';
import { PluginMarketplaceModule } from './modules/plugin-marketplace/plugin-marketplace.module.js';
import { PlanningImpactModule } from './modules/planning-impact/planning-impact.module.js';
import { ProjectMemoryModule } from './modules/project-memory/project-memory.module.js';
import { RepositoryIntelligenceModule } from './modules/repository-intelligence/repository-intelligence.module.js';

@Module({
  imports: [
    CoreModule,
    HealthModule,
    InvestigationModule,
    RepositoryIntelligenceModule,
    DatabaseIntelligenceModule,
    GitIntelligenceModule,
    PlanningImpactModule,
    PatchVerificationModule,
    ProjectMemoryModule,
    PerformanceSecurityModule,
    PluginMarketplaceModule,
  ],
})
export class AppModule {}
