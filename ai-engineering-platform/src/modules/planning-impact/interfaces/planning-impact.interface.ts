import type { DatabaseConnectionConfig } from '../../database-intelligence/interfaces/database-intelligence.interface.js';

export type PlanLevel = 'quick_fix' | 'normal_fix' | 'refactor' | 'architecture_change';

export type PlanStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export type PlanRiskLevel = 'low' | 'medium' | 'high';

export interface PlanningEvidenceReference {
  readonly sourceType: 'investigation' | 'repository' | 'symbol' | 'database' | 'git' | 'user_input';
  readonly source: string;
  readonly summary: string;
}

export interface PlanningStep {
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly status: 'planned' | 'blocked' | 'completed';
}

export interface RollbackPlan {
  readonly strategy: string;
  readonly requiredBeforeExecution: readonly string[];
}

export interface VerificationPlan {
  readonly commands: readonly string[];
  readonly manualChecks: readonly string[];
}

export interface EngineeringPlan {
  readonly id: string;
  readonly objective: string;
  readonly level: PlanLevel;
  readonly status: PlanStatus;
  readonly scope: readonly string[];
  readonly dependencies: readonly string[];
  readonly estimatedFiles: readonly string[];
  readonly estimatedRisk: PlanRiskLevel;
  readonly evidence: readonly PlanningEvidenceReference[];
  readonly steps: readonly PlanningStep[];
  readonly rollbackPlan: RollbackPlan;
  readonly verificationPlan: VerificationPlan;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePlanInput {
  readonly objective: string;
  readonly rootPath?: string;
  readonly investigationSessionId?: string;
  readonly level?: PlanLevel;
  readonly targetFiles?: readonly string[];
  readonly targetSymbols?: readonly string[];
  readonly databaseConnection?: DatabaseConnectionConfig;
}

export interface ImpactArea {
  readonly area: 'files' | 'modules' | 'apis' | 'database' | 'frontend' | 'backend' | 'cache' | 'queue' | 'workers' | 'events';
  readonly items: readonly string[];
  readonly risk: PlanRiskLevel;
  readonly reason: string;
}

export interface ImpactReport {
  readonly id: string;
  readonly objective: string;
  readonly rootPath?: string;
  readonly planId?: string;
  readonly areas: readonly ImpactArea[];
  readonly regressionRisk: PlanRiskLevel;
  readonly evidence: readonly PlanningEvidenceReference[];
  readonly createdAt: string;
}

export interface ImpactReportInput {
  readonly objective: string;
  readonly rootPath?: string;
  readonly planId?: string;
  readonly targetFiles?: readonly string[];
  readonly targetSymbols?: readonly string[];
  readonly databaseConnection?: DatabaseConnectionConfig;
  readonly maxGitCommits?: number;
}

export interface ApprovalGateInput {
  readonly planId: string;
  readonly decision: 'request_approval' | 'approve' | 'reject';
  readonly reason?: string;
}

export interface ApprovalGateResult {
  readonly planId: string;
  readonly status: PlanStatus;
  readonly decision: ApprovalGateInput['decision'];
  readonly reason?: string;
  readonly updatedAt: string;
}

export interface SummarizePlanInput {
  readonly planId: string;
}
