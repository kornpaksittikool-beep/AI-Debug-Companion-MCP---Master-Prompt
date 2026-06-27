import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type {
  AddEvidenceInputDto,
  AddHypothesisInputDto,
  CloseInvestigationInputDto,
  CreateInvestigationInputDto,
  RecordVisitInputDto,
} from '../dto/investigation.dto.js';
import type {
  Evidence,
  Hypothesis,
  InvestigationConclusion,
  InvestigationSession,
  VisitedResource,
} from '../interfaces/investigation-session.interface.js';
import { InvestigationSessionStore } from './investigation-session.store.js';
import { ProblemClassifierService } from './problem-classifier.service.js';

@Injectable()
export class InvestigationService {
  constructor(
    private readonly store: InvestigationSessionStore,
    private readonly classifier: ProblemClassifierService,
  ) {}

  create(input: CreateInvestigationInputDto): InvestigationSession {
    this.ensureNonEmpty(input.input, 'input');

    const now = new Date().toISOString();
    const session: InvestigationSession = {
      id: this.createId('inv'),
      status: 'open',
      problemType: input.problemType ?? this.classifier.classify(input.input),
      title: input.title?.trim() || this.deriveTitle(input.input),
      initialInput: input.input,
      evidence: [],
      hypotheses: [],
      visitedResources: [],
      createdAt: now,
      updatedAt: now,
    };

    return this.store.save(session);
  }

  addEvidence(input: AddEvidenceInputDto): InvestigationSession {
    const session = this.getOpenSession(input.sessionId);
    this.ensureNonEmpty(input.source, 'source');
    this.ensureNonEmpty(input.summary, 'summary');

    const evidence: Evidence = {
      id: this.createId('ev'),
      sourceType: input.sourceType,
      source: input.source,
      summary: input.summary,
      ...(input.detail ? { detail: input.detail } : {}),
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    return this.updateSession({
      ...session,
      evidence: [...session.evidence, evidence],
    });
  }

  addHypothesis(input: AddHypothesisInputDto): InvestigationSession {
    const session = this.getOpenSession(input.sessionId);
    this.ensureNonEmpty(input.statement, 'statement');
    this.ensureEvidenceExists(session, input.evidenceIds ?? []);

    const hypothesis: Hypothesis = {
      id: this.createId('hyp'),
      statement: input.statement,
      confidence: input.confidence,
      evidenceIds: input.evidenceIds ?? [],
      createdAt: new Date().toISOString(),
    };

    return this.updateSession({
      ...session,
      hypotheses: [...session.hypotheses, hypothesis],
    });
  }

  recordVisit(input: RecordVisitInputDto): InvestigationSession {
    const session = this.getOpenSession(input.sessionId);
    this.ensureNonEmpty(input.reference, 'reference');
    this.ensureNonEmpty(input.reason, 'reason');

    const visitedResource: VisitedResource = {
      id: this.createId('visit'),
      type: input.type,
      reference: input.reference,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };

    return this.updateSession({
      ...session,
      visitedResources: [...session.visitedResources, visitedResource],
    });
  }

  summarize(sessionId: string): InvestigationSession {
    return this.store.get(sessionId);
  }

  close(input: CloseInvestigationInputDto): InvestigationSession {
    const session = this.getOpenSession(input.sessionId);
    this.ensureNonEmpty(input.summary, 'summary');

    if (session.evidence.length === 0) {
      throw new PlatformError({
        code: 'INSUFFICIENT_EVIDENCE',
        message: 'Investigation cannot be closed without evidence.',
        reason: 'Evidence-first workflow requires at least one evidence item before conclusion.',
        suggestion: 'Add traceable evidence before closing the investigation.',
      });
    }

    const evidenceIds = input.evidenceIds ?? session.evidence.map((evidence) => evidence.id);
    this.ensureEvidenceExists(session, evidenceIds);

    const conclusion: InvestigationConclusion = {
      summary: input.summary,
      ...(input.rootCause ? { rootCause: input.rootCause } : {}),
      evidenceIds,
      createdAt: new Date().toISOString(),
    };

    return this.updateSession({
      ...session,
      status: 'closed',
      conclusion,
    });
  }

  private getOpenSession(sessionId: string): InvestigationSession {
    const session = this.store.get(sessionId);

    if (session.status !== 'open') {
      throw new PlatformError({
        code: 'INVALID_INVESTIGATION_STATUS',
        message: `Investigation session "${sessionId}" is not open.`,
        reason: 'Closed investigations cannot be modified.',
        suggestion: 'Create a new investigation session for additional work.',
      });
    }

    return session;
  }

  private updateSession(session: InvestigationSession): InvestigationSession {
    return this.store.save({
      ...session,
      updatedAt: new Date().toISOString(),
    });
  }

  private ensureEvidenceExists(session: InvestigationSession, evidenceIds: readonly string[]): void {
    const existingIds = new Set(session.evidence.map((evidence) => evidence.id));
    const missingId = evidenceIds.find((evidenceId) => !existingIds.has(evidenceId));

    if (missingId) {
      throw new PlatformError({
        code: 'EVIDENCE_NOT_FOUND',
        message: `Evidence "${missingId}" was not found.`,
        reason: 'The hypothesis or conclusion references evidence outside the investigation session.',
        suggestion: 'Use evidence IDs returned from the target investigation session.',
      });
    }
  }

  private ensureNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new PlatformError({
        code: 'INVALID_INVESTIGATION_INPUT',
        message: `Field "${fieldName}" is required.`,
        reason: 'Investigation records require meaningful traceable content.',
        suggestion: `Provide a non-empty "${fieldName}" value.`,
      });
    }
  }

  private deriveTitle(input: string): string {
    return input.trim().slice(0, 80) || 'Untitled investigation';
  }

  private createId(prefix: string): string {
    return `${prefix}_${createCorrelationId().slice(5)}`;
  }
}
