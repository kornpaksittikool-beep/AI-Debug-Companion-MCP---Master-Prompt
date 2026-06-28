# Phase 26 Report: Compact Profile Token Reporting

## Summary

Phase 26 reduces routine project-summary payload size by adding a compact `repository.project_profile` tool and routing explicit Codex skill workflows through it before broader repository overview calls.

It also clarifies billing language: the platform can estimate MCP tool payload tokens, but exact total Codex billing requires host-provided model usage metadata that is not available inside the MCP server.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Compact project profile tool | Completed | `repository.project_profile` returns key files, manifests, entrypoint hints, top extensions, and limited largest-file metadata. |
| Profile-first workflow routing | Completed | `integration.workflow_index` uses `repository.project_profile` for project summaries. |
| Skill token guidance | Completed | The Codex skill starts project summaries with `repository.project_profile` and treats `repository.overview` as an escalation tool. |
| Billing boundary wording | Completed | Tool output and documentation state that exact total Codex billing is unavailable without host usage metadata. |
| Runtime phase update | Completed | Platform metadata reports `phase-26-compact-profile-token-reporting`. |

## Architecture Decisions

### Add a new tool instead of changing `repository.overview`

- Reason: existing consumers may rely on the broader overview shape.
- Benefits: preserves backward compatibility and gives clients a clearly named low-token route.
- Tradeoffs: adds one tool to the registry and one more routing decision.
- Impact: project-summary flows can avoid overview unless the compact profile is insufficient.

### Keep exact billing outside MCP

- Reason: exact Codex billing is owned by the Codex host/model runtime, not by a repository MCP server.
- Benefits: avoids misleading billing claims and keeps the platform provider-neutral.
- Tradeoffs: reports remain estimates unless a future host integration provides usage metadata.
- Impact: telemetry labels distinguish MCP payload estimates from total Codex billing.

## Verification

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Exact total Codex billing remains unavailable until Codex exposes model usage metadata to tools or thread context.
- `repository.project_profile` is intentionally compact and may require focused follow-up tools for deep architecture questions.
