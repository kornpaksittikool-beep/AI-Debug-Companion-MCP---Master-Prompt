import { PlatformError } from '../../src/core/errors/platform-error.js';
import { InvestigationSessionStore } from '../../src/modules/investigation/services/investigation-session.store.js';
import { InvestigationService } from '../../src/modules/investigation/services/investigation.service.js';
import { ProblemClassifierService } from '../../src/modules/investigation/services/problem-classifier.service.js';

function createService(): InvestigationService {
  return new InvestigationService(new InvestigationSessionStore(), new ProblemClassifierService());
}

describe('InvestigationService', () => {
  it('creates a classified investigation session', () => {
    const service = createService();

    const session = service.create({
      input: 'TypeError: Cannot read properties of undefined',
    });

    expect(session.status).toBe('open');
    expect(session.problemType).toBe('error');
    expect(session.evidence).toEqual([]);
  });

  it('adds evidence, hypotheses, visited resources, and closes with conclusion', () => {
    const service = createService();
    const created = service.create({ input: 'Bug in payment flow' });
    const withEvidence = service.addEvidence({
      sessionId: created.id,
      sourceType: 'user_input',
      source: 'issue body',
      summary: 'User reported payment failure.',
    });
    const evidenceId = withEvidence.evidence[0]?.id;
    expect(evidenceId).toBeDefined();

    const withHypothesis = service.addHypothesis({
      sessionId: created.id,
      statement: 'Payment failure may be caused by missing validation.',
      confidence: 'medium',
      evidenceIds: [evidenceId as string],
    });
    expect(withHypothesis.hypotheses).toHaveLength(1);

    const withVisit = service.recordVisit({
      sessionId: created.id,
      type: 'file',
      reference: 'src/payments/payment.service.ts',
      reason: 'Check payment validation flow.',
    });
    expect(withVisit.visitedResources).toHaveLength(1);

    const closed = service.close({
      sessionId: created.id,
      summary: 'Payment validation is the likely cause.',
      rootCause: 'Missing validation guard.',
      evidenceIds: [evidenceId as string],
    });

    expect(closed.status).toBe('closed');
    expect(closed.conclusion?.evidenceIds).toEqual([evidenceId]);
  });

  it('rejects closing without evidence', () => {
    const service = createService();
    const session = service.create({ input: 'Bug report' });

    expect(() =>
      service.close({
        sessionId: session.id,
        summary: 'No evidence.',
      }),
    ).toThrow(PlatformError);
  });

  it('rejects mutation after close', () => {
    const service = createService();
    const session = service.create({ input: 'Bug report' });
    const withEvidence = service.addEvidence({
      sessionId: session.id,
      sourceType: 'user_input',
      source: 'issue',
      summary: 'Evidence summary.',
    });
    service.close({ sessionId: session.id, summary: 'Closed.', evidenceIds: [withEvidence.evidence[0]?.id as string] });

    expect(() =>
      service.addHypothesis({
        sessionId: session.id,
        statement: 'Late hypothesis.',
        confidence: 'low',
      }),
    ).toThrow(PlatformError);
  });
});
