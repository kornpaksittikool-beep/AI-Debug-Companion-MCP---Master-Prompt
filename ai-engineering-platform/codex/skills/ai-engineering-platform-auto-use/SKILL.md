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
- Start every response with the adaptive Workflow Gate before giving the substantive answer.
- Use the default low-token workflow first.
- End with the MCP footer.
- Use `normal_user_summary` reporting by default. Use `debug_telemetry` only when the user asks for tools used, telemetry, debug MCP, token detail, or evidence detail.

Examples:

- `$ai-engineering-platform-auto-use summarize this project`
- `$ai-engineering-platform-auto-use explain what this repository does`
- `$ai-engineering-platform-auto-use debug this error`
- `$ai-engineering-platform-auto-use review this code`

## Adaptive Workflow Gate

Every response after this skill is invoked must begin with a `Workflow Gate:` block before the answer, even for read-only requests such as summaries, tech stack questions, project-purpose questions, or token checks.

Choose the smallest gate that satisfies planning-first:

- Use `compact_read_only` gate mode for routine summaries, tech stack checks, project-purpose questions, token checks, database reads, and git reads when no file change is requested.
- Use `expanded_execution` gate mode for implementation, refactoring, debugging that may modify files, code review, patch execution, security review, and planning that can lead to writes.

For compact read-only requests in `normal_user_summary`, the gate must be 1-2 very short lines and may combine fields:

- `Workflow Gate: read-only | Evidence: ... | Impact: no file changes`
- Optional second line: `MCP: used | Token target: ...`

For compact read-only requests in `debug_telemetry`, the gate may expand to 4-5 short lines:

- `Workflow Gate: read-only`
- `Objective: ...`
- `Evidence: ...`
- `Impact/Approval: No file changes; Not required: read-only`
- `Verification/MCP: ...`

For expanded execution requests, the gate must include these fields:

- Objective
- Investigation Plan
- Evidence Target
- Impact
- Approval
- Verification
- MCP Usage Plan

Keep every gate short. For routine summaries, keep the full answer near the summary target of ~1k-2k MCP payload tokens and do not expand context just to make the gate longer.

For read-only requests:

- Impact must say `No file changes`.
- Approval must say `Not required: read-only`.
- Verification must say the answer will be checked with evidence or tool output.
- MCP Usage Plan must prefer the low-token route and avoid `platform.tool_summary` unless tool availability is unclear.

For write or change requests:

- Include a full execution plan in or immediately after the gate.
- Request approval before editing files unless the user has already explicitly approved implementation in the same request.
- Include a verification plan and rollback plan before implementation.
- Use `planning.create_plan`, `planning.impact_report`, and `planning.approval_gate` when MCP planning state is needed.

Example compact read-only summary gate:

```text
Workflow Gate: read-only | Evidence: repo profile + excerpts | Impact: no file changes
```

Example expanded execution gate:

```text
Workflow Gate: execution
- Objective: implement the approved change
- Investigation Plan: inspect target files and current tests
- Evidence Target: target modules, tests, docs, git status
- Impact: expected files and regression risk
- Approval: required before edits unless already approved in the same request
- Verification: build, lint, tests, smoke, rollback where relevant
- MCP Usage Plan: use planning/impact tools and focused repository evidence
```

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
2. For project summaries, skip `platform.tool_summary` and call `repository.project_profile` with `mode: "summary"` directly.
3. Use `platform.tool_summary` only when tool availability is unclear or the task is not a routine project summary.

Then choose the closest question profile before expanding context:

| Question type                        |                  Target MCP payload | Preferred route                                                                                                                                              |
| ------------------------------------ | ----------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Summary / project purpose            |                       ~1k-2k tokens | compact read-only gate; `platform.health`, `repository.project_profile` with `mode: "summary"`, then README/package excerpts only if needed; never fallback to broad file context; skip `platform.tool_summary` by default |
| Tech stack / architecture quick view |                   ~1.5k-2.5k tokens | compact read-only gate unless changes are requested; manifests/config excerpts with `maxBytes` <= 900, `repository.search_symbols`, graph tools only for explicit dependency-flow questions |
| General debugging                    |                       ~3k-8k tokens | expanded execution gate if fixes may follow; `investigation.create`, exact error search, symbol/file search, then full context only for narrowed failing files |
| Code review                          | diff-scoped, usually ~4k-10k tokens | expanded execution gate; changed files, impacted symbols, related tests, `git.impact_hints`; avoid unrelated repository reads |
| Planning                             |                       ~2k-6k tokens | expanded execution gate; roadmap/TODO/phase-report excerpts with `maxBytes` <= 1000 plus `planning.impact_report` after target files are known |

