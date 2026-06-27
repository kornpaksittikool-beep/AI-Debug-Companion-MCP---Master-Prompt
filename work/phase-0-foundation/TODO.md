# Project TODO

## Status Legend

- Planned: not started.
- In Progress: actively being worked on.
- Completed: done, tested, documented, and accepted.

## Phase 0: Foundation Documentation

| TODO | Status | Acceptance Criteria |
| --- | --- | --- |
| Create roadmap | In Progress | Roadmap includes milestone, phase, feature, dependency, priority, complexity, and status. |
| Define exact platform folder structure | In Progress | Architecture document contains the target repository tree. |
| Create architecture overview | In Progress | Architecture explains core, modules, plugins, request lifecycle, security, performance, and testing model. |
| Create ADRs | In Progress | ADRs explain decisions, benefits, drawbacks, and impact. |
| Define MCP tool contract | In Progress | Tool contract includes description, input schema, output schema, error schema, permission, timeout, and retry strategy. |
| Define Phase 1 deliverables | In Progress | Deliverables are observable and testable. |

## Phase 1: Core MCP Framework

| TODO | Status | Acceptance Criteria |
| --- | --- | --- |
| NestJS TypeScript scaffold | Planned | Project builds with strict TypeScript configuration. |
| Core MCP server abstraction | Planned | MCP requests can be normalized and routed through a core boundary. |
| Tool registry | Planned | Tools can register without core knowing tool internals. |
| Plugin contract | Planned | Plugin manifests can declare tools, permissions, schemas, timeout, and retry policy. |
| Health tool | Planned | Health tool returns platform status through registry. |
| Platform metadata tool | Planned | Metadata tool returns version, enabled modules, and registered tools. |
| Structured logging | Planned | Start, success, failed, execution time, and error detail are logged. |
| Standard error envelope | Planned | Errors include message, reason, suggestion, code, and trace context. |
| Test baseline | Planned | Unit and integration tests run with coverage reporting. |

## Future Feature Backlog

| TODO | Phase | Status |
| --- | --- | --- |
| Investigation session engine | Phase 2 | Planned |
| Evidence registry | Phase 2 | Planned |
| Problem classifier | Phase 2 | Planned |
| Repository scanner | Phase 3 | Planned |
| AST parser interface | Phase 3 | Planned |
| Symbol search | Phase 3 | Planned |
| Smart context reader | Phase 3 | Planned |
| Database schema reader | Phase 4 | Planned |
| Database relation explorer | Phase 4 | Planned |
| Read-only query preview | Phase 4 | Planned |
| Git recent changes reader | Phase 5 | Planned |
| Git blame reader | Phase 5 | Planned |
| Planning engine | Phase 6 | Planned |
| Impact engine | Phase 6 | Planned |
| Patch proposal engine | Phase 7 | Planned |
| Patch application engine | Phase 7 | Planned |
| Verification engine | Phase 7 | Planned |
| Project memory store | Phase 8 | Planned |
| Memory refresh and export | Phase 8 | Planned |
| Incremental scan optimization | Phase 9 | Planned |
| Cache invalidation strategy | Phase 9 | Planned |
| Plugin marketplace readiness | Phase 10 | Planned |
