# Phase 28 Report: Question-Type Token Profiles

## Summary

Phase 28 expands token-aware routing from project-summary optimization into common question-specific workflows. The platform now gives explicit target token ranges, excerpt size limits, excerpt call limits, hard do-not-call tools, and context policies for project summaries, tech stack quick views, debugging, code review, and planning.

This keeps routine summaries around 1k-2k estimated MCP payload tokens by limiting summary excerpts to at most 2 calls with 500-700 bytes each. Tech stack quick views target around 1.5k-2.5k, and general debugging targets around 3k-8k when the client follows the recommended route. Code review and planning remain more variable, but the routing now strongly favors changed files, impacted symbols, related tests, and planning-document excerpts over broad repository reads.

## Deliverables

| Deliverable                       | Status    | Evidence                                                                                                                                                |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question-type strategy profiles   | Completed | `token_budget.recommend_strategy` returns `questionProfile` with target token range, start tools, evidence tools, escalation tools, and context policy. |
| Workflow target ranges            | Completed | `integration.workflow_index` entries include `targetTokenRange` and `contextPolicy`.                                                                    |
| Excerpt enforcement               | Completed | Profiles include `excerptMaxBytes` and `maxExcerptCalls`, with summary mode capped at 700 bytes and 2 excerpt calls.                                    |
| Hard tool exclusions              | Completed | Profiles return `doNotCallTools` so clients avoid expensive tools unless scope is explicitly expanded.                                                  |
| Telemetry budget status           | Completed | `integration.auto_telemetry_summary` accepts `questionType` or `targetTokens` and returns over-budget status.                                           |
| Tech stack and code review routes | Completed | New workflow task types route tech stack quick views through manifests/excerpts and code review through git impact and diff-scoped evidence.            |
| Debug and planning guidance       | Completed | Debugging routes avoid repository overview by default; planning routes prefer roadmap/TODO/phase report excerpts.                                       |
| Codex skill update                | Completed | The explicit Codex skill documents token targets and per-question routing rules.                                                                        |
| Runtime phase update              | Completed | Platform metadata reports `phase-28-question-type-token-profiles`.                                                                                      |

## Architecture Decisions

### Add routing profiles instead of new repository readers

- Reason: Phase 26 and Phase 27 already added compact profile and excerpt tools.
- Benefits: the platform can reduce payloads through better default routes without increasing repository reader surface area.
- Tradeoffs: clients must honor the returned policy; the server cannot force an external client to avoid broad reads.
- Impact: normal question types now have deterministic budget targets and escalation rules.

### Treat do-not-call tools as hard guidance

- Reason: soft "avoid" guidance was too easy for clients to ignore during broad exploration.
- Benefits: clients get a separate `doNotCallTools` list they can enforce before making expensive calls.
- Tradeoffs: legitimate escalation now requires explicit explanation or scope expansion.
- Impact: summary, planning, and review workflows are less likely to drift into full context reads.

### Keep code review diff-scoped

- Reason: code review becomes expensive when clients summarize the whole project before reading the actual change.
- Benefits: reviews start from changed files, impacted symbols, and related tests.
- Tradeoffs: external clients still need to provide or discover the diff through git context.
- Impact: review payloads are easier to control even though final size depends on the diff.

## Verification

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Exact total Codex billing remains unavailable without host-provided model usage metadata.
- Token ranges are approximate MCP payload targets, not provider-specific tokenizer counts.
- Code review payloads still depend on diff size and number of impacted tests.
