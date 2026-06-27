export type ContextPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ContextItem {
  readonly id: string;
  readonly content: string;
  readonly kind?: string;
  readonly source?: string;
  readonly priority?: ContextPriority;
}

export interface TokenEstimateOptions {
  readonly items: readonly ContextItem[];
  readonly budgetTokens?: number;
  readonly charsPerToken?: number;
}

export interface ContextItemEstimate {
  readonly id: string;
  readonly kind?: string;
  readonly source?: string;
  readonly priority: ContextPriority;
  readonly characters: number;
  readonly estimatedTokens: number;
}

export interface TokenEstimateResult {
  readonly totalCharacters: number;
  readonly estimatedTokens: number;
  readonly budgetTokens?: number;
  readonly withinBudget?: boolean;
  readonly items: readonly ContextItemEstimate[];
  readonly recommendations: readonly string[];
}

export interface ContextCompressionOptions extends TokenEstimateOptions {
  readonly maxTokens: number;
  readonly preserveHeadTokens?: number;
  readonly preserveTailTokens?: number;
}

export interface CompressedContextItem extends ContextItemEstimate {
  readonly content: string;
  readonly originalTokens: number;
  readonly retainedTokens: number;
  readonly truncated: boolean;
}

export interface ContextCompressionResult {
  readonly maxTokens: number;
  readonly originalTokens: number;
  readonly retainedTokens: number;
  readonly reducedTokens: number;
  readonly compressionRatio: number;
  readonly truncated: boolean;
  readonly items: readonly CompressedContextItem[];
  readonly recommendations: readonly string[];
}

export interface StrategyRecommendationOptions {
  readonly objective: string;
  readonly currentTokens?: number;
  readonly maxTokens?: number;
  readonly availableTools?: readonly string[];
}

export interface StrategyRecommendationResult {
  readonly objective: string;
  readonly currentTokens?: number;
  readonly maxTokens?: number;
  readonly status: 'within_budget' | 'over_budget' | 'unknown';
  readonly recommendedFlow: readonly string[];
  readonly preferredTools: readonly string[];
  readonly avoid: readonly string[];
}
