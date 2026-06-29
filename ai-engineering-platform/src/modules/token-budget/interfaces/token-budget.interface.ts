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

export type TokenQuestionType =
  | 'project_summary'
  | 'tech_stack_quick_view'
  | 'debugging'
  | 'code_review'
  | 'planning'
  | 'general';

export type ReportMode = 'normal_user_summary' | 'debug_telemetry';

export interface SummaryFallbackPolicy {
  readonly neverUseBroadFileContext: boolean;
  readonly fallbackOrder: readonly string[];
}

export interface StrategyRecommendationOptions {
  readonly objective: string;
  readonly questionType?: TokenQuestionType;
  readonly currentTokens?: number;
  readonly maxTokens?: number;
  readonly availableTools?: readonly string[];
}

export interface StrategyQuestionProfile {
  readonly questionType: TokenQuestionType;
  readonly gateMode: 'compact_read_only' | 'expanded_execution';
  readonly defaultReportMode: ReportMode;
  readonly debugReportTriggers: readonly string[];
  readonly targetTokenRange: {
    readonly min: number;
    readonly max: number;
  };
  readonly excerptMaxBytes: number;
  readonly maxExcerptCalls: number;
  readonly startTools: readonly string[];
  readonly evidenceTools: readonly string[];
  readonly escalationTools: readonly string[];
  readonly contextPolicy: readonly string[];
  readonly workflowAcceptanceCriteria?: readonly string[];
  readonly fallbackPolicy?: SummaryFallbackPolicy;
  readonly doNotCallTools: readonly string[];
}

export interface StrategyRecommendationResult {
  readonly objective: string;
  readonly questionProfile: StrategyQuestionProfile;
  readonly currentTokens?: number;
  readonly maxTokens?: number;
  readonly status: 'within_budget' | 'over_budget' | 'unknown';
  readonly recommendedFlow: readonly string[];
  readonly preferredTools: readonly string[];
  readonly avoid: readonly string[];
  readonly doNotCallTools: readonly string[];
}
