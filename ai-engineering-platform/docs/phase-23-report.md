# Phase 23 Completion Report

## Summary

Phase 23 originally improved real-world Codex usability by adding a global auto-use skill for natural repository prompts. Phase 25 later changed activation to explicit-only after real usage showed auto-triggering could surprise users on ordinary prompts.

This phase does not claim perfect host-level forced tool use. Historical Phase 23 behavior used broad bilingual metadata; current behavior is documented in Phase 25.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Codex auto-use skill | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` defines broad Thai and English triggers plus MCP-first workflow rules. |
| Follow-up intent hardening | Completed | The auto-use skill handles project-purpose follow-ups such as "โปรเจ็กต์นี้ทำอะไร", "ใช้ทำอะไร", "อันนี้ทำอะไร", and "มันทำอะไร". |
| Single skill command mode | Completed | `$ai-engineering-platform-auto-use` is the only command-style skill entrypoint and forces MCP-first behavior when explicitly used. |
| Codex integration installer | Completed | `scripts/install-codex-integration.mjs` installs the skill into Codex home and ensures the MCP server config block exists. |
| Package script | Completed | `pnpm codex:install` runs the installer. |
| Documentation | Completed | README, roadmap, TODO, and this report document Phase 23 behavior and limits. |

## Trigger Strategy

Historical Phase 23 used intent classes instead of exact prompt matching:

- Project summary and project explanation.
- Tech stack, dependency, architecture, module, folder, and data-flow questions.
- Bug investigation, error/log/stack-trace analysis, and debugging.
- Code review, risk review, technical debt, and security review.
- Feature planning, refactoring, impact analysis, and verification planning.
- Thai casual prompts such as "สรุปโปรเจ็กต์นี้", "โปรเจ็กต์นี้ใช้อะไร", "ดูโครงสร้างให้หน่อย", "ช่วยหาบั๊ก", and "ช่วยวางแผนแก้".
- Follow-up prompts that refer back to the current repository with short wording such as "แล้วโปรเจ็กต์นี้ใช้ทำอะไร", "อันนี้ทำอะไร", "มันทำอะไร", and "สรุปอีกที".
- Explicit command-style prompts that mention `$ai-engineering-platform-auto-use`.

## Single Entrypoint

The platform intentionally exposes one user-facing skill entrypoint:

```text
$ai-engineering-platform-auto-use
```

No separate `$ai-agent` alias is installed. Current behavior after Phase 25 requires explicit `$ai-engineering-platform-auto-use` activation.

## Architecture Decisions

### Use a Codex skill instead of per-repository `AGENTS.md`

- Reason: users should not need to edit every repository after installation.
- Benefits: one installation can affect normal project prompts across repositories.
- Drawbacks: skill triggering is still controlled by Codex host behavior and cannot be guaranteed for every possible wording.
- Impact: common project-understanding prompts should route to MCP more often without explicit user instructions.

### Keep MCP startup low-token

- Reason: auto-use would be too expensive if every project prompt called full metadata.
- Benefits: the skill started with `platform.health`, `platform.tool_summary`, and `repository.overview` in Phase 23. Phase 26 later moved project summaries to `repository.project_profile` before `repository.overview`.
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
