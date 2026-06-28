# Codex Project Instructions

## Default Engineering Workflow

For this repository, prefer the `ai_engineering_platform` MCP server before broad manual repository reads.

When the user asks about bugs, architecture, phases, roadmap, planning, impact, verification, repository structure, code search, or implementation strategy:

1. Use MCP evidence-gathering tools first when they are available.
2. Start with `platform.health` when the MCP connection has not been verified in the current session.
3. Use `platform.tool_summary` for low-token tool routing. Use `platform.metadata` only with compact options unless full tool descriptions are required.
4. Prefer focused tools such as `repository.overview`, `repository.search_symbols`, `repository.import_graph`, `planning.create_plan`, `planning.approval_gate`, `patch.create_proposal`, `patch.apply_proposal`, `patch.rollback_apply`, `git.recent_changes`, `memory.search`, and `security.audit_project`.
5. Do not read large file sets or the whole repository directly unless MCP evidence is missing, incomplete, or clearly insufficient.
6. Treat MCP output as evidence, not as final reasoning. Summaries and decisions still need engineering judgment.
7. Keep manual file reads narrow and evidence-driven after MCP narrows the target area.
8. For code changes, preserve the existing phase workflow: evidence, impact, plan, approval when required, implementation, verification, and report.
9. After MCP-heavy work, call `integration.auto_telemetry_summary` and report whether MCP was used, the tools used, estimated MCP payload tokens, the largest token source, and any reduction recommendation.

## Token Budget Rule

Prefer structured MCP outputs and narrow follow-up reads to reduce context usage.

Prefer `platform.tool_summary` over full `platform.metadata` for routine startup checks. Call `platform.metadata` with `{ "includeTools": false }` unless full tool details are necessary.

If a tool output is too large, ask for or implement a narrower query instead of loading more files into context.

## Fallback Rule

If `ai_engineering_platform` MCP tools are unavailable in the current session, state that once, then continue with normal local repository inspection using the smallest practical scope.
