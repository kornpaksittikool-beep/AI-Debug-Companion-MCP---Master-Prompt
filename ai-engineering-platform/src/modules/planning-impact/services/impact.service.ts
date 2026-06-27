import { Injectable } from '@nestjs/common';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { DatabaseIntelligenceService } from '../../database-intelligence/services/database-intelligence.service.js';
import { GitIntelligenceService } from '../../git-intelligence/services/git-intelligence.service.js';
import { RepositoryIntelligenceService } from '../../repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySymbolService } from '../../repository-intelligence/services/repository-symbol.service.js';
import type {
  ImpactArea,
  ImpactReport,
  ImpactReportInput,
  PlanRiskLevel,
  PlanningEvidenceReference,
} from '../interfaces/planning-impact.interface.js';
import { PlanningStoreService } from './planning-store.service.js';

@Injectable()
export class ImpactService {
  constructor(
    private readonly store: PlanningStoreService,
    private readonly repository: RepositoryIntelligenceService,
    private readonly symbols: RepositorySymbolService,
    private readonly database: DatabaseIntelligenceService,
    private readonly git: GitIntelligenceService,
  ) {}

  async createImpactReport(input: ImpactReportInput): Promise<ImpactReport> {
    const evidence: PlanningEvidenceReference[] = [];
    const areas: ImpactArea[] = [];

    if (input.planId) {
      const plan = this.store.get(input.planId);
      evidence.push(...plan.evidence);
      areas.push({
        area: 'files',
        items: plan.estimatedFiles,
        risk: plan.estimatedRisk,
        reason: 'Derived from the selected engineering plan.',
      });
    }

    if (input.targetFiles?.length) {
      areas.push({
        area: 'files',
        items: [...new Set(input.targetFiles)],
        risk: this.riskFromCount(input.targetFiles.length),
        reason: 'Caller provided explicit target files.',
      });
    }

    if (input.rootPath) {
      const overview = await this.repository.overview({ rootPath: input.rootPath, maxFiles: 300 });
      evidence.push({
        sourceType: 'repository',
        source: overview.rootPath,
        summary: `Repository overview includes ${overview.fileCount} bounded file(s).`,
      });

      const gitHints = await this.git.impactHints({
        rootPath: input.rootPath,
        maxCommits: input.maxGitCommits ?? 20,
      });
      const riskyFiles = gitHints.hints.filter((hint) => hint.riskLevel !== 'low').map((hint) => hint.filePath);
      areas.push({
        area: 'modules',
        items: this.toModuleNames([...(input.targetFiles ?? []), ...riskyFiles]),
        risk: this.riskFromCount(riskyFiles.length),
        reason: 'Derived from recent git file history and target files.',
      });
      evidence.push({
        sourceType: 'git',
        source: input.rootPath,
        summary: `${gitHints.hints.length} file history hint(s) across ${gitHints.analyzedCommits} commit(s).`,
      });
    }

    if (input.targetSymbols?.length && input.rootPath) {
      const symbolItems: string[] = [];
      for (const symbolName of input.targetSymbols.slice(0, 10)) {
        const result = await this.symbols.searchSymbols({ rootPath: input.rootPath, query: symbolName, maxFiles: 300 });
        symbolItems.push(...result.symbols.map((symbol) => `${symbol.kind}:${symbol.name}@${symbol.relativePath}`));
      }
      areas.push({
        area: 'backend',
        items: symbolItems,
        risk: this.riskFromCount(symbolItems.length),
        reason: 'Derived from bounded symbol intelligence.',
      });
      evidence.push({
        sourceType: 'symbol',
        source: input.targetSymbols.join(', '),
        summary: `${symbolItems.length} bounded symbol match(es).`,
      });
    }

    if (input.databaseConnection) {
      const schema = this.database.readSchema(input.databaseConnection);
      const relations = this.database.readRelations(input.databaseConnection);
      areas.push({
        area: 'database',
        items: schema.tables.map((table) => table.name),
        risk: relations.relations.length > 0 ? 'medium' : 'low',
        reason: 'Derived from database schema and relation discovery.',
      });
      evidence.push({
        sourceType: 'database',
        source: input.databaseConnection.dialect === 'sqlite'
          ? input.databaseConnection.databasePath
          : `${input.databaseConnection.dialect}:${input.databaseConnection.host}/${input.databaseConnection.database}`,
        summary: `${schema.tables.length} table(s), ${relations.relations.length} relation(s).`,
      });
    }

    const normalizedAreas = this.ensureDefaultAreas(areas);

    return {
      id: this.createId('impact'),
      objective: input.objective.trim(),
      ...(input.rootPath ? { rootPath: input.rootPath } : {}),
      ...(input.planId ? { planId: input.planId } : {}),
      areas: normalizedAreas,
      regressionRisk: this.maxRisk(normalizedAreas.map((area) => area.risk)),
      evidence,
      createdAt: new Date().toISOString(),
    };
  }

  private ensureDefaultAreas(areas: readonly ImpactArea[]): readonly ImpactArea[] {
    const existing = new Set(areas.map((area) => area.area));
    const defaults: ImpactArea[] = [];
    for (const area of ['apis', 'frontend', 'cache', 'queue', 'workers', 'events'] as const) {
      if (!existing.has(area)) {
        defaults.push({
          area,
          items: [],
          risk: 'low',
          reason: 'No direct evidence found in Phase 6 read-only analysis.',
        });
      }
    }
    return [...areas, ...defaults];
  }

  private toModuleNames(filePaths: readonly string[]): readonly string[] {
    const modules = new Set<string>();
    for (const filePath of filePaths) {
      const parts = filePath.split(/[\\/]/).filter(Boolean);
      if (parts.length >= 2) {
        modules.add(`${parts[0]}/${parts[1]}`);
      } else if (parts.length === 1) {
        modules.add(parts[0] ?? '');
      }
    }
    return [...modules].filter(Boolean);
  }

  private riskFromCount(count: number): PlanRiskLevel {
    if (count > 10) {
      return 'high';
    }
    if (count > 2) {
      return 'medium';
    }
    return 'low';
  }

  private maxRisk(risks: readonly PlanRiskLevel[]): PlanRiskLevel {
    if (risks.includes('high')) {
      return 'high';
    }
    if (risks.includes('medium')) {
      return 'medium';
    }
    return 'low';
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
