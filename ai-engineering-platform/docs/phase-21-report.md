# Phase 21 Completion Report

## Summary

Phase 21 adds automatic MCP execution token telemetry. Every tool call routed through `McpExecutionService` now records approximate input and output token estimates, status, execution time, and recent-call metadata without requiring the client to call `integration.record_tool_usage` manually.

## Delivered Features

| Feature | Status | Evidence |
| --- | --- | --- |
| Core automatic execution telemetry | Completed | `ExecutionTelemetryService` records success and failure events from `McpExecutionService` |
| Automatic token estimate summary | Completed | `integration.auto_telemetry_summary` returns call counts, estimated tokens, top tools, and recent calls |
| Automatic telemetry reset | Completed | `integration.reset_auto_telemetry` clears in-memory automatic execution telemetry |
| MCP smoke verification | Completed | `scripts/mcp-smoke-test.mjs` verifies automatic telemetry is populated during real stdio tool calls |

## Registered Tools

| Tool | Purpose |
| --- | --- |
| `integration.auto_telemetry_summary` | Summarizes automatically recorded MCP execution telemetry and estimated token usage. |
| `integration.reset_auto_telemetry` | Clears automatically recorded in-memory execution telemetry. |

## Architecture Decisions

| Decision | Reason | Tradeoff | Impact |
| --- | --- | --- | --- |
| Record telemetry in the core MCP execution boundary | Every MCP tool call already passes through this path | Core now owns lightweight telemetry state | Eliminates client-side manual recording for basic token visibility |
| Keep token estimates approximate | Exact model tokenization would add provider coupling | Counts are not billing-grade | Preserves AI-provider independence while exposing useful trend signals |
| Keep automatic telemetry in memory for this phase | Avoids persistence and privacy decisions for every tool call | Automatic telemetry resets with the process | Keeps the feature safe while Phase 20 durable explicit telemetry remains available |

## Risks and Limitations

- Token estimates are based on serialized JSON size and are approximate.
- Automatic telemetry is in-memory only.
- The summary tool reports MCP tool payload estimates, not full model prompt or completion usage.
- Phase 21 does not add UI overlay behavior inside Codex.

## Verification Results

| Command | Required Result |
| --- | --- |
| `pnpm build` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | Passed, 36 suites and 122 tests |
| `pnpm test:integration` | Passed, 13 suites and 32 tests |
| `pnpm test:cov` | Passed, 92.23% statements and 91.30% lines |
| `node scripts/mcp-smoke-test.mjs` | Passed, 81 MCP tools and automatic telemetry verified |

## Next Recommendation

The next phase should make automatic telemetry optionally durable and add a concise per-response reporting convention for Codex sessions that can call the MCP tools directly.
