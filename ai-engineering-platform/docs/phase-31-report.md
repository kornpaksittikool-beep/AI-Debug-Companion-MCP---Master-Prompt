# Phase 31 Report: Summary Project Profile Mode

## Summary

Phase 31 reduces the remaining routine-summary payload after Phase 30. Real usage showed `repository.project_profile` became the largest source after file search and symbol search were capped. The profile tool now supports `mode: "summary"` for smaller project-purpose responses.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Summary project profile mode | Completed | `repository.project_profile` accepts `mode: "summary"`. |
| Smaller summary payload | Completed | Summary mode reduces default scan depth, key files, package manifests, entrypoints, extension counts, and returns no largest-file sample. |
| Summary workflow routing | Completed | Token budget, workflow index, and Codex skill guidance route summaries through `mode=summary`. |
| Smoke regression coverage | Completed | MCP smoke fails if the profile is not summary mode, returns more than 5 key files, or includes largest files. |
| Runtime phase update | Completed | Platform metadata reports `phase-31-summary-project-profile-mode`. |

## Reason

After Phase 30, broad file search stopped being the largest source for summary prompts. The next largest source was the compact project profile. That profile was still designed for a general low-token overview, not the smallest possible routine project-purpose answer.

## Impact

- Routine project summaries can start from a smaller profile before reading focused excerpts.
- The existing compact profile remains available when a richer project overview is needed.
- Exact total Codex billing remains unavailable unless the Codex host exposes model usage metadata to tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
