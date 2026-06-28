---
name: ai-engineering-platform-auto-use
description: Explicit command-style entrypoint for the AI Engineering Platform MCP workflow. Use this skill only when the user writes `$ai-engineering-platform-auto-use` or directly asks to use this exact skill name. Do not trigger this skill automatically for ordinary project summaries, debugging, reviews, planning, token questions, or follow-up prompts that do not name the skill.
---

# AI Engineering Platform Auto Use

Use the `ai_engineering_platform` MCP server first only after the user explicitly invokes this skill.

This is the only command-style skill name for the platform. Do not route users to aliases such as `$ai-agent`.

## Activation Rule

Use this skill only when the user explicitly writes `$ai-engineering-platform-auto-use` or asks to use this exact skill name.

Do not activate this skill for ordinary project summaries, project-purpose questions, token questions, debugging, or code review unless the prompt also names `$ai-engineering-platform-auto-use`.

## Explicit Command Mode

When the user writes `$ai-engineering-platform-auto-use` anywhere in the message, treat it as an explicit command to use this platform. In that mode:

- Always start with MCP unless the MCP server is unavailable.
- Do not answer from memory alone.
- Use the default low-token workflow first.
- End with the MCP footer.

Examples:

- `$ai-engineering-platform-auto-use summarize this project`
- `$ai-engineering-platform-auto-use explain what this repository does`
- `$ai-engineering-platform-auto-use debug this error`
- `$ai-engineering-platform-auto-use review this code`

## Intent Routing

After explicit activation, treat these request types as MCP-first:

- Project summary or project explanation.
- Project purpose or product-purpose questions.
- Tech stack, dependency, architecture, module, folder, or data-flow questions.
- Bug investigation, error/log/stack-trace analysis, and debugging.
- Code review, risk review, technical debt, or security review.
- Feature planning, refactoring, impact analysis, and verification planning.
- Follow-up questions that use pronouns or short references after explicit activation.

Do not require exact English wording after activation. If the task needs repo facts, architecture evidence, git context, or file impact, use MCP before broad manual reads.

For a follow-up question after activation, do not answer from memory alone. Either call focused MCP tools again or explicitly say the answer reuses MCP evidence already gathered earlier in the same thread, then include the MCP footer.

## Default Workflow

Start with low-token MCP calls:

1. `platform.health`
2. `platform.tool_summary`
3. `repository.project_profile`

Then choose the closest question profile before expanding context:

| Question type                        |                  Target MCP payload | Preferred route                                                                                                                         |
| ------------------------------------ | ----------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Summary / project purpose            |                       ~1k-2k tokens | `repository.project_profile`, focused `repository.search_files`, at most 2 `repository.read_file_excerpt` calls with `maxBytes` 500-700 |
| Tech stack / architecture quick view |                   ~1.5k-2.5k tokens | manifests/config excerpts with `maxBytes` <= 900, `repository.search_symbols`, graph tools only for explicit dependency-flow questions  |
| General debugging                    |                       ~3k-8k tokens | `investigation.create`, exact error search, symbol/file search, then full context only for narrowed failing files                       |
| Code review                          | diff-scoped, usually ~4k-10k tokens | changed files, impacted symbols, related tests, `git.impact_hints`; avoid unrelated repository reads                                    |
| Planning                             |                       ~2k-6k tokens | roadmap/TODO/phase-report excerpts with `maxBytes` <= 1000 plus `planning.impact_report` after target files are known                   |

For normal project summaries and follow-up questions, continue with only focused discovery:

- Use `repository.search_files` to find important files, configs, routes, docs, package manifests, and entry points.
- Use `repository.search_symbols` for TypeScript/JavaScript classes, functions, services, controllers, modules, and DTOs only when the question needs module, symbol, route, or implementation boundaries.
- Use `repository.read_file_excerpt` for summary evidence from README, package manifests, entry points, or app modules.
- Use `repository.overview` only when `repository.project_profile` is insufficient.
- Use `git.recent_changes` and `git.impact_hints` when history or regression risk matters.
- Use `investigation.create` and evidence tools for bug reports, logs, screenshots, or unclear failures.
- Use `planning.create_plan`, `planning.impact_report`, and `planning.approval_gate` before implementation work.
- Use `integration.auto_telemetry_summary` at the end of MCP-heavy work.
- Use `integration.workflow_index` or `token_budget.recommend_strategy` with `questionType` when the best route is unclear.

