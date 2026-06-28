import { Injectable } from '@nestjs/common';
import type {
  CompressedContextItem,
  ContextCompressionOptions,
  ContextCompressionResult,
  ContextItem,
  ContextItemEstimate,
  ContextPriority,
  StrategyRecommendationOptions,
  StrategyRecommendationResult,
  TokenEstimateOptions,
  TokenEstimateResult,
} from '../interfaces/token-budget.interface.js';

const DEFAULT_CHARS_PER_TOKEN = 4;
const DEFAULT_HEAD_TOKENS = 24;
const DEFAULT_TAIL_TOKENS = 12;
const PRIORITY_WEIGHT: Record<ContextPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

@Injectable()
export class TokenBudgetService {
  estimate(input: TokenEstimateOptions): TokenEstimateResult {
    const charsPerToken = this.normalizedCharsPerToken(input.charsPerToken);
    const items = input.items.map((item) => this.estimateItem(item, charsPerToken));
    const totalCharacters = items.reduce((sum, item) => sum + item.characters, 0);
    const estimatedTokens = items.reduce((sum, item) => sum + item.estimatedTokens, 0);
    return {
      totalCharacters,
      estimatedTokens,
      ...(input.budgetTokens === undefined
        ? {}
        : { budgetTokens: input.budgetTokens, withinBudget: estimatedTokens <= input.budgetTokens }),
      items,
      recommendations: this.estimateRecommendations(estimatedTokens, input.budgetTokens, items),
    };
  }

  compress(input: ContextCompressionOptions): ContextCompressionResult {
    const charsPerToken = this.normalizedCharsPerToken(input.charsPerToken);
    const maxTokens = Math.max(1, Math.floor(input.maxTokens));
    const estimates = input.items.map((item) => this.estimateItem(item, charsPerToken));
    const originalTokens = estimates.reduce((sum, item) => sum + item.estimatedTokens, 0);

    if (originalTokens <= maxTokens) {
      return this.uncompressedResult(input.items, estimates, maxTokens, originalTokens);
    }

    const allocations = this.allocateTokens(estimates, maxTokens);
    const items = input.items.map((item, index) => {
      const estimate = estimates[index];
      const allocatedTokens = allocations[index];
      if (!estimate || allocatedTokens === undefined) {
        throw new Error(`Missing token allocation for context item ${item.id}.`);
      }
      return this.compressItem(
        item,
        estimate,
        allocatedTokens,
        charsPerToken,
        input.preserveHeadTokens ?? DEFAULT_HEAD_TOKENS,
        input.preserveTailTokens ?? DEFAULT_TAIL_TOKENS,
      );
    });
    const retainedTokens = items.reduce((sum, item) => sum + item.retainedTokens, 0);

    return {
      maxTokens,
      originalTokens,
      retainedTokens,
      reducedTokens: Math.max(0, originalTokens - retainedTokens),
      compressionRatio: Number((retainedTokens / originalTokens).toFixed(4)),
      truncated: items.some((item) => item.truncated),
      items,
      recommendations: [
        'Use compressed context as a routing artifact, then request precise symbol or file context only for unresolved evidence.',
        'Prefer repository.search_files and repository.search_symbols before expanding broad module context.',
      ],
    };
  }

  recommendStrategy(input: StrategyRecommendationOptions): StrategyRecommendationResult {
    const status = this.strategyStatus(input.currentTokens, input.maxTokens);
    const availableTools = new Set(input.availableTools ?? []);
    const preferredTools = [
      'platform.health',
      'platform.tool_summary',
      'repository.project_profile',
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
      'token_budget.estimate',
      'token_budget.compress_context',
      'planning.create_plan',
    ].filter((tool) => availableTools.size === 0 || availableTools.has(tool));

    return {
      objective: input.objective,
      ...(input.currentTokens === undefined ? {} : { currentTokens: input.currentTokens }),
      ...(input.maxTokens === undefined ? {} : { maxTokens: input.maxTokens }),
      status,
      recommendedFlow: this.recommendedFlow(status),
      preferredTools,
      avoid: [
        'Avoid reading the whole repository into model context.',
        'Avoid repository.overview unless repository.project_profile is insufficient.',
        'Avoid repository.read_file_context for summaries; use repository.read_file_excerpt first.',
        'Avoid repository.import_graph unless dependency flow is the current question.',
        'Avoid expanding module context before file or symbol evidence narrows the target.',
        'Avoid sending generated coverage or build artifacts unless they are the investigation target.',
      ],
    };
  }

  private estimateItem(item: ContextItem, charsPerToken: number): ContextItemEstimate {
    return {
      id: item.id,
      ...(item.kind ? { kind: item.kind } : {}),
      ...(item.source ? { source: item.source } : {}),
      priority: item.priority ?? 'medium',
      characters: item.content.length,
      estimatedTokens: this.estimateTokens(item.content, charsPerToken),
    };
  }

  private estimateTokens(content: string, charsPerToken: number): number {
    if (content.length === 0) {
      return 0;
    }
    return Math.ceil(content.length / charsPerToken);
  }

