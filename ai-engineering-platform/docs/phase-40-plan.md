# Phase 40 Plan: Real Integration Workflows

Phase 40 turns the platform's existing MCP capabilities into explicit workflow contracts for the real Codex tasks used most often: project summary, debugging, code review, and planning.

## Objective

Expose verifiable workflow acceptance criteria through runtime metadata so Codex clients can route work through narrow, evidence-backed MCP workflows instead of composing tools ad hoc.

## Scope

| Work Item | Status | Acceptance Criteria |
| --- | --- | --- |
| Workflow acceptance criteria | Completed | Summary, debugging, code review, and planning profiles each define observable criteria for start tools, evidence boundaries, reporting, and verification. |
| Token strategy metadata | Completed | `token_budget.recommend_strategy` returns workflow acceptance criteria for the four primary workflows. |
| Workflow index metadata | Completed | `integration.workflow_index` returns workflow acceptance criteria and query matching covers that text. |
| Regression coverage | Completed | Unit tests assert the Phase 40 workflow contracts and smoke coverage checks MCP output from the built server. |
| Phase metadata alignment | Completed | Platform phase metadata, smoke expectations, README, ROADMAP, TODO, and capability docs use `phase-40-real-integration-workflows`. |

## Non-Goals

- No remote plugin code execution or dynamic remote install.
- No external database network execution.
- No AI provider API execution.
- No unapproved patch application.
- No broad rewrite of historical phase reports.

## Verification Plan

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm smoke:mcp`
- `pnpm check:docs`

## Rollback Plan

Revert the Phase 40 workflow metadata, tests, smoke assertions, phase metadata, README, ROADMAP, TODO, and Phase 40 docs. Restore the platform phase label to `phase-39-documentation-consistency` if verification shows workflow metadata conflicts with runtime behavior.

## Risks

- Acceptance criteria can drift if future workflows update routing without updating tests.
- Workflow contracts are metadata and guidance; host clients still need to follow them.
- The phase improves workflow verification but does not add new external execution capabilities.
