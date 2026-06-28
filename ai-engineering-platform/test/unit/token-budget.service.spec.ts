import { TokenBudgetService } from '../../src/modules/token-budget/services/token-budget.service.js';

describe('TokenBudgetService', () => {
  const service = new TokenBudgetService();

  it('estimates context token usage and reports budget status', () => {
    const result = service.estimate({
      budgetTokens: 5,
      items: [
        { id: 'small', content: '12345678', priority: 'high' },
        { id: 'large', content: 'x'.repeat(40), priority: 'low' },
      ],
    });

    expect(result.estimatedTokens).toBe(12);
    expect(result.withinBudget).toBe(false);
    expect(result.items[0]).toMatchObject({ id: 'small', estimatedTokens: 2, priority: 'high' });
    expect(result.recommendations).toEqual(expect.arrayContaining(['Compress context or replace broad file reads with symbol-level context.']));
  });

  it('compresses context while preserving high priority content', () => {
    const result = service.compress({
      maxTokens: 10,
      preserveHeadTokens: 3,
      preserveTailTokens: 2,
      items: [
        { id: 'critical', content: 'A'.repeat(80), priority: 'critical' },
        { id: 'low', content: 'B'.repeat(80), priority: 'low' },
      ],
    });

    const critical = result.items.find((item) => item.id === 'critical');
    const low = result.items.find((item) => item.id === 'low');

    expect(result.truncated).toBe(true);
    expect(result.retainedTokens).toBeLessThan(result.originalTokens);
    expect(result.retainedTokens).toBeLessThanOrEqual(10);
    expect(critical?.retainedTokens).toBeGreaterThanOrEqual(low?.retainedTokens ?? 0);
  });

  it('recommends an over-budget evidence gathering strategy', () => {
    const result = service.recommendStrategy({
      objective: 'debug repository issue',
      currentTokens: 9000,
      maxTokens: 4000,
      availableTools: [
        'platform.health',
        'platform.tool_summary',
        'repository.project_profile',
        'repository.search_files',
        'token_budget.estimate',
      ],
    });

    expect(result.status).toBe('over_budget');
    expect(result.preferredTools).toEqual([
      'platform.health',
      'platform.tool_summary',
      'repository.project_profile',
      'repository.search_files',
      'token_budget.estimate',
    ]);
    expect(result.avoid).toContain('Avoid repository.overview unless repository.project_profile is insufficient.');
    expect(result.avoid).toContain('Avoid repository.import_graph unless dependency flow is the current question.');
    expect(result.recommendedFlow).toContain(
      'Compress current context and replace low-priority items with targeted follow-up reads.',
    );
  });
});
