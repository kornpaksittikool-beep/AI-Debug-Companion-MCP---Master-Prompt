---
name: ai-engineering-platform-auto-use
description: Explicit command-style entrypoint for the AI Engineering Platform MCP workflow. Use this skill only when the user writes `$ai-engineering-platform-auto-use` or directly asks to use this exact skill name. Do not trigger this skill automatically for ordinary project summaries, debugging, reviews, planning, token questions, or follow-up prompts that do not name the skill.
---

# AI Engineering Platform Auto Use

Use the `ai_engineering_platform` MCP server first only after the user explicitly invokes this skill.

This is the only command-style skill name for the platform. Do not route users to aliases such as `$ai-agent`.

## Activation Rule

Use this skill only when the user explicitly writes `$ai-engineering-platform-auto-use` or asks to use this exact skill name.

Do not activate this skill for ordinary prompts such as "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ทำอะไร", "บอก token ที่ใช้", "debug this", or "review code" unless the prompt also names `$ai-engineering-platform-auto-use`.

## Explicit Command Mode

When the user writes `$ai-engineering-platform-auto-use` anywhere in the message, treat it as an explicit command to use this platform. In that mode:

- Always start with MCP unless the MCP server is unavailable.
- Do not answer from memory alone.
- Use the default low-token workflow first.
- End with the MCP footer.

Examples:

- `$ai-engineering-platform-auto-use สรุปโปรเจ็กต์นี้`
- `$ai-engineering-platform-auto-use โปรเจ็กต์นี้ทำอะไร`
- `$ai-engineering-platform-auto-use debug error นี้`
- `$ai-engineering-platform-auto-use review code รอบนี้`

## Intent Routing

After explicit activation, treat these request types as MCP-first:

- Project summary or project explanation.
- Project purpose or product-purpose questions, including "what does this project do?" and Thai variants such as "โปรเจ็กต์นี้ทำอะไร", "ใช้ทำอะไร", "อันนี้ทำอะไร", "มันทำอะไร", and "ระบบนี้ทำอะไร".
- Tech stack, dependency, architecture, module, folder, or data-flow questions.
- Bug investigation, error/log/stack-trace analysis, and debugging.
- Code review, risk review, technical debt, or security review.
- Feature planning, refactoring, impact analysis, and verification planning.
- Follow-up questions that use pronouns or short references such as "แล้วอันนี้ล่ะ", "แล้วโปรเจ็กต์นี้ใช้ทำอะไร", "แล้วมันทำอะไร", or "สรุปอีกที".
- Thai equivalents such as "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ใช้อะไร", "ดูโครงสร้างให้หน่อย", "ช่วยหาบั๊ก", "ช่วยวางแผนแก้", or casual variants.

Do not require exact trigger wording. If the task needs repo facts, architecture evidence, git context, or file impact, use MCP before broad manual reads.

For a follow-up question, do not answer from memory alone. Either call focused MCP tools again or explicitly say the answer reuses MCP evidence already gathered earlier in the same thread, then include the MCP footer.

## Default Workflow

Start with low-token MCP calls:

1. `platform.health`
2. `platform.tool_summary`
3. `repository.overview`

For normal project summaries and follow-up questions, continue with only focused discovery:

- Use `repository.search_files` to find important files, configs, routes, docs, package manifests, and entry points.
- Use `repository.search_symbols` for TypeScript/JavaScript classes, functions, services, controllers, modules, and DTOs.
- Use `git.recent_changes` and `git.impact_hints` when history or regression risk matters.
- Use `investigation.create` and evidence tools for bug reports, logs, screenshots, or unclear failures.
- Use `planning.create_plan`, `planning.impact_report`, and `planning.approval_gate` before implementation work.
- Use `integration.auto_telemetry_summary` at the end of MCP-heavy work.

Prefer focused manual file reads only after MCP narrows the target.

## Token Rule

Use `platform.tool_summary` for routing. Do not call full `platform.metadata` for routine startup checks.

Do not call `repository.import_graph` for ordinary project summaries, project-purpose answers, or short follow-ups. Call it only when the user asks about dependency flow, import relationships, architecture coupling, circular dependencies, or when file/symbol evidence is insufficient and you explain why the graph is needed.

For project summaries, target this order:

1. `repository.overview`
2. `repository.search_files`
3. `repository.search_symbols`
4. `repository.read_file_context` only for the few files that explain purpose or entry points

Avoid broad reads of `playwright-report`, `coverage`, `.next`, `dist`, `build`, `node_modules`, generated reports, and lockfile-heavy content unless the user asks about those artifacts.

Call `platform.metadata` only when full tool descriptions or schemas are actually required. If metadata is needed, prefer compact input such as `{ "includeTools": false }`.

## Reporting Rule

For repository understanding, debugging, review, or planning responses, include a concise MCP footer:

- MCP used: yes/no
- Tools used
- Evidence summary with file/tool references where available
- Estimated MCP payload tokens from `integration.auto_telemetry_summary`; clearly say when the number is whole-session telemetry rather than this-turn telemetry
- Largest token source and a reduction recommendation when useful

If the answer reuses evidence from a previous MCP call in the same thread without making a new tool call, write `MCP used: reused previous MCP evidence` and name the prior evidence or tools.

If MCP tools are unavailable, state that once and continue with the smallest practical local inspection.

## Safety Rule

Do not modify files just because an investigation or summary request was made. For code changes, keep the sequence: evidence, impact, plan, approval when required, implementation, verification, report.
