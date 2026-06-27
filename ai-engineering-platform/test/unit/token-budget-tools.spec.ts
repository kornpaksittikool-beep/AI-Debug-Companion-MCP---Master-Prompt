import { TokenBudgetService } from '../../src/modules/token-budget/services/token-budget.service.js';
import {
  TokenBudgetCompressContextTool,
  TokenBudgetEstimateTool,
  TokenBudgetRecommendStrategyTool,
} from '../../src/modules/token-budget/tools/token-budget.tools.js';

describe('Token budget tools', () => {
  const service = new TokenBudgetService();

  it('executes estimate, compression, and strategy handlers', async () => {
    const estimate = await new TokenBudgetEstimateTool(service).execute({
      items: [{ id: 'a', content: '12345678' }],
      budgetTokens: 3,
    });
    const compression = await new TokenBudgetCompressContextTool(service).execute({
      items: [{ id: 'a', content: 'x'.repeat(120), priority: 'high' }],
      maxTokens: 8,
    });
    const strategy = await new TokenBudgetRecommendStrategyTool(service).execute({
      objective: 'inspect phase status',
      currentTokens: 100,
      maxTokens: 1000,
    });

    expect(estimate.estimatedTokens).toBe(2);
    expect(compression.truncated).toBe(true);
    expect(strategy.status).toBe('within_budget');
  });
});
