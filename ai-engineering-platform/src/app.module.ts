import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { DatabaseIntelligenceModule } from './modules/database-intelligence/database-intelligence.module.js';
import { GitIntelligenceModule } from './modules/git-intelligence/git-intelligence.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { InvestigationModule } from './modules/investigation/investigation.module.js';
import { RepositoryIntelligenceModule } from './modules/repository-intelligence/repository-intelligence.module.js';
import { ExamplePluginModule } from './plugins/example/example-plugin.module.js';

@Module({
  imports: [
    CoreModule,
    HealthModule,
    InvestigationModule,
    RepositoryIntelligenceModule,
    DatabaseIntelligenceModule,
    GitIntelligenceModule,
    ExamplePluginModule,
  ],
})
export class AppModule {}