  private normalizedCharsPerToken(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      return DEFAULT_CHARS_PER_TOKEN;
    }
    return value;
  }

  private estimateRecommendations(
    estimatedTokens: number,
    budgetTokens: number | undefined,
    items: readonly ContextItemEstimate[],
  ): readonly string[] {
    const largest = [...items].sort((a, b) => b.estimatedTokens - a.estimatedTokens)[0];
    const recommendations = ['Use token estimates before requesting broad context from repository tools.'];

    if (budgetTokens !== undefined && estimatedTokens > budgetTokens) {
      recommendations.push('Compress context or replace broad file reads with symbol-level context.');
    }
    if (largest && largest.estimatedTokens > estimatedTokens * 0.5) {
      recommendations.push(`Narrow or split the largest context item: ${largest.id}.`);
    }

    return recommendations;
  }

  private allocateTokens(estimates: readonly ContextItemEstimate[], maxTokens: number): readonly number[] {
    const totalWeight = estimates.reduce(
      (sum, item) => sum + PRIORITY_WEIGHT[item.priority] * Math.max(1, item.estimatedTokens),
      0,
    );

    return estimates.map((item) => {
      const weightedShare = (PRIORITY_WEIGHT[item.priority] * Math.max(1, item.estimatedTokens)) / totalWeight;
      return Math.min(item.estimatedTokens, Math.max(1, Math.floor(maxTokens * weightedShare)));
    });
  }

  private compressItem(
    item: ContextItem,
    estimate: ContextItemEstimate,
    allocatedTokens: number,
    charsPerToken: number,
    preserveHeadTokens: number,
    preserveTailTokens: number,
  ): CompressedContextItem {
    if (estimate.estimatedTokens <= allocatedTokens) {
      return {
        ...estimate,
        content: item.content,
        originalTokens: estimate.estimatedTokens,
        retainedTokens: estimate.estimatedTokens,
        truncated: false,
      };
    }

    const maxCharacters = Math.max(1, Math.floor(allocatedTokens * charsPerToken));
    const marker = '\n...[context compressed]...\n';
    const content =
      maxCharacters <= marker.length + 2
        ? item.content.slice(0, maxCharacters)
        : this.sliceWithCompressionMarker(item.content, maxCharacters, marker, preserveHeadTokens, preserveTailTokens, charsPerToken);

    return {
      ...estimate,
      content,
      originalTokens: estimate.estimatedTokens,
      retainedTokens: this.estimateTokens(content, charsPerToken),
      truncated: true,
    };
  }

  private sliceWithCompressionMarker(
    content: string,
    maxCharacters: number,
    marker: string,
    preserveHeadTokens: number,
    preserveTailTokens: number,
    charsPerToken: number,
  ): string {
    const requestedTailCharacters = Math.floor(preserveTailTokens * charsPerToken);
    const tailCharacters = Math.min(requestedTailCharacters, Math.max(0, maxCharacters - marker.length - 1));
    const requestedHeadCharacters = Math.floor(preserveHeadTokens * charsPerToken);
    const headCharacters = Math.min(
      requestedHeadCharacters,
      Math.max(1, maxCharacters - marker.length - tailCharacters),
    );
    const retainedHead = content.slice(0, headCharacters);
    const retainedTail =
      tailCharacters > 0 && retainedHead.length + marker.length + tailCharacters < content.length
        ? content.slice(content.length - tailCharacters)
        : '';

    return `${retainedHead}${marker}${retainedTail}`.slice(0, maxCharacters);
  }

  private uncompressedResult(
    sourceItems: readonly ContextItem[],
    estimates: readonly ContextItemEstimate[],
    maxTokens: number,
    originalTokens: number,
  ): ContextCompressionResult {
    const items = sourceItems.map((item, index) => {
      const estimate = estimates[index];
      if (!estimate) {
        throw new Error(`Missing token estimate for context item ${item.id}.`);
      }
      return {
        ...estimate,
        content: item.content,
        originalTokens: estimate.estimatedTokens,
        retainedTokens: estimate.estimatedTokens,
        truncated: false,
      };
    });

    return {
      maxTokens,
      originalTokens,
      retainedTokens: originalTokens,
      reducedTokens: 0,
      compressionRatio: originalTokens === 0 ? 1 : 1,
      truncated: false,
      items,
      recommendations: ['Context is already within budget.'],
    };
  }

  private strategyStatus(
    currentTokens: number | undefined,
    maxTokens: number | undefined,
  ): StrategyRecommendationResult['status'] {
    if (currentTokens === undefined || maxTokens === undefined) {
      return 'unknown';
    }
    return currentTokens <= maxTokens ? 'within_budget' : 'over_budget';
  }

  private recommendedFlow(status: StrategyRecommendationResult['status']): readonly string[] {
    const base = [
      'Verify MCP health before gathering broad context.',
      'Collect compact project profile, file matches, and symbol evidence first.',
      'Use file excerpts before full file context for summaries.',
      'Estimate token cost before expanding context.',
    ];

    if (status === 'over_budget') {
      return [...base, 'Compress current context and replace low-priority items with targeted follow-up reads.'];
    }
    return [...base, 'Read only the smallest file, symbol, or module context needed for the next decision.'];
  }
}
