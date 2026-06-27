# Phase 18 Completion Report

## Summary

Phase 18 adds deterministic token-budget and context-compression tools. The platform can now estimate approximate context cost, compress candidate evidence to a budget, and recommend a narrower MCP evidence gathering strategy before broad repository reads are sent to an AI model.

## Delivered Features

| Feature | Status | Evidence |
| --- | --- | --- |
| Approximate context token estimator | Completed | `TokenBudgetService.estimate` reports characters, approximate tokens, budget status, and recommendations |
| Priority-aware context compression | Completed | `TokenBudgetService.compress` retains higher-priority items under a max token budget |
| Token-aware strategy recommendations | Completed | `TokenBudgetService.recommendStrategy` returns MCP-first evidence flow guidance |
| MCP tool registration | Completed | `TokenBudgetModule` registers `token_budget.estimate`, `token_budget.compress_context`, and `token_budget.recommend_strategy` |

## Registered Tools

| Tool | Purpose |
| --- | --- |
| `token_budget.estimate` | Estimates approximate token usage for candidate context items. |
| `token_budget.compress_context` | Compresses candidate context items to an approximate token budget. |
| `token_budget.recommend_strategy` | Recommends an MCP-first, token-aware evidence gathering flow. |

## Architecture Decisions

| Decision | Reason | Tradeoff | Impact |
| --- | --- | --- | --- |
| Keep token estimation approximate | Provider-specific tokenizers would add provider coupling and dependency surface | Estimates are not exact billing counts | Gives deterministic budget guidance without weakening AI independence |
| Add a dedicated token-budget module | Token budgeting is a cross-cutting concern but not core transport logic | Adds one module and three tools | Keeps repository, planning, and AI provider modules cohesive |
| Compress deterministically instead of AI summarization | AI summarization would require provider execution and introduce non-determinism | Compression is extractive and less semantically rich | Safe to run inside MCP without external model calls |

## Risks and Limitations

- Token counts are estimates based on character ratio, not provider-specific tokenizer output.
- Compression is extractive and can remove useful middle context.
- The tools help clients reduce context but cannot force an external AI client to follow recommendations.
- Phase 18 does not implement telemetry for actual model token usage.

## Verification Results

| Command | Required Result |
| --- | --- |
| `pnpm build` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | Passed, 34 suites and 115 tests |
| `pnpm test:integration` | Passed, 12 suites and 28 tests |
| `pnpm test:cov` | Passed, 91.96% statements and 91.05% lines |
| `pnpm smoke:mcp` | Passed, 73 MCP tools and token budget smoke calls verified |

## Next Recommendation

The next phase should harden Codex integration with real-session telemetry: prove MCP tool usage frequency, measure estimated token savings, and compare MCP-first workflows against broad manual file reads.
