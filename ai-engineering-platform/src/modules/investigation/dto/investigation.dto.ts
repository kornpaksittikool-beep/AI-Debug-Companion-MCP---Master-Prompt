import type {
  EvidenceSourceType,
  HypothesisConfidence,
  ProblemType,
  VisitedResourceType,
} from '../interfaces/investigation-session.interface.js';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';

export interface CreateInvestigationInputDto {
  readonly title?: string;
  readonly input: string;
  readonly problemType?: ProblemType;
}

export interface AddEvidenceInputDto {
  readonly sessionId: string;
  readonly sourceType: EvidenceSourceType;
  readonly source: string;
  readonly summary: string;
  readonly detail?: string;
  readonly metadata?: JsonSchemaObject;
}

export interface AddHypothesisInputDto {
  readonly sessionId: string;
  readonly statement: string;
  readonly confidence: HypothesisConfidence;
  readonly evidenceIds?: readonly string[];
}

export interface RecordVisitInputDto {
  readonly sessionId: string;
  readonly type: VisitedResourceType;
  readonly reference: string;
  readonly reason: string;
}

export interface SummarizeInvestigationInputDto {
  readonly sessionId: string;
}

export interface CloseInvestigationInputDto {
  readonly sessionId: string;
  readonly summary: string;
  readonly rootCause?: string;
  readonly evidenceIds?: readonly string[];
}
