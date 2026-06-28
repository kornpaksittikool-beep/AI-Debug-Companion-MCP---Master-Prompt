# Phase 32 Report: Summary Excerpt Byte Caps

## Summary

Phase 32 reduces routine project-summary payloads after Phase 31. Recent MCP telemetry showed `repository.read_file_excerpt` became the largest estimated MCP payload source, so summary excerpts now default to a smaller byte cap.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Summary excerpt default cap | Completed | `repository.read_file_excerpt` uses 700 bytes by default when `purpose: "summary"`. |
| Purpose-specific excerpt defaults | Completed | Routing remains at a larger bounded default, and debug/review defaults remain larger than summary. |
| Summary routing guidance | Completed | Token budget, workflow index, and Codex skill guidance require `purpose=summary`, `maxBytes <= 700`, and no more than 1-2 files. |
| Smoke regression coverage | Completed | MCP smoke fails when summary excerpt `maxBytes` exceeds 700. |
| Runtime phase update | Completed | Platform metadata reports `phase-32-summary-excerpt-byte-caps`. |

## Reason

Phase 31 moved routine summaries to `repository.project_profile` summary mode. After that reduction, the largest remaining estimated MCP payload source was `repository.read_file_excerpt`, so the summary route needed a stricter default cap.

## Impact

- Routine project summaries should stay closer to the 1k-2k estimated MCP payload token target.
- Routing, debug, and review flows can still read larger excerpts by purpose.
- Exact total Codex billing remains unavailable unless the Codex host exposes model usage metadata to tools.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
