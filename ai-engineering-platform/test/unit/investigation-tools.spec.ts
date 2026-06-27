import { InvestigationSessionStore } from '../../src/modules/investigation/services/investigation-session.store.js';
import { InvestigationService } from '../../src/modules/investigation/services/investigation.service.js';
import { ProblemClassifierService } from '../../src/modules/investigation/services/problem-classifier.service.js';
import {
  InvestigationAddEvidenceTool,
  InvestigationCloseTool,
  InvestigationCreateTool,
  InvestigationSummarizeTool,
} from '../../src/modules/investigation/tools/investigation.tools.js';

function createService(): InvestigationService {
  return new InvestigationService(new InvestigationSessionStore(), new ProblemClassifierService());
}

describe('Investigation tools', () => {
  it('creates, updates, summarizes, and closes a session through tool handlers', async () => {
    const service = createService();
    const createTool = new InvestigationCreateTool(service);
    const evidenceTool = new InvestigationAddEvidenceTool(service);
    const summarizeTool = new InvestigationSummarizeTool(service);
    const closeTool = new InvestigationCloseTool(service);

    const created = await createTool.execute({ input: 'Error in checkout' });
    const sessionId = created.id as string;
    const withEvidence = await evidenceTool.execute({
      sessionId,
      sourceType: 'user_input',
      source: 'user report',
      summary: 'Checkout error reported.',
    });
    const evidence = withEvidence.evidence as readonly { id: string }[];
    const evidenceId = evidence[0]?.id;
    expect(evidenceId).toBeDefined();

    await expect(summarizeTool.execute({ sessionId })).resolves.toMatchObject({ id: sessionId });
    await expect(
      closeTool.execute({
        sessionId,
        summary: 'Evidence collected.',
        evidenceIds: [evidenceId as string],
      }),
    ).resolves.toMatchObject({ status: 'closed' });
  });
});
