# Phase 24 Completion Report

## Summary

Phase 24 reduces MCP payload usage for natural project summaries and follow-up prompts. Phase 23 proved the auto-use skill can route natural prompts into MCP, but real usage showed `repository.import_graph` could dominate token estimates. Phase 24 makes graph tools on-demand instead of default.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Low-token project summary route | Completed | `integration.workflow_index` now includes `project_summary` with `platform.health`, `platform.tool_summary`, and `repository.overview` as start tools. |
| On-demand import graph policy | Completed | `repository.import_graph` is removed from default summary, bug, and token optimization evidence routes. |
| Token recommendation update | Completed | `token_budget.recommend_strategy` prefers health, tool summary, overview, file search, and symbol search before broad context. |
| Skill routing update | Completed | `ai-engineering-platform-auto-use` avoids import graph for ordinary summaries and follow-ups. |
| Runtime phase update | Completed | Platform metadata reports `phase-24-token-aware-mcp-routing`. |

## Architecture Decisions

### Keep `repository.import_graph` on-demand

- Reason: import graph is useful but can be the largest MCP payload in normal summaries.
- Benefits: routine project summaries stay closer to the token budget.
- Drawbacks: dependency-flow answers may need one extra MCP call.
- Impact: the auto-use skill asks for import graph only when dependency flow, coupling, circular imports, or insufficient file/symbol evidence justifies it.

### Add a dedicated `project_summary` workflow

- Reason: project summary is a common user intent and should not share heavy architecture-review routing.
- Benefits: the first route is predictable, low-token, and easy to verify.
- Drawbacks: another static workflow entry must be maintained.
- Impact: Codex can ask `integration.workflow_index` for project summary routing without being pointed at graph tools too early.

### Report whole-session telemetry clearly

- Reason: `integration.auto_telemetry_summary` currently summarizes in-memory session telemetry, not necessarily only the last user turn.
- Benefits: users do not misread a high session total as a single prompt cost.
- Drawbacks: exact per-turn telemetry remains future work.
- Impact: skill reporting now tells Codex to clarify when token totals are whole-session telemetry.

## Verification

Phase 24 must pass:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Codex host behavior can still choose tools differently if the prompt strongly implies architecture dependency flow.
- Exact per-turn token telemetry is not implemented yet.
- Import graph can still be expensive when it is legitimately needed.
