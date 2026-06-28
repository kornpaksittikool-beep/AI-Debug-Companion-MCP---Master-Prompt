# Phase 25 Completion Report

## Summary

Phase 25 changes Codex integration from broad auto-triggering to explicit skill activation. Real usage showed that the auto-use skill could activate on ordinary project-summary prompts even when the user did not intend to use MCP. The platform now keeps a single entrypoint, `$ai-engineering-platform-auto-use`, and avoids activating the skill unless the user names it.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Explicit-only skill metadata | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` now says to use the skill only when `$ai-engineering-platform-auto-use` is present or the exact skill name is requested. |
| Ordinary prompt opt-out | Completed | The skill description explicitly says not to trigger for normal summaries, debugging, reviews, planning, token questions, or follow-ups that do not name the skill. |
| Documentation update | Completed | README, roadmap, TODO, and historical Phase 23 report describe the explicit activation policy. |
| Runtime phase update | Completed | Platform metadata reports `phase-25-explicit-skill-activation`. |

## Architecture Decisions

### Prefer explicit activation over broad auto-use

- Reason: users need predictable control over when MCP is used.
- Benefits: ordinary prompts no longer unexpectedly load the MCP skill.
- Drawbacks: users must type `$ai-engineering-platform-auto-use` when they want guaranteed MCP-first behavior.
- Impact: token and latency are easier to control, and skill use becomes user-directed.

### Keep one skill entrypoint

- Reason: the user requested one command-style skill rather than multiple aliases.
- Benefits: no `$ai-agent` or alternate naming confusion.
- Drawbacks: the skill name is longer than a short slash command.
- Impact: installed behavior is explicit and consistent across projects.

## Verification

Phase 25 must pass:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Residual Risks

- Codex host behavior still controls skill discovery, but the skill metadata is now narrow enough to avoid normal intent-based activation.
- Exact native slash-command support remains outside this repository's control.
