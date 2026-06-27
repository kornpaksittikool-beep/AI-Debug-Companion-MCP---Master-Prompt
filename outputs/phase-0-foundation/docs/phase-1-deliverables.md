# Phase 1 Deliverables

## Phase Objective

Phase 1 delivers the minimum production-quality core MCP framework. It must be usable as a real foundation for future modules and plugins, not as a disposable prototype.

## Scope

Phase 1 includes only the core platform framework, registry, logging, errors, security policy foundation, and minimal built-in tools required to prove the architecture.

Phase 1 excludes repository intelligence, database intelligence, git intelligence, patch application, project memory, and AI provider integration.

## Deliverables

| Deliverable | Verification Method | Acceptance Criteria |
| --- | --- | --- |
| NestJS TypeScript project scaffold | `npm run build` | Build succeeds with strict TypeScript enabled. |
| Core MCP boundary | Unit and integration tests | MCP requests are normalized and routed through a core service boundary. |
| Tool registry | Unit and integration tests | Tools register through a registry; core does not import concrete tool handlers. |
| Plugin manifest contract | Unit tests | A manifest can declare tool metadata, permissions, timeout, and retry strategy. |
| Standard tool definition interface | Type checking and tests | Tool definitions include description, input schema, output schema, error schema, permission, timeout, and retry strategy. |
| Standard error envelope | Unit tests | Errors return message, reason, suggestion, code, and correlation context. |
| Structured logging | Integration tests or captured logger mock | Tool execution logs start, success, failure, execution time, and error details. |
| Security policy foundation | Unit tests | Path and command policies exist and default to deny unsafe access. |
| Health MCP tool | Tool contract test | Tool returns health status through the registry. |
| Platform metadata MCP tool | Tool contract test | Tool returns platform version, enabled modules, and registered tool names. |
| Test baseline | `npm run test`, `npm run test:cov` | Unit and integration test commands run; coverage reporting is available. |
| Documentation update | Manual review | README explains setup, scripts, architecture summary, and Phase 1 limitations. |

## Required Scripts

Phase 1 must provide these scripts:

```text
npm run build
npm run lint
npm run test
npm run test:cov
npm run test:integration
```

The package manager can be `pnpm` if approved before Phase 1 starts. The script names must remain stable regardless of package manager.

## Non-Goals

Phase 1 must not implement:

- Repository scanner.
- AST parser.
- Git history reader.
- Database connector.
- Patch application.
- Verification command runner beyond test scaffolding.
- Project memory.
- AI provider adapters.
- Plugin marketplace installation workflow.

## Phase 1 Approval Checklist

Before Phase 1 starts, the user must approve:

- Package manager.
- MCP SDK/library choice.
- Initial transport support.
- Test framework.
- Runtime Node.js version.
- Whether the repo should be initialized directly in the workspace root or generated under a subfolder.

## Phase 1 Completion Checklist

Phase 1 is complete only when:

- All deliverables above are implemented.
- All required scripts pass.
- Tool contract tests cover built-in tools.
- Documentation is updated.
- Phase 1 report lists evidence, changed files, risk, verification results, and Phase 2 recommendation.
