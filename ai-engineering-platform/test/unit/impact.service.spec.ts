import { ImpactService } from '../../src/modules/planning-impact/services/impact.service.js';
import { PlanningService } from '../../src/modules/planning-impact/services/planning.service.js';
import { createPlanningFixture } from './planning-impact.fixture.js';

describe('ImpactService', () => {
  it('creates a read-only impact report from plan, repository, symbol, and git evidence', async () => {
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
    const plan = await planning.createPlan({
      objective: 'Fix login validation bug',
      rootPath: fixture.rootPath,
      targetFiles: ['src/auth/login.service.ts'],
      targetSymbols: ['LoginService'],
    });

    const report = await impact.createImpactReport({
      objective: plan.objective,
      rootPath: fixture.rootPath,
      planId: plan.id,
      targetSymbols: ['LoginService'],
    });

    expect(report.planId).toBe(plan.id);
    expect(report.areas.map((area) => area.area)).toEqual(
      expect.arrayContaining(['files', 'modules', 'backend', 'apis', 'cache', 'queue', 'workers', 'events']),
    );
    expect(report.evidence.map((item) => item.sourceType)).toEqual(
      expect.arrayContaining(['repository', 'git', 'symbol']),
    );
  });
});
