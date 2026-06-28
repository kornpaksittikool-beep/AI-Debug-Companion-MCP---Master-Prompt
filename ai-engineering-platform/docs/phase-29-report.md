# Phase 29 Report: Summary Symbol Guardrails

## Summary

Phase 29 fixes the token regression observed after Phase 28 where a routine project-summary prompt could call `repository.search_symbols` and produce a large payload. Routine summaries now keep symbol search out of the preferred route and list it in hard `doNotCallTools` guidance.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Summary route symbol guardrail | Completed | `token_budget.recommend_strategy` no longer recommends `repository.search_symbols` for `project_summary`. |
| Workflow index guardrail | Completed | `integration.workflow_index` excludes `repository.search_symbols` from project-summary evidence tools. |
| Codex skill routing update | Completed | The explicit auto-use skill says project summaries should not call symbol search by default. |
| Smoke regression coverage | Completed | `scripts/mcp-smoke-test.mjs` fails if summary routing recommends `repository.search_symbols`. |
| Runtime phase update | Completed | Platform metadata reports `phase-29-summary-symbol-guardrails`. |

## Reason

`repository.search_symbols` is useful for module, class, function, route, DTO, and implementation-boundary questions. It is too broad for ordinary project-purpose summaries when `repository.project_profile`, `repository.search_files`, and small file excerpts already provide enough evidence.

## Impact

- Project-summary prompts should stay closer to the 1k-2k estimated MCP payload target.
- Tech stack, debugging, review, and planning profiles can still use symbol search where it is useful.
- The platform still cannot guarantee exact Codex billing because the host does not expose exact model usage metadata to MCP tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
