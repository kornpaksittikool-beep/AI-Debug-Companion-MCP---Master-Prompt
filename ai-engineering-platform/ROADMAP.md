# AI Engineering Platform Roadmap

## Purpose

This roadmap defines the phased delivery plan for an AI Engineering Platform that uses MCP as an interoperability protocol. The platform core must remain independent from any specific AI provider, client, or model.

The system must be developed iteratively. Each phase must produce usable, verifiable deliverables before the next phase starts.

## Status Legend

- Planned: approved for future work but not started.
- In Progress: actively being designed or implemented.
- Completed: implemented, tested, documented, and accepted.

## Complexity Legend

- Low: isolated, small surface area, limited dependencies.
- Medium: several modules or contracts, moderate integration risk.
- High: architecture-level change, cross-module behavior, or significant reliability/security impact.

## Milestones

| Milestone | Phase | Feature | Dependency | Priority | Estimated Complexity | Status |
| --- | --- | --- | --- | --- | --- | --- |
| M0: Foundation | Phase 0 | Roadmap, architecture, ADR, TODO, and governance documentation | None | Critical | Medium | Completed |
| M1: Core MCP Framework | Phase 1 | NestJS application scaffold with strict TypeScript baseline | Phase 0 approval | Critical | Medium | Completed |
| M1: Core MCP Framework | Phase 1 | MCP transport boundary and core server abstraction | NestJS scaffold | Critical | High | Completed |
| M1: Core MCP Framework | Phase 1 | Tool registry with plugin registration contract | Core server abstraction | Critical | High | Completed |
| M1: Core MCP Framework | Phase 1 | Structured logging, request correlation, and execution timing | Core server abstraction | High | Medium | Completed |
| M1: Core MCP Framework | Phase 1 | Standard error envelope with reason and suggestion | Core server abstraction | High | Medium | Completed |
| M1: Core MCP Framework | Phase 1 | Basic health and platform metadata MCP tools | Tool registry | High | Low | Completed |
| M1: Core MCP Framework | Phase 1 | Unit and integration test baseline with coverage gate | Scaffold | Critical | Medium | Completed |
| M2: Investigation Engine | Phase 2 | Investigation session model with evidence, hypotheses, visited resources, and conclusion | Phase 1 | Critical | High | Completed |
| M2: Investigation Engine | Phase 2 | Problem classifier for errors, logs, stack traces, screenshots, issues, and feature requests | Investigation session model | High | Medium | Completed |
| M2: Investigation Engine | Phase 2 | Evidence registry with traceable source references | Investigation session model | Critical | High | Completed |
| M3: Repository Intelligence | Phase 3 | Repository scanner with ignore rules and path validation | Phase 1 | Critical | High | Completed |
| M3: Repository Intelligence | Phase 3 | Bounded file search by path, extension, and text preview | Repository scanner | Critical | Medium | Completed |
| M3: Repository Intelligence | Phase 3 | File and module context reader with bounded content reads | Repository scanner | Critical | Medium | Completed |
| M3: Repository Intelligence | Phase 3 | AST parser plugin interface for TypeScript and JavaScript | Repository scanner | High | High | Completed |
| M3: Repository Intelligence | Phase 3 | Symbol search backed by a bounded AST index | AST parser interface | Critical | High | Completed |
| M3: Repository Intelligence | Phase 3 | Symbol-level smart context reader | Symbol index | Critical | High | Completed |
| M4: Database Intelligence | Phase 4 | Database connection abstraction with explicit permissions | Phase 1 | High | High | Completed |
| M4: Database Intelligence | Phase 4 | Schema and relation discovery tools | Database abstraction | High | Medium | Completed |
| M4: Database Intelligence | Phase 4 | Query preview with read-only enforcement | Database abstraction | High | Medium | Completed |
| M5: Git Intelligence | Phase 5 | Recent change reader | Phase 1 | High | Medium | Completed |
| M5: Git Intelligence | Phase 5 | Blame and commit lookup tools | Recent change reader | High | Medium | Completed |
| M5: Git Intelligence | Phase 5 | Change impact hints from file history | Git readers | Medium | Medium | Completed |
| M6: Planning and Impact | Phase 6 | Multi-level planning engine for quick fix, normal fix, refactor, and architecture change | Investigation engine | Critical | High | Completed |
| M6: Planning and Impact | Phase 6 | Impact report generator for files, modules, APIs, database, cache, queue, workers, and regression risk | Repository and Git intelligence | Critical | High | Completed |
| M6: Planning and Impact | Phase 6 | Approval gate workflow | Planning engine | Critical | Medium | Completed |
| M7: Patch and Verification | Phase 7 | Patch proposal and rollback strategy model | Planning engine | Critical | High | Completed |
| M7: Patch and Verification | Phase 7 | Safe patch application boundary with verification checkpoints | Patch proposal model | Critical | High | Completed |
| M7: Patch and Verification | Phase 7 | Build, test, lint, and coverage verification tools | Command allow list | Critical | High | Completed |
| M8: Project Memory | Phase 8 | Versioned project memory store | Investigation and repository intelligence | High | High | Completed |
| M8: Project Memory | Phase 8 | Architecture, business flow, naming convention, and known issue memory records | Memory store | High | Medium | Completed |
| M8: Project Memory | Phase 8 | Memory refresh, rebuild, and export workflows | Memory store | Medium | Medium | Completed |
| M9: Performance and Security | Phase 9 | Incremental scanning optimization | Repository intelligence | High | High | Completed |
| M9: Performance and Security | Phase 9 | Cache invalidation strategy | Repository intelligence | High | High | Completed |
| M9: Performance and Security | Phase 9 | Hardened path, command, prompt, and plugin security controls | All prior phases | Critical | High | Completed |
| M10: Plugin Marketplace Readiness | Phase 10 | Plugin installation, removal, update, and compatibility metadata | Tool registry | High | High | Completed |
| M10: Plugin Marketplace Readiness | Phase 10 | Language plugin SDK | Repository intelligence | Medium | High | Completed |
| M10: Plugin Marketplace Readiness | Phase 10 | External tool plugin SDK | Tool registry | Medium | High | Completed |
| M11: Compatibility Resolution | Phase 11 | Semantic plugin compatibility resolver for platform, Node.js, and runtime metadata | Plugin marketplace readiness | High | Medium | Completed |
| M12: Dynamic Plugin Loading | Phase 12 | Approved local plugin enable, disable, and update execution workflow | Compatibility resolution | High | High | Planned |
| M13: AI Provider Boundary | Phase 13 | Provider-neutral AI adapter contracts for OpenAI, Claude, Gemini, Ollama, OpenRouter, and local LLMs | Core MCP framework | High | High | Planned |
| M14: Database Expansion | Phase 14 | PostgreSQL and MySQL read-only adapters | Database intelligence | Medium | High | Planned |
| M15: Deep Repository Intelligence | Phase 15 | Import graph, call graph, persistent incremental index, and cross-repository search | Repository intelligence and cache foundation | High | High | Planned |
| M16: Approved Patch Application | Phase 16 | Actual patch apply engine behind approval, rollback, and verification gates | Patch proposal workflow | Critical | High | Planned |
| M17: Remote Plugin Marketplace | Phase 17 | Remote plugin discovery, checksum/signature verification, and sandboxed staging | Dynamic plugin loading | Medium | High | Planned |

## Phase Gate Rules

Each phase must pass the following checks before the next phase begins:

1. All planned deliverables for the phase are completed.
2. Public contracts are documented.
3. Tests exist for business logic and tool behavior.
4. Verification commands pass.
5. Risks and limitations are documented.
6. The user approves the phase completion report.

## Current Phase

Phase 11 is completed. Phase 12 is planned and must not start until its execution plan is approved.
