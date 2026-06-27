import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import { DatabaseIntelligenceService } from '../../database-intelligence/services/database-intelligence.service.js';
import { GitIntelligenceService } from '../../git-intelligence/services/git-intelligence.service.js';
import { InvestigationService } from '../../investigation/services/investigation.service.js';
import { RepositoryIntelligenceService } from '../../repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySymbolService } from '../../repository-intelligence/services/repository-symbol.service.js';
import type {
  ApprovalGateInput,
  ApprovalGateResult,
  CreatePlanInput,
  EngineeringPlan,
  PlanLevel,
  PlanRiskLevel,
  PlanningEvidenceReference,
  SummarizePlanInput,
} from '../interfaces/planning-impact.interface.js';
import { PlanningStoreService } from './planning-store.service.js';

@Injectable()
export class PlanningService {
  constructor(
    private readonly store: PlanningStoreService,
    private readonly investigation: InvestigationService,
    private readonly repository: RepositoryIntelligenceService,
    private readonly symbols: RepositorySymbolService,
    private readonly database: DatabaseIntelligenceService,
    private readonly git: GitIntelligenceService,
  ) {}

  async createPlan(input: CreatePlanInput): Promise<EngineeringPlan> {
    this.ensureObjective(input.objective);
    const now = new Date().toISOString();
    const evidence = await this.collectEvidence(input);
    const estimatedFiles = await this.estimateFiles(input);
    const level = input.level ?? this.inferLevel(input.objective, estimatedFiles.length);
    const plan: EngineeringPlan = {
      id: this.createId('plan'),
      objective: input.objective.trim(),
      level,
      status: 'draft',
      scope: this.buildScope(input, level),
      dependencies: this.buildDependencies(input),
      estimatedFiles,
      estimatedRisk: this.estimateRisk(level, estimatedFiles.length, evidence.length),
      evidence,
      steps: this.buildSteps(level),
      rollbackPlan: {
        strategy: 'No writes are executed in Phase 6. Rollback requires discarding any future patch proposal before Phase 7 execution.',
        requiredBeforeExecution: [
          'Capture git diff before any future patch execution.',
          'Keep generated patch proposals reviewable before applying changes.',
        ],
      },
      verificationPlan: {
        commands: ['pnpm.cmd build', 'pnpm.cmd lint', 'pnpm.cmd test', 'pnpm.cmd test:integration', 'pnpm.cmd test:cov'],
        manualChecks: ['Review impact report evidence.', 'Confirm approval gate status before Phase 7 patch work.'],
      },
      createdAt: now,
      updatedAt: now,
    };

    return this.store.save(plan);
  }

  summarizePlan(input: SummarizePlanInput): EngineeringPlan {
    return this.store.get(input.planId);
  }

  approvalGate(input: ApprovalGateInput): ApprovalGateResult {
    const plan = this.store.get(input.planId);
    const now = new Date().toISOString();
    const status = this.resolveStatus(input.decision);
    const updatedPlan: EngineeringPlan = {
      ...plan,
      status,
      updatedAt: now,
    };
    this.store.save(updatedPlan);

    return {
      planId: input.planId,
      status,
      decision: input.decision,
      ...(input.reason ? { reason: input.reason } : {}),
      updatedAt: now,
    };
  }

  private async collectEvidence(input: CreatePlanInput): Promise<readonly PlanningEvidenceReference[]> {
    const evidence: PlanningEvidenceReference[] = [
      {
        sourceType: 'user_input',
        source: 'objective',
        summary: input.objective.trim(),
      },
    ];

    if (input.investigationSessionId) {
      const session = this.investigation.summarize(input.investigationSessionId);
      evidence.push({
        sourceType: 'investigation',
        source: session.id,
        summary: `${session.title}: ${session.evidence.length} evidence item(s), ${session.hypotheses.length} hypothesis item(s).`,
      });
    }

    if (input.rootPath) {
      const overview = await this.repository.overview({ rootPath: input.rootPath, maxFiles: 200 });
      evidence.push({
        sourceType: 'repository',
        source: overview.rootPath,
        summary: `${overview.fileCount} bounded file(s), top extensions: ${overview.extensionCounts
          .slice(0, 3)
          .map((item) => `${item.extension}:${item.count}`)
          .join(', ')}`,
      });

      const gitHints = await this.git.impactHints({ rootPath: input.rootPath, maxCommits: 20 });
      evidence.push({
        sourceType: 'git',
        source: input.rootPath,
        summary: `${gitHints.analyzedCommits} recent commit(s), ${gitHints.hints.length} changed file hint(s).`,
      });
    }

    if (input.targetSymbols?.length && input.rootPath) {
      for (const symbolName of input.targetSymbols.slice(0, 5)) {
        const result = await this.symbols.searchSymbols({ rootPath: input.rootPath, query: symbolName, maxFiles: 200 });
        evidence.push({
          sourceType: 'symbol',
          source: symbolName,
          summary: `${result.symbols.length} matching bounded symbol(s).`,
        });
      }
    }

    if (input.databaseConnection) {
      const schema = this.database.readSchema(input.databaseConnection);
      evidence.push({
        sourceType: 'database',
        source: input.databaseConnection.databasePath,
        summary: `${schema.tables.length} database table(s) discovered.`,
      });
    }

    return evidence;
  }

