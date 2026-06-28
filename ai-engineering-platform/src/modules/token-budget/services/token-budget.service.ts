import { Injectable } from '@nestjs/common';
import type {
  CompressedContextItem,
  ContextCompressionOptions,
  ContextCompressionResult,
  ContextItem,
  ContextItemEstimate,
  ContextPriority,
  StrategyQuestionProfile,
  StrategyRecommendationOptions,
  StrategyRecommendationResult,
  TokenQuestionType,
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
const QUESTION_PROFILES: Record<TokenQuestionType, StrategyQuestionProfile> = {
  project_summary: {
    questionType: 'project_summary',
    gateMode: 'compact_read_only',
    targetTokenRange: { min: 1000, max: 2000 },
    excerptMaxBytes: 700,
    maxExcerptCalls: 2,
    startTools: ['platform.health', 'repository.project_profile'],
    evidenceTools: ['repository.read_file_excerpt'],
    escalationTools: [
      'repository.search_files',
      'repository.search_symbols',
      'repository.overview',
      'repository.read_file_context',
    ],
    contextPolicy: [
      'Start every explicit skill response with a Workflow Gate; use compact_read_only mode for routine summaries.',
      'For compact_read_only mode, keep the gate to 4-5 short lines while preserving objective, evidence, impact, approval, verification, and MCP route.',
      'For read-only project summaries, set Impact to "No file changes", Approval to "Not required: read-only", and Verification to evidence/tool output plus the telemetry footer.',
      'Use repository.project_profile with mode=summary as the primary summary artifact.',
      'Skip platform.tool_summary for explicit project summaries unless tool availability is unclear.',
      'Stop after repository.project_profile plus README/package excerpts when those answer the summary.',
      'Do not call repository.search_files for routine summaries unless README/package cannot be found from the profile.',
      'Do not run repository.search_symbols for routine summaries; use file search and excerpts instead.',
      'Read 1 repository.read_file_excerpt result when possible, and at most 2 for README, manifests, or entry points.',
      'Pass purpose=summary and maxBytes <= 700 for summary excerpts.',
      'Do not read docs/architecture.md, source tree summaries, or app module excerpts unless the user explicitly asks for architecture or module details.',
      'Avoid dependency graphs unless dependency flow is explicitly requested.',
    ],
    doNotCallTools: [
      'repository.import_graph',
      'repository.call_graph',
      'repository.search_files for routine summaries when README/package are present in repository.project_profile',
      'repository.search_symbols',
      'repository.read_module_context',
      'repository.read_file_context',
      'repository.overview',
      'repository.read_file_excerpt for docs/architecture.md or src/app.module.ts during routine summaries',
      'platform.tool_summary for explicit project summaries when repository.project_profile is available',
      'platform.metadata',
    ],
  },
  tech_stack_quick_view: {
    questionType: 'tech_stack_quick_view',
    gateMode: 'compact_read_only',
    targetTokenRange: { min: 1500, max: 2500 },
    excerptMaxBytes: 900,
    maxExcerptCalls: 3,
    startTools: ['platform.health', 'platform.tool_summary', 'repository.project_profile'],
    evidenceTools: [
      'repository.read_file_excerpt',
      'repository.search_files',
      'repository.search_symbols',
    ],
    escalationTools: ['repository.import_graph', 'repository.read_file_context'],
    contextPolicy: [
      'Use manifest and configuration excerpts before source implementation reads.',
      'Use symbol search to identify framework modules and entry points.',
      'Escalate to import graph only for dependency-flow or coupling questions.',
    ],
    doNotCallTools: [
      'repository.read_module_context',
      'repository.read_file_context',
      'repository.overview',
      'platform.metadata',
    ],
  },
  debugging: {
    questionType: 'debugging',
    gateMode: 'expanded_execution',
    targetTokenRange: { min: 3000, max: 8000 },
    excerptMaxBytes: 1200,
    maxExcerptCalls: 5,
    startTools: ['platform.health', 'platform.tool_summary', 'investigation.create'],
    evidenceTools: [
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
      'git.recent_changes',
    ],
    escalationTools: [
      'repository.read_file_context',
      'planning.impact_report',
      'verification.run_check',
    ],
    contextPolicy: [
      'Record the error, log, stack trace, or failing command as evidence first.',
      'Search exact error text, symbols, routes, and recent changes before reading full files.',
      'Read full context only for the narrowed failing file, symbol, or test.',
    ],
    doNotCallTools: [
      'repository.overview',
      'repository.read_module_context',
      'repository.import_graph',
      'repository.call_graph',
      'platform.metadata',
    ],
  },
  code_review: {
    questionType: 'code_review',
    gateMode: 'expanded_execution',
    targetTokenRange: { min: 4000, max: 10000 },
    excerptMaxBytes: 1200,
    maxExcerptCalls: 6,
    startTools: ['platform.health', 'platform.tool_summary', 'git.impact_hints'],
    evidenceTools: [
      'git.recent_changes',
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
    ],
    escalationTools: [
      'repository.read_file_context',
      'repository.import_graph',
      'repository.call_graph',
    ],
    contextPolicy: [
      'Read only diffs, changed files, impacted symbols, and directly related tests.',
      'Use excerpts for contracts and neighboring tests before full file reads.',
      'Escalate to graphs only when changed-symbol dependents are unclear.',
    ],
    doNotCallTools: [
      'repository.overview',
      'repository.read_module_context',
      'repository.scan',
      'platform.metadata',
    ],
  },
  planning: {
    questionType: 'planning',
    gateMode: 'expanded_execution',
    targetTokenRange: { min: 2000, max: 6000 },
    excerptMaxBytes: 1000,
    maxExcerptCalls: 4,
    startTools: ['platform.health', 'platform.tool_summary', 'integration.workflow_index'],
    evidenceTools: [
      'repository.search_files',
      'repository.read_file_excerpt',
      'repository.search_symbols',
      'git.recent_changes',
    ],
    escalationTools: [
      'planning.create_plan',
      'planning.impact_report',
      'repository.read_file_context',
    ],
    contextPolicy: [
      'Use roadmap, TODO, phase-report excerpts, and target file excerpts instead of full historical reads.',
      'Create impact reports after target files and modules are known.',
      'Keep implementation context separate from planning evidence until the plan is approved.',
    ],
    doNotCallTools: [
      'repository.read_file_context for ROADMAP.md, TODO.md, or docs/phase-*.md',
      'repository.read_module_context',
      'repository.import_graph',
      'repository.call_graph',
      'platform.metadata',
    ],
  },
  general: {
    questionType: 'general',
    gateMode: 'compact_read_only',
    targetTokenRange: { min: 1500, max: 4000 },
    excerptMaxBytes: 900,
    maxExcerptCalls: 3,
    startTools: ['platform.health', 'platform.tool_summary', 'repository.project_profile'],
    evidenceTools: [
      'repository.search_files',
      'repository.search_symbols',
      'repository.read_file_excerpt',
    ],
    escalationTools: [
      'repository.overview',
      'repository.read_file_context',
      'planning.impact_report',
    ],
    contextPolicy: [
      'Start compact, then select the closest workflow profile once the question type is clear.',
      'Prefer file and symbol search before full context reads.',
      'Estimate token cost before adding broad evidence.',
    ],
    doNotCallTools: ['repository.read_module_context', 'platform.metadata'],
  },
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
        : {
            budgetTokens: input.budgetTokens,
            withinBudget: estimatedTokens <= input.budgetTokens,
          }),
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
    const questionProfile = this.questionProfile(input);
    const maxTokens = input.maxTokens ?? questionProfile.targetTokenRange.max;
    const status = this.strategyStatus(input.currentTokens, maxTokens);
    const availableTools = new Set(input.availableTools ?? []);
    const preferredTools = [
      ...questionProfile.startTools,
      ...questionProfile.evidenceTools,
      'token_budget.estimate',
      'token_budget.compress_context',
    ].filter(
      (tool, index, tools) =>
        tools.indexOf(tool) === index && (availableTools.size === 0 || availableTools.has(tool)),
    );

    return {
      objective: input.objective,
      questionProfile,
      ...(input.currentTokens === undefined ? {} : { currentTokens: input.currentTokens }),
      maxTokens,
      status,
      recommendedFlow: this.recommendedFlow(status, questionProfile),
      preferredTools,
      avoid: [
        'Avoid reading the whole repository into model context.',
        'Avoid repository.overview unless repository.project_profile is insufficient.',
        'Avoid repository.read_file_context for summaries; use repository.read_file_excerpt first and stop if the summary is already answerable.',
        'Avoid repository.search_files for routine summaries when repository.project_profile already identifies README/package evidence.',
        'Avoid compact/full repository.project_profile for summaries; use mode=summary first.',
        'Avoid platform.tool_summary for explicit project summaries unless tool availability is unclear.',
        'Avoid architecture docs, source tree summaries, and app module excerpts unless the user asks for architecture or module details.',
        'Avoid repository.import_graph unless dependency flow is the current question.',
        'Avoid reading unrelated files during code review; use changed files, impacted symbols, and tests.',
        'Avoid full roadmap or phase-report reads for planning; use excerpts and impact reports.',
        'Avoid expanding module context before file or symbol evidence narrows the target.',
        'Avoid sending generated coverage or build artifacts unless they are the investigation target.',
      ],
      doNotCallTools: questionProfile.doNotCallTools,
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
    const recommendations = [
      'Use token estimates before requesting broad context from repository tools.',
    ];

    if (budgetTokens !== undefined && estimatedTokens > budgetTokens) {
      recommendations.push(
        'Compress context or replace broad file reads with symbol-level context.',
      );
    }
    if (largest && largest.estimatedTokens > estimatedTokens * 0.5) {
      recommendations.push(`Narrow or split the largest context item: ${largest.id}.`);
    }

    return recommendations;
  }

  private allocateTokens(
    estimates: readonly ContextItemEstimate[],
    maxTokens: number,
  ): readonly number[] {
    const totalWeight = estimates.reduce(
      (sum, item) => sum + PRIORITY_WEIGHT[item.priority] * Math.max(1, item.estimatedTokens),
      0,
    );

    return estimates.map((item) => {
      const weightedShare =
        (PRIORITY_WEIGHT[item.priority] * Math.max(1, item.estimatedTokens)) / totalWeight;
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
        : this.sliceWithCompressionMarker(
            item.content,
            maxCharacters,
            marker,
            preserveHeadTokens,
            preserveTailTokens,
            charsPerToken,
          );

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
    const tailCharacters = Math.min(
      requestedTailCharacters,
      Math.max(0, maxCharacters - marker.length - 1),
    );
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

  private questionProfile(input: StrategyRecommendationOptions): StrategyQuestionProfile {
    const questionType = input.questionType ?? this.inferQuestionType(input.objective);
    return QUESTION_PROFILES[questionType];
  }

  private inferQuestionType(objective: string): TokenQuestionType {
    const normalized = objective.toLowerCase();
    if (/\b(review|diff|pr|pull request|code review|risk review)\b/.test(normalized)) {
      return 'code_review';
    }
    if (
      /\b(stack|architecture quick|tech|framework|dependency|dependencies|package|entry point)\b/.test(
        normalized,
      )
    ) {
      return 'tech_stack_quick_view';
    }
    if (
      /\b(debug|bug|error|stack trace|trace|fail|failing|exception|regression)\b/.test(normalized)
    ) {
      return 'debugging';
    }
    if (/\b(plan|planning|roadmap|todo|phase|refactor|implement)\b/.test(normalized)) {
      return 'planning';
    }
    if (/\b(summary|summarize|overview|what is|purpose)\b/.test(normalized)) {
      return 'project_summary';
    }
    return 'general';
  }

  private recommendedFlow(
    status: StrategyRecommendationResult['status'],
    questionProfile: StrategyQuestionProfile,
  ): readonly string[] {
    const base = [
      'Verify MCP health before gathering broad context.',
      `Use the ${questionProfile.questionType} profile target of ${questionProfile.targetTokenRange.min}-${questionProfile.targetTokenRange.max} estimated MCP payload tokens.`,
      `Use ${questionProfile.gateMode} Workflow Gate formatting for this question profile.`,
      `Limit repository.read_file_excerpt to maxBytes <= ${questionProfile.excerptMaxBytes} and no more than ${questionProfile.maxExcerptCalls} call(s) for this question.`,
      ...questionProfile.contextPolicy,
      `Do not call these tools in this profile unless the user explicitly changes scope: ${questionProfile.doNotCallTools.join(', ')}.`,
      'Estimate token cost before expanding context.',
    ];

    if (status === 'over_budget') {
      return [
        ...base,
        'Compress current context and replace low-priority items with targeted follow-up reads.',
      ];
    }
    return [
      ...base,
      'Read only the smallest file, symbol, or module context needed for the next decision.',
    ];
  }
}
