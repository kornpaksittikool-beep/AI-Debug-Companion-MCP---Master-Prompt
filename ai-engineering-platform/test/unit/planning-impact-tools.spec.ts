import { ImpactService } from '../../src/modules/planning-impact/services/impact.service.js';
import { PlanningService } from '../../src/modules/planning-impact/services/planning.service.js';
import {
  PlanningApprovalGateTool,
  PlanningCreatePlanTool,
  PlanningImpactReportTool,
  PlanningSummarizePlanTool,
} from '../../src/modules/planning-impact/tools/planning-impact.tools.js';
import { createPlanningFixture } from './planning-impact.fixture.js';

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected string value.');
  }
  return value;
}

describe('Planning impact tools', () => {
  it('executes plan, impact, approval, and summarize handlers', async () => {
    const fixture = await createPlanningFixture();
    const planning = new PlanningService(
      fixture.store,
      fixture.investigation,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );
    const impact = new ImpactService(
      fixture.store,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );

    const plan = await new PlanningCreatePlanTool(planning).execute({
      objective: 'Fix login validation bug',
      rootPath: fixture.rootPath,
    });
    expect(plan.status).toBe('draft');
    const planId = requireString(plan.id);

    await expect(
      new PlanningImpactReportTool(impact).execute({
        objective: 'Fix login validation bug',
        rootPath: fixture.rootPath,
        planId,
      }),
    ).resolves.toMatchObject({ planId });

    await expect(
      new PlanningApprovalGateTool(planning).execute({
        planId,
        decision: 'approve',
      }),
    ).resolves.toMatchObject({ status: 'approved' });

    await expect(new PlanningSummarizePlanTool(planning).execute({ planId })).resolves.toMatchObject({
      status: 'approved',
    });
  });
});
