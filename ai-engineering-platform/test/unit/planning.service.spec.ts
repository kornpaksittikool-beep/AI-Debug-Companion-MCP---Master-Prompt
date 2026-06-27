import { PlanningService } from '../../src/modules/planning-impact/services/planning.service.js';
import { createPlanningFixture } from './planning-impact.fixture.js';

describe('PlanningService', () => {
  it('creates an evidence-backed plan with risk, rollback, and verification strategy', async () => {
    const fixture = await createPlanningFixture();
    const service = new PlanningService(
      fixture.store,
      fixture.investigation,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );

    const plan = await service.createPlan({
      objective: 'Fix login validation bug',
      rootPath: fixture.rootPath,
      targetSymbols: ['LoginService'],
    });

    expect(plan.status).toBe('draft');
    expect(plan.level).toBe('quick_fix');
    expect(plan.evidence.map((item) => item.sourceType)).toEqual(
      expect.arrayContaining(['user_input', 'repository', 'git', 'symbol']),
    );
    expect(plan.rollbackPlan.requiredBeforeExecution).toHaveLength(2);
    expect(plan.verificationPlan.commands).toContain('pnpm.cmd test:cov');
  });

  it('updates approval state without executing patches', async () => {
    const fixture = await createPlanningFixture();
    const service = new PlanningService(
      fixture.store,
      fixture.investigation,
      fixture.repository,
      fixture.symbols,
      fixture.database,
      fixture.git,
    );
    const plan = await service.createPlan({ objective: 'Refactor auth module' });

    const approval = service.approvalGate({
      planId: plan.id,
      decision: 'request_approval',
      reason: 'Ready for review',
    });

    expect(approval.status).toBe('pending_approval');
    expect(service.summarizePlan({ planId: plan.id }).status).toBe('pending_approval');
  });
});
