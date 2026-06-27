import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('TokenBudgetModule integration', () => {
  it('registers token budget tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'token_budget.estimate',
        'token_budget.compress_context',
        'token_budget.recommend_strategy',
      ]),
    );

    await moduleRef.close();
  });

  it('executes token estimate through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const result = await execution.execute({
      toolName: 'token_budget.estimate',
      input: {
        items: [{ id: 'readme', content: '12345678' }],
        budgetTokens: 10,
      },
      correlationId: 'corr_token_budget',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatchObject({ estimatedTokens: 2, withinBudget: true });
    }

    await moduleRef.close();
  });
});
