# Phase 36 Report: Adaptive Gate Compactness

Phase 36 keeps the planning-first rule from Phase 35 while reducing response overhead for low-risk read-only work. Explicit Codex skill responses now use an adaptive gate mode: compact read-only gates for summaries and informational reads, and expanded execution gates for implementation, review, debugging, and patch workflows.

## Deliverables

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Adaptive skill gate policy | Completed | `codex/skills/ai-engineering-platform-auto-use/SKILL.md` defines `compact_read_only` and `expanded_execution` gate behavior. |
| Token strategy gate metadata | Completed | `token_budget.recommend_strategy` returns `questionProfile.gateMode` for every question profile. |
| Workflow index gate metadata | Completed | `integration.workflow_index` returns `gateMode` for every workflow entry. |
| Summary route compactness | Completed | `project_summary` uses `compact_read_only`, still starts with `platform.health` and `repository.project_profile`, and still avoids routine `platform.tool_summary`. |
| Runtime phase metadata | Completed | `platform.metadata` reports `phase-36-adaptive-gate-compactness`. |
| Regression coverage | Completed | Unit and smoke tests assert compact summary gate metadata while preserving summary token guardrails. |

## Gate Modes

### `compact_read_only`

Use this mode for low-risk read-only prompts such as project summaries, tech stack checks, token checks, database reads, and git reads. The response should use 4-5 short gate lines:

```text
Workflow Gate: read-only
- Objective: summarize project purpose from repo evidence
- Evidence: health + project_profile, excerpt only if needed
- Impact/Approval: No file changes; Not required: read-only
- Verification/MCP: cite evidence and telemetry footer; use low-token summary route
```

### `expanded_execution`

Use this mode for implementation, refactoring, debugging that may modify files, code review, patch execution, security review, and planning that can lead to writes. The gate keeps the full fields:

- Objective
- Investigation Plan
- Evidence Target
- Impact
- Approval
- Verification
- MCP Usage Plan

## Impact

- Reduces visual noise for routine summaries without removing planning evidence.
- Preserves approval semantics for write/change workflows.
- Keeps Phase 34 and Phase 35 token guardrails intact.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:cov`
- `node scripts/mcp-smoke-test.mjs`
- `pnpm codex:install`

## Limitations

- The platform can expose `gateMode` through MCP outputs and skill instructions, but final response formatting still depends on the Codex host following the loaded skill.
- Exact total Codex billing remains unavailable unless the host exposes model usage metadata.
