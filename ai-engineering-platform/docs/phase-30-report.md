# Phase 30 Report: Summary Search Result Caps

## Summary

Phase 30 fixes the next token leak found after Phase 29: routine project-summary prompts could still spend thousands of MCP payload tokens on broad `repository.search_files` results. The repository search tool now supports a summary mode with capped output, and summary routing explicitly requires that mode.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Summary search mode | Completed | `repository.search_files` accepts `mode: "summary"` and caps returned matches at 8. |
| Compact search payload | Completed | Summary search omits `textPreview` to avoid large result payloads. |
| Project profile next-tool guidance | Completed | `repository.project_profile` recommends summary search and file excerpts, not broad symbol search. |
| Summary routing update | Completed | Token budget, workflow index, and Codex skill guidance require `mode=summary` and `maxMatches<=8`. |
| Smoke regression coverage | Completed | MCP smoke fails if summary search returns more than 8 matches or summary search includes preview text. |
| Runtime phase update | Completed | Platform metadata reports `phase-30-summary-search-result-caps`. |

## Reason

`repository.search_files` is useful for finding candidate files, but broad path or text matches can return many entries. For a routine project summary, the AI only needs a small routing set before reading one or two excerpts. Returning every matching file makes the evidence payload larger than the answer.

## Impact

- Project-summary prompts should no longer make `repository.search_files` the largest token source when the client follows the summary route.
- Detailed file discovery remains possible with `mode: "compact"` or `mode: "full"` and an explicit `maxMatches`.
- Exact total Codex billing remains unavailable unless the Codex host exposes model usage metadata to tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
