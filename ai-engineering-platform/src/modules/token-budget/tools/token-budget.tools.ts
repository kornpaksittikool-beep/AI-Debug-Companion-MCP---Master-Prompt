import { Injectable } from '@nestjs/common';
import type { JsonSchemaObject } from '../../../core/registry/interfaces/json-schema.interface.js';
import type { ToolHandler } from '../../../core/registry/interfaces/tool-handler.interface.js';
import type {
  ContextCompressionInputDto,
  StrategyRecommendationInputDto,
  TokenEstimateInputDto,
} from '../dto/token-budget.dto.js';
import { TokenBudgetService } from '../services/token-budget.service.js';

@Injectable()
export class TokenBudgetEstimateTool implements ToolHandler {
  constructor(private readonly service: TokenBudgetService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(this.service.estimate(input as unknown as TokenEstimateInputDto) as unknown as JsonSchemaObject);
  }
}

@Injectable()
export class TokenBudgetCompressContextTool implements ToolHandler {
  constructor(private readonly service: TokenBudgetService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.compress(input as unknown as ContextCompressionInputDto) as unknown as JsonSchemaObject,
    );
  }
}

@Injectable()
export class TokenBudgetRecommendStrategyTool implements ToolHandler {
  constructor(private readonly service: TokenBudgetService) {}

  execute(input: JsonSchemaObject): Promise<JsonSchemaObject> {
    return Promise.resolve(
      this.service.recommendStrategy(input as unknown as StrategyRecommendationInputDto) as unknown as JsonSchemaObject,
    );
  }
}
