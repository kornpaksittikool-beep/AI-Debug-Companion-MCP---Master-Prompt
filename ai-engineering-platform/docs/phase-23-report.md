# Phase 23 Completion Report

## Summary

Phase 23 improves real-world Codex usability by adding a global auto-use skill for natural repository prompts. Users should not need to type "use AI Engineering Platform MCP" for common engineering intents such as project summaries, architecture inspection, debugging, review, or planning.

This phase does not claim perfect host-level forced tool use. Codex still decides whether a skill triggers, but the skill metadata is intentionally broad and bilingual so natural Thai and English project requests are routed toward the MCP-first workflow.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Codex auto-use skill | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` defines broad Thai and English triggers plus MCP-first workflow rules. |
| Follow-up intent hardening | Completed | The auto-use skill handles project-purpose follow-ups such as "โปรเจ็กต์นี้ทำอะไร", "ใช้ทำอะไร", "อันนี้ทำอะไร", and "มันทำอะไร". |
| Codex integration installer | Completed | `scripts/install-codex-integration.mjs` installs the skill into Codex home and ensures the MCP server config block exists. |
| Package script | Completed | `pnpm codex:install` runs the installer. |
| Documentation | Completed | README, roadmap, TODO, and this report document Phase 23 behavior and limits. |

## Trigger Strategy

The skill uses intent classes instead of exact prompt matching:

- Project summary and project explanation.
- Tech stack, dependency, architecture, module, folder, and data-flow questions.
- Bug investigation, error/log/stack-trace analysis, and debugging.
- Code review, risk review, technical debt, and security review.
- Feature planning, refactoring, impact analysis, and verification planning.
- Thai casual prompts such as "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ใช้อะไร", "ดูโครงสร้างให้หน่อย", "ช่วยหาบั๊ก", and "ช่วยวางแผนแก้".
- Follow-up prompts that refer back to the current repository with short wording such as "แล้วโปรเจ็กต์นี้ใช้ทำอะไร", "อันนี้ทำอะไร", "มันทำอะไร", and "สรุปอีกที".

## Architecture Decisions

### Use a Codex skill instead of per-repository `AGENTS.md`

- Reason: users should not need to edit every repository after installation.
- Benefits: one installation can affect normal project prompts across repositories.
- Drawbacks: skill triggering is still controlled by Codex host behavior and cannot be guaranteed for every possible wording.
- Impact: common project-understanding prompts should route to MCP more often without explicit user instructions.

### Keep MCP startup low-token

- Reason: auto-use would be too expensive if every project prompt called full metadata.
- Benefits: the skill starts with `platform.health`, `platform.tool_summary`, and `repository.overview`.
- Drawbacks: full tool descriptions are not available unless explicitly requested.
- Impact: routine project summaries avoid the Phase 21 `platform.metadata` token spike.

### Add an installer script

- Reason: manual copy instructions are not enough for real adoption.
- Benefits: users can run one command to install the skill and ensure MCP config exists.
- Drawbacks: installer updates local Codex state and still requires a new Codex thread or app restart for discovery.
- Impact: setup becomes closer to "install once, use naturally".

## Verification

Phase 23 should pass:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Codex may still skip the skill for prompts that look like pure product brainstorming instead of repository inspection.
- Existing open threads may not load newly installed skills until a new thread is created.
- Exact Codex model billing remains unavailable to MCP; telemetry remains payload-estimated.