Prefer focused manual file reads only after MCP narrows the target.

## Token Rule

Use `platform.tool_summary` for routing. Do not call full `platform.metadata` for routine startup checks.

Do not call `repository.import_graph` for ordinary project summaries, project-purpose answers, or short follow-ups. Call it only when the user asks about dependency flow, import relationships, architecture coupling, circular dependencies, or when file/symbol evidence is insufficient and you explain why the graph is needed.

For project summaries, target this order:

1. `repository.project_profile`
2. `repository.search_files`
3. `repository.read_file_excerpt` with `purpose: "summary"` and `maxBytes` 500-700 for at most 2 files that explain purpose or entry points
4. `repository.search_symbols` only if the profile, file search, and excerpts still cannot identify module boundaries
5. `repository.read_file_context` only when an excerpt is insufficient and the answer needs precise details
6. `repository.overview` only if compact profile data is insufficient

For project summaries, treat `repository.search_symbols` as expensive. Do not call it by default; if it is required, use the narrowest query and report why.

For tech stack or architecture quick views, prefer package/config excerpts and symbol search before source implementation reads. Use `repository.import_graph` only when dependency flow, circular dependencies, or architecture coupling is directly requested.

For debugging, keep the error text, logs, stack trace, failing command, and narrowed file/symbol evidence as the core context. Use `repository.read_file_context` only after search identifies the likely failing file.

For code review, read only the diff or changed files, impacted symbols, and directly related tests. Avoid full repository summaries unless the changed surface is unknown.

For planning, use roadmap, TODO, and phase report excerpts instead of reading full historical docs. Create `planning.impact_report` after target files are known.

Treat `doNotCallTools` from `token_budget.recommend_strategy` or `integration.workflow_index` as hard guidance. Do not call those tools unless the user explicitly expands scope or the current evidence is insufficient and you say why.

When reporting telemetry, call `integration.auto_telemetry_summary` with `questionType` or `targetTokens`. If it returns `budgetStatus.status: "over_budget"`, explicitly report the over-budget state and reduce context before continuing.

Avoid broad reads of `playwright-report`, `coverage`, `.next`, `dist`, `build`, `node_modules`, generated reports, and lockfile-heavy content unless the user asks about those artifacts.

For routine project summaries, avoid using `repository.read_file_context` as the largest token source. If `integration.auto_telemetry_summary` reports `repository.read_file_context` as the largest source, recommend replacing it with `repository.read_file_excerpt` next time.

Call `platform.metadata` only when full tool descriptions or schemas are actually required. If metadata is needed, prefer compact input such as `{ "includeTools": false }`.

## Reporting Rule

For repository understanding, debugging, review, or planning responses, include a concise MCP footer:

- MCP used: yes/no
- Tools used
- Evidence summary with file/tool references where available
- Estimated MCP payload tokens from `integration.auto_telemetry_summary`; clearly say when the number is whole-session telemetry rather than this-turn telemetry
- Codex billing note: exact total Codex billing is unavailable unless Codex exposes model usage metadata to tools. Do not present MCP token estimates as exact Codex billing.
- Largest token source and a reduction recommendation when useful

If the answer reuses evidence from a previous MCP call in the same thread without making a new tool call, write `MCP used: reused previous MCP evidence` and name the prior evidence or tools.

If MCP tools are unavailable, state that once and continue with the smallest practical local inspection.

## Safety Rule

Do not modify files just because an investigation or summary request was made. For code changes, keep the sequence: evidence, impact, plan, approval when required, implementation, verification, report.
