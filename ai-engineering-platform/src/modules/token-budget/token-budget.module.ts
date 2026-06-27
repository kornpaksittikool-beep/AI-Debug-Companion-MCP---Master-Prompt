import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { TokenBudgetService } from './services/token-budget.service.js';
import {
  TOKEN_BUDGET_COMPRESS_CONTEXT_TOOL_DEFINITION,
  TOKEN_BUDGET_ESTIMATE_TOOL_DEFINITION,
  TOKEN_BUDGET_RECOMMEND_STRATEGY_TOOL_DEFINITION,
} from './tools/token-budget-tool-schemas.js';
import {
  TokenBudgetCompressContextTool,
  TokenBudgetEstimateTool,
  TokenBudgetRecommendStrategyTool,
} from './tools/token-budget.tools.js';

@Module({
  imports: [CoreModule],
  providers: [
    TokenBudgetService,
    TokenBudgetEstimateTool,
    TokenBudgetCompressContextTool,
    TokenBudgetRecommendStrategyTool,
  ],
  exports: [TokenBudgetService],
})
export class TokenBudgetModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly estimateTool: TokenBudgetEstimateTool,
    private readonly compressContextTool: TokenBudgetCompressContextTool,
    private readonly recommendStrategyTool: TokenBudgetRecommendStrategyTool,
  ) {}

  onModuleInit(): void {
    this.registry.register(TOKEN_BUDGET_ESTIMATE_TOOL_DEFINITION, this.estimateTool);
    this.registry.register(TOKEN_BUDGET_COMPRESS_CONTEXT_TOOL_DEFINITION, this.compressContextTool);
    this.registry.register(TOKEN_BUDGET_RECOMMEND_STRATEGY_TOOL_DEFINITION, this.recommendStrategyTool);
  }
}
