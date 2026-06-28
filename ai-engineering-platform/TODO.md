# Project TODO

## Status Legend

- Planned: not started.
- In Progress: actively being worked on.
- Completed: done, tested, documented, and accepted.

## Phase 0: Foundation Documentation

| TODO | Status | Acceptance Criteria |
| --- | --- | --- |
| Create roadmap | Completed | Roadmap includes milestone, phase, feature, dependency, priority, complexity, and status. |
| Define exact platform folder structure | Completed | Architecture document contains the target repository tree. |
| Create architecture overview | Completed | Architecture explains core, modules, plugins, request lifecycle, security, performance, and testing model. |
| Create ADRs | Completed | ADRs explain decisions, benefits, drawbacks, and impact. |
| Define MCP tool contract | Completed | Tool contract includes description, input schema, output schema, error schema, permission, timeout, and retry strategy. |
| Define Phase 1 deliverables | Completed | Deliverables are observable and testable. |

## Phase 1: Core MCP Framework

| TODO | Status | Acceptance Criteria |
| --- | --- | --- |
| NestJS TypeScript scaffold | Completed | Project builds with strict TypeScript configuration. |
| Core MCP server abstraction | Completed | MCP requests can be normalized and routed through a core boundary. |
| Tool registry | Completed | Tools can register without core knowing tool internals. |
| Plugin contract | Completed | Plugin manifests can declare tools, permissions, schemas, timeout, and retry policy. |
| Health tool | Completed | Health tool returns platform status through registry. |
| Platform metadata tool | Completed | Metadata tool returns version, enabled modules, and registered tools. |
| Structured logging | Completed | Start, success, failed, execution time, and error detail are logged. |
| Standard error envelope | Completed | Errors include message, reason, suggestion, code, and trace context. |
| Test baseline | Completed | Unit and integration tests run with coverage reporting. |

## Future Feature Backlog

| TODO | Phase | Status |
| --- | --- | --- |
| Investigation session engine | Phase 2 | Completed |
| Evidence registry | Phase 2 | Completed |
| Problem classifier | Phase 2 | Completed |
| Repository scanner | Phase 3 | Completed |
| File search | Phase 3 | Completed |
| File and module context reader | Phase 3 | Completed |
| AST parser interface | Phase 3 | Completed |
| Symbol search | Phase 3 | Completed |
| Function-level smart context reader | Phase 3 | Completed |
| Database schema reader | Phase 4 | Completed |
| Database relation explorer | Phase 4 | Completed |
| Read-only query preview | Phase 4 | Completed |
| Git recent changes reader | Phase 5 | Completed |
| Git blame reader | Phase 5 | Completed |
| Git file commit lookup | Phase 5 | Completed |
| Git change impact hints | Phase 5 | Completed |
| Planning engine | Phase 6 | Completed |
| Impact engine | Phase 6 | Completed |
| Approval gate workflow | Phase 6 | Completed |
| Patch proposal engine | Phase 7 | Completed |
| Patch application boundary | Phase 7 | Completed |
| Verification engine | Phase 7 | Completed |
| Project memory store | Phase 8 | Completed |
| Memory refresh and export | Phase 8 | Completed |
| Incremental scan optimization | Phase 9 | Completed |
| Cache invalidation strategy | Phase 9 | Completed |
| Security audit workflows | Phase 9 | Completed |
| Plugin marketplace readiness | Phase 10 | Completed |
| Language plugin SDK contract | Phase 10 | Completed |
| External tool plugin SDK contract | Phase 10 | Completed |
| Semantic plugin compatibility resolver | Phase 11 | Completed |
| Dynamic plugin loading | Phase 12 | Completed |
| AI provider adapter boundary | Phase 13 | Completed |
| PostgreSQL and MySQL read-only adapter contracts and connection profile validation | Phase 14 | Completed |
| Import graph, call graph, persistent index, and cross-repository search | Phase 15 | Completed |
| Approved patch application engine | Phase 16 | Completed |
| Remote plugin marketplace staging | Phase 17 | Completed |
| Token estimate tool | Phase 18 | Completed |
| Context compression tool | Phase 18 | Completed |
| Token-aware strategy recommendation tool | Phase 18 | Completed |
| Codex MCP readiness check | Phase 19 | Completed |
| Integration session telemetry | Phase 19 | Completed |
| MCP usage and token-saving summary | Phase 19 | Completed |
| Durable local telemetry flush/load | Phase 20 | Completed |
| Workflow routing index | Phase 20 | Completed |
| Workflow index MCP smoke coverage | Phase 20 | Completed |
| Automatic MCP execution telemetry | Phase 21 | Completed |
| Automatic token telemetry summary tool | Phase 21 | Completed |
| Automatic telemetry smoke coverage | Phase 21 | Completed |
| Compact platform metadata mode | Phase 22 | Completed |
| Compact platform tool summary | Phase 22 | Completed |
| Compact metadata MCP smoke coverage | Phase 22 | Completed |
| Codex auto-use skill | Phase 23 | Completed |
| Codex integration installer | Phase 23 | Completed |
| Auto-use integration documentation | Phase 23 | Completed |
| Low-token project summary routing | Phase 24 | Completed |
| On-demand import graph policy | Phase 24 | Completed |
| Token-aware skill and workflow index updates | Phase 24 | Completed |
| Explicit skill activation policy | Phase 25 | Completed |
| Disable ordinary-prompt auto-triggering | Phase 25 | Completed |
| Compact project profile tool | Phase 26 | Completed |
| Profile-first token routing | Phase 26 | Completed |
| Codex billing limitation reporting | Phase 26 | Completed |
| Compact file excerpt tool | Phase 27 | Completed |
| Excerpt-first summary routing | Phase 27 | Completed |
| Read-file-context escalation guidance | Phase 27 | Completed |
| Question-type token profiles | Phase 28 | Completed |
| Workflow target token ranges and context policies | Phase 28 | Completed |
| Excerpt maxBytes and call limits by question type | Phase 28 | Completed |
| Hard do-not-call tool guidance | Phase 28 | Completed |
| Telemetry over-budget status reporting | Phase 28 | Completed |
| Codex skill guidance for summary, tech stack, debug, review, and planning budgets | Phase 28 | Completed |
| Remove broad symbol search from routine project-summary routing | Phase 29 | Completed |
| Add summary symbol-search regression checks to smoke coverage | Phase 29 | Completed |
| Add capped summary mode to repository.search_files | Phase 30 | Completed |
| Route summaries through mode=summary and maxMatches<=8 | Phase 30 | Completed |
| Add smoke coverage for summary search caps | Phase 30 | Completed |
| Add summary mode to repository.project_profile | Phase 31 | Completed |
| Route summaries through project_profile mode=summary | Phase 31 | Completed |
| Add smoke coverage for summary project profile payload shape | Phase 31 | Completed |
| Cap summary read_file_excerpt default maxBytes at 700 | Phase 32 | Completed |
| Update summary strategy and workflow excerpt guidance | Phase 32 | Completed |
| Add smoke and unit coverage for summary excerpt caps | Phase 32 | Completed |