For normal project summaries and follow-up questions, continue with only focused discovery:

- Use `repository.search_files` to find important files, configs, routes, docs, package manifests, and entry points only when the summary profile cannot locate README/package evidence. For summaries, always pass `mode: "summary"` and `maxMatches` <= 8.
- Use `repository.search_symbols` for TypeScript/JavaScript classes, functions, services, controllers, modules, and DTOs only when the question needs module, symbol, route, or implementation boundaries.
- Use `repository.read_file_excerpt` for summary evidence from README, package manifests, or entry points. For summaries, pass `purpose: "summary"` and `maxBytes` <= 700, read no more than 1-2 files, and do not read app module excerpts when README/package evidence is sufficient.
- For project summary, project purpose, and `normal_user_summary`, do not fallback to `repository.read_file_context`. If `repository.read_file_excerpt` is unavailable, answer from `repository.project_profile` plus evidence already gathered. If that evidence is insufficient, say briefly that evidence is limited and offer debug telemetry or an excerpt retry.
- Use `repository.overview` only when `repository.project_profile` is insufficient.
- Use `git.recent_changes` and `git.impact_hints` when history or regression risk matters.
- Use `investigation.create` and evidence tools for bug reports, logs, screenshots, or unclear failures.
- Use `planning.create_plan`, `planning.impact_report`, and `planning.approval_gate` before implementation work.
- Use `integration.auto_telemetry_summary` at the end of MCP-heavy work.
- Use `integration.workflow_index` or `token_budget.recommend_strategy` with `questionType` when the best route is unclear.

Prefer focused manual file reads only after MCP narrows the target.

## Token Rule

Use `platform.tool_summary` for routing only when tool availability is unclear or the task is not a routine project summary. Do not call full `platform.metadata` for routine startup checks.

Do not call `repository.import_graph` for ordinary project summaries, project-purpose answers, or short follow-ups. Call it only when the user asks about dependency flow, import relationships, architecture coupling, circular dependencies, or when file/symbol evidence is insufficient and you explain why the graph is needed.

For project summaries, target this order:

1. `platform.health`
2. `repository.project_profile` with `mode: "summary"`
3. Stop if the summary profile already identifies README/package evidence and the answer can be concise
4. `repository.read_file_excerpt` with `purpose: "summary"` and `maxBytes` <= 700 for README, then package.json with `maxBytes` <= 500 only if package metadata is needed
5. `platform.tool_summary` only if the tool list is unavailable, stale, or needed for a non-summary workflow
6. `repository.search_files` with `mode: "summary"` and `maxMatches` <= 8 only if README/package are missing from the summary profile
7. `repository.search_symbols` only if the profile, file search, and excerpts still cannot identify module boundaries
8. Never call `repository.read_file_context` for routine project summaries, project-purpose answers, `normal_user_summary`, or summary fallback; use it only when the user explicitly asks for exact implementation detail outside summary mode
9. `repository.overview` only if compact profile data is insufficient

For project summaries, treat `platform.tool_summary`, `repository.search_files`, `repository.search_symbols`, architecture docs, source tree summaries, app module excerpts, and `repository.read_file_context` as hard do-not-call fallback tools when `repository.project_profile` is enough. Do not call them by default. Do not call `repository.read_file_context` at all for routine summary fallback; if evidence remains insufficient after profile/excerpt evidence, answer with limited evidence or ask for debug detail.

Do not read `docs/architecture.md`, `src/app.module.ts`, source tree summaries, module lists, symbol search, import graph, or call graph for routine summaries unless the user explicitly asks for architecture, modules, dependencies, or source structure.

