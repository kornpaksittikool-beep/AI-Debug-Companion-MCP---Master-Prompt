# Phase 38 Report: Summary Fallback Discipline

Phase 38 prevents routine project summaries from escaping the compact profile/excerpt path when excerpt evidence is unavailable. The default summary route must now stop or answer with limited evidence instead of falling back to broad `repository.read_file_context`.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Codex skill fallback policy | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` forbids `repository.read_file_context` fallback for project summary, project purpose, and `normal_user_summary`. |
| Token strategy fallback policy | Completed | `token_budget.recommend_strategy` returns `fallbackPolicy.neverUseBroadFileContext=true` for `project_summary`. |
| Workflow fallback policy | Completed | `integration.workflow_index` returns the same no-broad-context fallback policy for `project_summary`. |
| Telemetry violation wording | Completed | Automatic telemetry reports `Summary fallback violation` when `repository.read_file_context` is the largest project-summary token source. |
| Compact fallback footer wording | Completed | The skill includes the short over-target footer wording for broad-context summary fallback. |
| Regression coverage | Completed | Unit and smoke tests assert strategy/workflow fallback policy and hard `repository.read_file_context` do-not-call guidance. |

## Summary Fallback Contract

Routine summary fallback order:

```text
project_profile -> read_file_excerpt -> answer_with_limited_evidence -> ask_for_debug_detail
```

If `repository.read_file_excerpt` is unavailable, clients should answer from `repository.project_profile` plus evidence already gathered. If evidence is insufficient, they should say that evidence is limited and offer debug telemetry or an excerpt retry. They must not read broad file context to complete a routine summary.

## Guardrails

- `repository.read_file_context` remains available for debugging, review, implementation, and explicit exact-implementation questions.
- Routine project summaries still avoid `platform.tool_summary`, `repository.search_files`, and `repository.search_symbols` when `repository.project_profile` is enough.
- `normal_user_summary` stays compact; debug details remain opt-in.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
