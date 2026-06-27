import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';

export type InvestigationStatus = 'open' | 'closed';

export type ProblemType =
  | 'error'
  | 'stack_trace'
  | 'log'
  | 'screenshot'
  | 'issue'
  | 'feature_request'
  | 'unknown';

export type EvidenceSourceType =
  | 'user_input'
  | 'file'
  | 'log'
  | 'stack_trace'
  | 'test_result'
  | 'build_result'
  | 'api_contract'
  | 'database_schema'
  | 'git_history'
  | 'other';

export type VisitedResourceType = 'file' | 'api' | 'database_table' | 'log' | 'command' | 'url';

export type HypothesisConfidence = 'low' | 'medium' | 'high';

export interface Evidence {
  readonly id: string;
  readonly sourceType: EvidenceSourceType;
  readonly source: string;
  readonly summary: string;
  readonly detail?: string;
  readonly metadata: JsonSchemaObject;
  readonly createdAt: string;
}

export interface Hypothesis {
  readonly id: string;
  readonly statement: string;
  readonly confidence: HypothesisConfidence;
  readonly evidenceIds: readonly string[];
  readonly createdAt: string;
}

export interface VisitedResource {
  readonly id: string;
  readonly type: VisitedResourceType;
  readonly reference: string;
  readonly reason: string;
  readonly createdAt: string;
}

export interface InvestigationConclusion {
  readonly summary: string;
  readonly rootCause?: string;
  readonly evidenceIds: readonly string[];
  readonly createdAt: string;
}

export interface InvestigationSession {
  readonly id: string;
  readonly status: InvestigationStatus;
  readonly problemType: ProblemType;
  readonly title: string;
  readonly initialInput: string;
  readonly evidence: readonly Evidence[];
  readonly hypotheses: readonly Hypothesis[];
  readonly visitedResources: readonly VisitedResource[];
  readonly conclusion?: InvestigationConclusion;
  readonly createdAt: string;
  readonly updatedAt: string;
}