  private async estimateFiles(input: CreatePlanInput): Promise<readonly string[]> {
    if (input.targetFiles?.length) {
      return [...new Set(input.targetFiles)];
    }

    if (!input.rootPath) {
      return [];
    }

    const words = input.objective
      .split(/\W+/)
      .map((word) => word.toLowerCase())
      .filter((word) => word.length >= 4)
      .slice(0, 5);
    const matches = new Set<string>();

    for (const word of words) {
      const result = await this.repository.searchFiles({ rootPath: input.rootPath, query: word, maxFiles: 200 });
      for (const file of result.matches.slice(0, 5)) {
        matches.add(file.relativePath);
      }
    }

    return [...matches].slice(0, 20);
  }

  private buildScope(input: CreatePlanInput, level: PlanLevel): readonly string[] {
    const scope = ['Analyze evidence before implementation', 'Produce a reviewable plan before any patch work'];
    if (input.rootPath) {
      scope.push('Use repository and git intelligence for local evidence');
    }
    if (input.databaseConnection) {
      scope.push('Include database schema and relation evidence');
    }
    if (level === 'architecture_change') {
      scope.push('Require explicit architecture review before Phase 7');
    }
    return scope;
  }

  private buildDependencies(input: CreatePlanInput): readonly string[] {
    const dependencies = ['Investigation evidence', 'Repository intelligence'];
    if (input.rootPath) {
      dependencies.push('Git intelligence');
    }
    if (input.targetSymbols?.length) {
      dependencies.push('Symbol intelligence');
    }
    if (input.databaseConnection) {
      dependencies.push('Database intelligence');
    }
    return dependencies;
  }

  private buildSteps(level: PlanLevel): EngineeringPlan['steps'] {
    const steps = [
      'Confirm objective and evidence',
      'Review impacted files, modules, and symbols',
      'Review regression risk and rollback strategy',
      'Request approval before any implementation phase',
    ];
    if (level === 'refactor' || level === 'architecture_change') {
      steps.splice(2, 0, 'Evaluate architecture and module boundaries');
    }

    return steps.map((title, index) => ({
      order: index + 1,
      title,
      description: `${title} for the selected ${level} plan.`,
      status: 'planned',
    }));
  }

  private inferLevel(objective: string, fileCount: number): PlanLevel {
    const normalized = objective.toLowerCase();
    if (normalized.includes('architecture') || normalized.includes('module boundary')) {
      return 'architecture_change';
    }
    if (normalized.includes('refactor') || normalized.includes('cleanup')) {
      return 'refactor';
    }
    if (fileCount <= 1 && (normalized.includes('bug') || normalized.includes('fix'))) {
      return 'quick_fix';
    }
    return 'normal_fix';
  }

  private estimateRisk(level: PlanLevel, fileCount: number, evidenceCount: number): PlanRiskLevel {
    if (level === 'architecture_change' || fileCount > 10 || evidenceCount > 8) {
      return 'high';
    }
    if (level === 'refactor' || fileCount > 3) {
      return 'medium';
    }
    return 'low';
  }

  private resolveStatus(decision: ApprovalGateInput['decision']): EngineeringPlan['status'] {
    if (decision === 'approve') {
      return 'approved';
    }
    if (decision === 'reject') {
      return 'rejected';
    }
    return 'pending_approval';
  }

  private ensureObjective(objective: string): void {
    if (!objective.trim()) {
      throw new PlatformError({
        code: 'INVALID_PLAN_INPUT',
        message: 'Planning objective is required.',
        reason: 'A plan cannot be created without a clear objective.',
        suggestion: 'Provide a concise objective for the requested change.',
      });
    }
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
