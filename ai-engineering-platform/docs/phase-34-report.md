# Phase 34 Report: Skip Tool Summary for Summaries

## Summary

Phase 34 removes `platform.tool_summary` from the routine project-summary startup path. Recent usage showed `platform.tool_summary` became the largest estimated MCP payload source after summary search, profile, and excerpt payloads were reduced.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Summary startup route | Completed | `token_budget.recommend_strategy` no longer recommends `platform.tool_summary` for `project_summary`. |
| Workflow index startup route | Completed | `integration.workflow_index` starts project summaries with `platform.health` and `repository.project_profile`. |
| Codex skill guidance | Completed | The explicit skill skips `platform.tool_summary` for routine project summaries. |
| Telemetry violation warning | Completed | Project-summary telemetry reports a strict-mode recommendation when `platform.tool_summary` becomes the largest source. |
| Runtime phase update | Completed | Platform metadata reports `phase-34-skip-tool-summary-for-summaries`. |

## Reason

`platform.tool_summary` is useful for routing unknown workflows, but explicit project-summary prompts already know the route. Calling tool summary every time can cost more than the repository facts needed for the answer.

## Impact

- Routine explicit summary prompts should avoid the startup tool-summary payload.
- `platform.tool_summary` remains available when tool availability is unclear or the task is not a routine summary.
- Exact total Codex billing remains unavailable unless the Codex host exposes model usage metadata to tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
