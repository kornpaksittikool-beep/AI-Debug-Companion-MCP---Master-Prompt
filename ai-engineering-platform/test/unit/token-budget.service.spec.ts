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
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        'Compress context or replace broad file reads with symbol-level context.',
      ]),
    );
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
        'repository.read_file_excerpt',
        'token_budget.estimate',
      ],
    });

    expect(result.status).toBe('over_budget');
    expect(result.questionProfile.questionType).toBe('debugging');
    expect(result.questionProfile.targetTokenRange).toEqual({ min: 3000, max: 8000 });
    expect(result.preferredTools).toEqual([
      'platform.health',
      'platform.tool_summary',
      'repository.search_files',
      'repository.read_file_excerpt',
      'token_budget.estimate',
    ]);
    expect(result.avoid).toContain(
      'Avoid repository.overview unless repository.project_profile is insufficient.',
    );
    expect(result.avoid).toContain(
      'Avoid repository.read_file_context for summaries; use repository.read_file_excerpt first and stop if the summary is already answerable.',
    );
    expect(result.avoid).toContain(
      'Avoid unbounded repository.search_files; use mode=summary and maxMatches<=8 for project summaries.',
    );
    expect(result.avoid).toContain(
      'Avoid repository.import_graph unless dependency flow is the current question.',
    );
    expect(result.recommendedFlow).toContain(
      'Compress current context and replace low-priority items with targeted follow-up reads.',
    );
  });

  it('returns a summary profile with a 1k-2k target budget', () => {
    const result = service.recommendStrategy({
      objective: 'summarize this project',
      questionType: 'project_summary',
    });

    expect(result.questionProfile).toMatchObject({
      questionType: 'project_summary',
      targetTokenRange: { min: 1000, max: 2000 },
      excerptMaxBytes: 700,
      maxExcerptCalls: 2,
    });
    expect(result.maxTokens).toBe(2000);
    expect(result.doNotCallTools).toEqual(
      expect.arrayContaining([
        'repository.import_graph',
        'repository.search_symbols',
        'repository.read_file_context',
        'repository.overview',
        'platform.metadata',
      ]),
    );
    expect(result.recommendedFlow).toContain(
      'Limit repository.read_file_excerpt to maxBytes <= 700 and no more than 2 call(s) for this question.',
    );
    expect(result.preferredTools).toEqual(
      expect.arrayContaining(['repository.project_profile', 'repository.read_file_excerpt']),
    );
    expect(result.preferredTools).not.toContain('repository.search_symbols');
    expect(result.questionProfile.contextPolicy).toContain(
      'Call repository.search_files with mode=summary and maxMatches<=8 for routine summaries.',
    );
    expect(result.questionProfile.contextPolicy).toContain(
      'Do not run repository.search_symbols for routine summaries; use file search and excerpts instead.',
    );
  });

  it('supports tech stack quick view and code review profiles', () => {
    const techStack = service.recommendStrategy({
      objective: 'quick tech stack and architecture view',
      availableTools: ['platform.health', 'repository.project_profile', 'repository.import_graph'],
    });
    const review = service.recommendStrategy({
      objective: 'review this PR diff for risks',
    });

    expect(techStack.questionProfile.questionType).toBe('tech_stack_quick_view');
    expect(techStack.questionProfile.targetTokenRange).toEqual({ min: 1500, max: 2500 });
    expect(techStack.preferredTools).toEqual(['platform.health', 'repository.project_profile']);
    expect(review.questionProfile.questionType).toBe('code_review');
    expect(review.doNotCallTools).toContain('repository.scan');
    expect(review.questionProfile.contextPolicy).toContain(
      'Read only diffs, changed files, impacted symbols, and directly related tests.',
    );
  });

  it('uses planning profile for roadmap and phase planning objectives', () => {
    const result = service.recommendStrategy({
      objective: 'plan Phase 28 from roadmap and TODO excerpts',
    });

    expect(result.questionProfile.questionType).toBe('planning');
    expect(result.questionProfile.targetTokenRange).toEqual({ min: 2000, max: 6000 });
    expect(result.recommendedFlow).toContain(
      'Use roadmap, TODO, phase-report excerpts, and target file excerpts instead of full historical reads.',
    );
  });
});
