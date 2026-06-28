# Phase 37 Report: User-Facing Compact Reporting

Phase 37 keeps evidence-first MCP transparency while reducing default response noise for ordinary users. Routine summaries now default to `normal_user_summary`; detailed tool telemetry is reserved for `debug_telemetry` when the user asks for tools used, telemetry, token detail, evidence detail, or debug MCP.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Reporting modes in Codex skill | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` defines `normal_user_summary` and `debug_telemetry`. |
| Token strategy reporting metadata | Completed | `token_budget.recommend_strategy` returns `defaultReportMode` and `debugReportTriggers` in every `questionProfile`. |
| Workflow index reporting metadata | Completed | `integration.workflow_index` returns `defaultReportMode` and `debugReportTriggers` for workflow entries. |
| Compact summary UX | Completed | Normal read-only summaries use a 1-2 line gate, short evidence labels, and one-line token status. |
| Debug telemetry preservation | Completed | Debug mode still supports tools used, detailed evidence, largest token source, over-budget detail, fallback detail, and billing caveat. |
| Regression coverage | Completed | Unit and smoke tests assert compact reporting metadata for project-summary strategy and workflow routing. |

## Normal Output Contract

```text
Workflow Gate: read-only | Evidence: repo profile + excerpts | Impact: no file changes

MCP: used, evidence-based
Evidence: README, package, production checklist
Token: ~1.6k MCP payload, within target
```

Normal mode must still say whether MCP was used and whether the work was read-only/no file changes. It should avoid detailed tools-used lists and long absolute paths unless needed.

## Debug Output Contract

Debug mode is opt-in and should include:

- MCP used status.
- Tools used.
- Detailed evidence paths or tool references.
- Estimated MCP payload tokens.
- Largest token source.
- Over-budget and fallback details when present.
- Codex billing note that MCP token estimates are not exact total Codex billing.

## Guardrails Preserved

- Write/change tasks still require expanded execution gates.
- Summary routing still starts with `platform.health` and `repository.project_profile`.
- Routine summaries still avoid `platform.tool_summary`, `repository.search_files`, and `repository.search_symbols` when project profile and excerpts are sufficient.
- Exact total Codex billing remains unavailable without host-provided model usage metadata.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`
