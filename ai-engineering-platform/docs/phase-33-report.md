# Phase 33 Report: Summary Strict Mode

## Summary

Phase 33 tightens routine project-summary routing after real use showed the workflow could still expand into `repository.search_files`, architecture docs, source tree summaries, or app module excerpts. These are now treated as escalation-only for project summaries.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Strict summary preferred route | Completed | `token_budget.recommend_strategy` no longer includes `repository.search_files` in project-summary preferred tools. |
| Workflow index strict route | Completed | `integration.workflow_index` no longer includes `repository.search_files` in project-summary evidence tools. |
| Architecture/source-tree guardrails | Completed | Skill and routing policy forbid architecture docs, source tree summaries, and app module excerpts unless explicitly requested. |
| Telemetry violation warning | Completed | Project-summary telemetry reports a strict-mode recommendation when broad search becomes the largest source. |
| Runtime phase update | Completed | Platform metadata reports `phase-33-summary-strict-mode`. |

## Reason

After Phase 32, summary excerpts were capped, but the AI could still broaden the evidence set. A routine summary should usually stop after `repository.project_profile mode=summary` and README/package excerpts. Search, architecture docs, and source tree evidence are useful only when the user asks for deeper architecture, module, dependency, or source-structure detail.

## Impact

- Routine summary prompts should avoid unnecessary `repository.search_files` calls.
- `repository.search_files` remains available as an escalation tool when README/package evidence is missing.
- Exact total Codex billing remains unavailable unless the Codex host exposes model usage metadata to tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