For tech stack or architecture quick views, prefer package/config excerpts and symbol search before source implementation reads. Use `repository.import_graph` only when dependency flow, circular dependencies, or architecture coupling is directly requested.

For debugging, keep the error text, logs, stack trace, failing command, and narrowed file/symbol evidence as the core context. Use `repository.read_file_context` only after search identifies the likely failing file.

For code review, read only the diff or changed files, impacted symbols, and directly related tests. Avoid full repository summaries unless the changed surface is unknown.

For planning, use roadmap, TODO, and phase report excerpts instead of reading full historical docs. Create `planning.impact_report` after target files are known.

Treat `doNotCallTools` from `token_budget.recommend_strategy` or `integration.workflow_index` as hard guidance. Do not call those tools unless the user explicitly expands scope or the current evidence is insufficient and you say why.

When reporting telemetry, call `integration.auto_telemetry_summary` with `questionType` or `targetTokens`. If it returns `budgetStatus.status: "over_budget"`, explicitly report the over-budget state and reduce context before continuing.

If `integration.auto_telemetry_summary` for `project_summary` reports `repository.search_files` as the largest source, say the workflow violated summary strict mode and avoid search_files on the next pass.

If `integration.auto_telemetry_summary` for `project_summary` reports `platform.tool_summary` as the largest source, say the workflow violated summary startup mode and skip tool_summary on the next pass.

Avoid broad reads of `playwright-report`, `coverage`, `.next`, `dist`, `build`, `node_modules`, generated reports, and lockfile-heavy content unless the user asks about those artifacts.

For routine project summaries, `repository.read_file_context` must not appear as the largest token source. If `integration.auto_telemetry_summary` for `project_summary` reports `repository.read_file_context` as the largest source, report `summary fallback violation` and recommend using only `repository.project_profile` and `repository.read_file_excerpt`; if excerpts are unavailable, answer with limited evidence or ask for debug detail.

Call `platform.metadata` only when full tool descriptions or schemas are actually required. If metadata is needed, prefer compact input such as `{ "includeTools": false }`.

## Reporting Rule

Use these reporting modes for repository understanding, debugging, review, or planning responses.

### normal_user_summary

This is the default. Optimize for a regular user who wants the answer, not tool telemetry.

- Keep read-only Workflow Gate output to 1-2 short lines.
- Keep the footer short.
- Do not show detailed `Tools used`.
- Do not show absolute paths unless they are necessary to disambiguate evidence or the user asked for detail.
- Summarize evidence as short labels, for example `README`, `package`, `production checklist`, `ROADMAP`, or `TODO`.
- Summarize token status in one line, for example `Token: ~1.6k MCP payload, within target`.
- If summary fallback used broad context, keep the warning to one line: `Token: over target; summary fallback used broad context, next run should stay profile/excerpt only`.
- Still say whether MCP was used.
- Still say when the work was read-only/no file changes.
- For write/change tasks, keep the expanded execution gate and verification/rollback plan.

Normal footer shape:

```text
MCP: used, evidence-based
Evidence: README, package, production checklist
Token: ~1.6k MCP payload, within target
```

### debug_telemetry

Use this mode only when the user asks for "ใช้ tool อะไร", "tools used", "telemetry", "debug MCP", "token detail", "evidence detail", or equivalent wording.

Include:

- MCP used: yes/no
- Tools used
- Evidence summary with file/tool references where available
- Estimated MCP payload tokens from `integration.auto_telemetry_summary`; clearly say when the number is whole-session telemetry rather than this-turn telemetry
- Codex billing note: exact total Codex billing is unavailable unless Codex exposes model usage metadata to tools. Do not present MCP token estimates as exact Codex billing.
- Largest token source and a reduction recommendation when useful
- Over-budget details and fallback details when present

If the answer reuses evidence from a previous MCP call in the same thread without making a new tool call, write `MCP used: reused previous MCP evidence` and name the prior evidence or tools.

If MCP tools are unavailable, state that once and continue with the smallest practical local inspection.

## Safety Rule

Do not modify files just because an investigation or summary request was made. For code changes, keep the sequence: evidence, impact, plan, approval when required, implementation, verification, report.
