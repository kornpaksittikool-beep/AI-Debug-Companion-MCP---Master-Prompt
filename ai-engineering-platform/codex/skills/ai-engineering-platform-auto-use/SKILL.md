---
name: ai-engineering-platform-auto-use
description: Automatically use the ai_engineering_platform MCP server for repository and software-engineering intents, even when the user does not mention MCP. Use for project summaries, tech-stack questions, architecture inspection, codebase understanding, bug investigation, debugging, code review, refactoring, feature planning, impact analysis, verification planning, "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ใช้อะไร", "โครงสร้างเป็นยังไง", "ช่วย debug", "review code", and similar Thai or English requests about a project or repository.
---

# AI Engineering Platform Auto Use

Use the `ai_engineering_platform` MCP server first for project and repository engineering work. The user should not need to explicitly ask for MCP.

## Intent Routing

Treat these request types as MCP-first:

- Project summary or project explanation.
- Tech stack, dependency, architecture, module, folder, or data-flow questions.
- Bug investigation, error/log/stack-trace analysis, and debugging.
- Code review, risk review, technical debt, or security review.
- Feature planning, refactoring, impact analysis, and verification planning.
- Thai equivalents such as "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ใช้อะไร", "ดูโครงสร้างให้หน่อย", "ช่วยหาบั๊ก", "ช่วยวางแผนแก้", or casual variants.

Do not require exact trigger wording. If the task needs repo facts, architecture evidence, git context, or file impact, use MCP before broad manual reads.

## Default Workflow

Start with low-token MCP calls:

1. `platform.health`
2. `platform.tool_summary`
3. `repository.overview`

Then choose focused tools:

- Use `repository.search_files` to find important files, configs, routes, docs, package manifests, and entry points.
- Use `repository.search_symbols` for TypeScript/JavaScript classes, functions, services, controllers, modules, and DTOs.
- Use `repository.import_graph` for dependency flow when the repo is TypeScript or JavaScript.
- Use `git.recent_changes` and `git.impact_hints` when history or regression risk matters.
- Use `investigation.create` and evidence tools for bug reports, logs, screenshots, or unclear failures.
- Use `planning.create_plan`, `planning.impact_report`, and `planning.approval_gate` before implementation work.
- Use `integration.auto_telemetry_summary` at the end of MCP-heavy work.

Prefer focused manual file reads only after MCP narrows the target.

## Token Rule

Use `platform.tool_summary` for routing. Do not call full `platform.metadata` for routine startup checks.

Call `platform.metadata` only when full tool descriptions or schemas are actually required. If metadata is needed, prefer compact input such as `{ "includeTools": false }`.

## Reporting Rule

For repository understanding, debugging, review, or planning responses, include a concise MCP footer:

- MCP used: yes/no
- Tools used
- Evidence summary with file/tool references where available
- Estimated MCP payload tokens from `integration.auto_telemetry_summary`
- Largest token source and a reduction recommendation when useful

If MCP tools are unavailable, state that once and continue with the smallest practical local inspection.

## Safety Rule

Do not modify files just because an investigation or summary request was made. For code changes, keep the sequence: evidence, impact, plan, approval when required, implementation, verification, report.
