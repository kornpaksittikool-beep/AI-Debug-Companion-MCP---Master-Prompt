# Phase 27 Report: File Excerpt Token Reduction

## Summary

Phase 27 reduces token usage after compact project profile routing. Real testing showed `repository.project_profile` worked, but project summaries could still become expensive when the client escalated to full `repository.read_file_context`.

This phase adds `repository.read_file_excerpt`, a compact file-reading tool intended for summaries and routing, and updates workflow guidance so full file context is used only when excerpts are insufficient.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Compact file excerpt tool | Completed | `repository.read_file_excerpt` returns an excerpt with a compact token policy and default summary bounds. |
| Excerpt-first summary routing | Completed | `integration.workflow_index` lists `repository.read_file_excerpt` for project-summary evidence. |
| Token strategy guidance | Completed | `token_budget.recommend_strategy` prefers excerpts before full file context for summaries. |
| Codex skill update | Completed | The explicit Codex skill instructs clients to use excerpts before `repository.read_file_context`. |
| Smoke coverage | Completed | MCP smoke test calls `repository.read_file_excerpt` and expects 84 registered tools. |
| Runtime phase update | Completed | Platform metadata reports `phase-27-file-excerpt-token-reduction`. |

## Architecture Decisions

### Add an excerpt tool instead of changing full context reads

- Reason: `repository.read_file_context` is useful for debugging and review workflows that need larger precise context.
- Benefits: summary clients get a smaller default tool without breaking existing full-context consumers.
- Tradeoffs: one more repository tool is registered.
- Impact: project summaries can use 1,200-byte excerpts before deciding whether full file context is justified.

### Keep full context as explicit escalation

- Reason: broad file reads can dominate MCP payload tokens.
- Benefits: token reports can clearly recommend replacing full file context with excerpts for routine summaries.
- Tradeoffs: users may need one extra call when an excerpt is insufficient.
- Impact: summary workflows become cheaper while deep investigations remain available.

## Verification

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Exact total Codex billing remains unavailable without host-provided model usage metadata.
- Clients can still call `repository.read_file_context`; the platform now provides guidance and a cheaper alternative but cannot force external clients to use it.
