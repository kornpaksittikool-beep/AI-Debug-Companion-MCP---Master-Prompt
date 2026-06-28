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
| M12: Dynamic Plugin Loading | Phase 12 | Approved local plugin enable, disable, and update execution workflow | Compatibility resolution | High | High | Completed |
| M13: AI Provider Boundary | Phase 13 | Provider-neutral AI adapter contracts for OpenAI, Claude, Gemini, Ollama, OpenRouter, and local LLMs | Core MCP framework | High | High | Completed |
| M14: Database Expansion | Phase 14 | PostgreSQL and MySQL read-only adapter contracts and connection profile validation | Database intelligence | Medium | High | Completed |
| M15: Deep Repository Intelligence | Phase 15 | Import graph, call graph, persistent incremental index, and cross-repository search | Repository intelligence and cache foundation | High | High | Completed |
| M16: Approved Patch Application | Phase 16 | Actual patch apply engine behind approval, rollback, and verification gates | Patch proposal workflow | Critical | High | Completed |
| M17: Remote Plugin Marketplace | Phase 17 | Remote plugin discovery, checksum/signature verification, and sandboxed staging | Dynamic plugin loading | Medium | High | Completed |
| M18: Token Budget and Context Compression | Phase 18 | Approximate context token estimator for candidate evidence and tool outputs | Repository intelligence and AI provider boundary | High | Medium | Completed |
| M18: Token Budget and Context Compression | Phase 18 | Priority-aware deterministic context compression | Token estimator | High | Medium | Completed |
| M18: Token Budget and Context Compression | Phase 18 | Token-aware MCP evidence gathering strategy recommendations | Token estimator and registered tool contracts | High | Medium | Completed |
| M19: Codex Integration Telemetry | Phase 19 | MCP client readiness checks for configured server, expected tools, and project instructions | Phase 18 and Codex MCP config | High | Medium | Completed |
| M19: Codex Integration Telemetry | Phase 19 | In-memory integration session and tool usage telemetry | Readiness checks | High | Medium | Completed |
| M19: Codex Integration Telemetry | Phase 19 | Estimated manual-read token avoidance summary | Token budget tools | High | Medium | Completed |
| M20: Durable Telemetry and Workflow Index | Phase 20 | Durable local telemetry flush and reload under project state | Phase 19 telemetry | High | Medium | Completed |
| M20: Durable Telemetry and Workflow Index | Phase 20 | Workflow routing index from task type to tools, modules, and files | Phase 19 readiness and tool metadata | High | Medium | Completed |
| M20: Durable Telemetry and Workflow Index | Phase 20 | MCP smoke coverage for workflow index and telemetry persistence | Durable telemetry tools | High | Low | Completed |
| M21: Automatic Token Telemetry Reporting | Phase 21 | Core execution telemetry for every MCP tool call | Core MCP execution boundary | High | Medium | Completed |
| M21: Automatic Token Telemetry Reporting | Phase 21 | Automatic token telemetry summary and reset tools | Core execution telemetry | High | Medium | Completed |
| M21: Automatic Token Telemetry Reporting | Phase 21 | MCP smoke coverage proving automatic telemetry population | Summary tool | High | Low | Completed |
| M22: Compact Metadata and Token Reporting UX | Phase 22 | Compact metadata mode for low-token platform startup checks | Platform metadata and automatic telemetry | High | Medium | Completed |
| M22: Compact Metadata and Token Reporting UX | Phase 22 | Compact tool summary grouped by module for routing | Tool registry | High | Medium | Completed |
| M22: Compact Metadata and Token Reporting UX | Phase 22 | MCP smoke coverage proving compact routing and telemetry remain usable | Compact metadata and telemetry summary | High | Low | Completed |
| M23: Codex Auto-Use Integration | Phase 23 | Global Codex skill for natural Thai and English repository intents | Phase 22 compact tool summary | High | Medium | Completed |
| M23: Codex Auto-Use Integration | Phase 23 | One-command Codex integration installer for MCP config and skill installation | MCP build artifact and Codex home | High | Medium | Completed |
| M23: Codex Auto-Use Integration | Phase 23 | Documentation for auto-use limits and verification workflow | Codex skill and installer | High | Low | Completed |
| M24: Token-Aware MCP Routing | Phase 24 | Low-token project summary workflow that avoids import graph by default | Phase 23 auto-use skill | High | Medium | Completed |
| M24: Token-Aware MCP Routing | Phase 24 | Workflow index and token recommendation updates for on-demand graph tools | Integration telemetry and token budget modules | High | Medium | Completed |
| M24: Token-Aware MCP Routing | Phase 24 | Skill policy for session telemetry clarity and generated artifact exclusions | Codex auto-use skill | High | Low | Completed |
| M25: Explicit Skill Activation | Phase 25 | Restrict Codex skill activation to explicit `$ai-engineering-platform-auto-use` invocation | Phase 24 token-aware routing | High | Low | Completed |
| M25: Explicit Skill Activation | Phase 25 | Update installed skill and documentation to avoid surprising auto-trigger behavior | Codex integration installer | High | Low | Completed |
| M26: Compact Profile Token Reporting | Phase 26 | Add `repository.project_profile` for lower-token project summaries | Phase 24 token-aware routing | High | Medium | Completed |
| M26: Compact Profile Token Reporting | Phase 26 | Route project-summary workflows and Codex skill guidance through compact profile before overview | Phase 25 explicit skill activation | High | Medium | Completed |
| M26: Compact Profile Token Reporting | Phase 26 | Clarify MCP payload estimates versus exact total Codex billing limits | Phase 21 automatic telemetry | High | Low | Completed |
| M27: File Excerpt Token Reduction | Phase 27 | Add `repository.read_file_excerpt` for low-token summary evidence | Phase 26 compact profile routing | High | Medium | Completed |
| M27: File Excerpt Token Reduction | Phase 27 | Route summary workflows away from full `repository.read_file_context` unless excerpts are insufficient | Phase 26 telemetry evidence | High | Medium | Completed |
| M27: File Excerpt Token Reduction | Phase 27 | Update Codex skill guidance and smoke coverage for excerpt-first summaries | Codex integration installer | High | Low | Completed |
| M28: Question-Type Token Profiles | Phase 28 | Add explicit token budget profiles for summaries, tech stack quick views, debugging, code review, and planning | Phase 27 excerpt-first routing | High | Medium | Completed |
| M28: Question-Type Token Profiles | Phase 28 | Enforce excerpt maxBytes, excerpt call limits, hard do-not-call tools, and telemetry over-budget reporting | Phase 28 workflow profiles | High | Medium | Completed |
| M28: Question-Type Token Profiles | Phase 28 | Update Codex skill guidance, smoke coverage, and docs for question-specific context routing | Phase 25 explicit skill activation | High | Low | Completed |
| M29: Summary Symbol Guardrails | Phase 29 | Remove symbol search from routine project-summary preferred routes and mark it as hard do-not-call guidance | Phase 28 question-type profiles | High | Low | Completed |
| M29: Summary Symbol Guardrails | Phase 29 | Add smoke coverage that fails when summary routing recommends `repository.search_symbols` | Phase 29 routing update | High | Low | Completed |
| M30: Summary Search Result Caps | Phase 30 | Add `repository.search_files` summary mode with max 8 returned matches and no preview payload | Phase 29 summary guardrails | High | Medium | Completed |
| M30: Summary Search Result Caps | Phase 30 | Route summary workflows through `mode=summary` and `maxMatches<=8` | Phase 30 search mode | High | Low | Completed |
| M30: Summary Search Result Caps | Phase 30 | Add smoke coverage for capped summary search and compact project-profile next tools | Phase 30 routing update | High | Low | Completed |
| M31: Summary Project Profile Mode | Phase 31 | Add `repository.project_profile` summary mode with smaller key-file, manifest, entrypoint, extension, and largest-file payloads | Phase 30 search caps | High | Medium | Completed |
| M31: Summary Project Profile Mode | Phase 31 | Route project-summary workflows and Codex skill guidance through `mode=summary` | Phase 31 profile mode | High | Low | Completed |
| M31: Summary Project Profile Mode | Phase 31 | Add smoke coverage for summary profile mode and capped profile payload shape | Phase 31 routing update | High | Low | Completed |
| M32: Summary Excerpt Byte Caps | Phase 32 | Cap `repository.read_file_excerpt` summary defaults at 700 bytes while keeping routing/debug/review larger | Phase 31 profile mode | High | Medium | Completed |
| M32: Summary Excerpt Byte Caps | Phase 32 | Route summary strategy and workflow guidance through `purpose=summary`, `maxBytes<=700`, and no more than 1-2 files | Phase 32 excerpt caps | High | Low | Completed |
| M32: Summary Excerpt Byte Caps | Phase 32 | Add smoke and unit coverage for summary excerpt byte caps | Phase 32 routing update | High | Low | Completed |
| M33: Summary Strict Mode | Phase 33 | Remove `repository.search_files` from routine project-summary preferred/evidence routes | Phase 32 excerpt caps | High | Low | Completed |
| M33: Summary Strict Mode | Phase 33 | Forbid architecture docs, source tree summaries, app module excerpts, and broad search unless explicitly requested | Phase 33 strict routing | High | Low | Completed |
| M33: Summary Strict Mode | Phase 33 | Add telemetry recommendation when project-summary runs make broad search the largest token source | Automatic telemetry | High | Low | Completed |

## Phase Gate Rules

Each phase must pass the following checks before the next phase begins:

1. All planned deliverables for the phase are completed.
2. Public contracts are documented.
3. Tests exist for business logic and tool behavior.
4. Verification commands pass.
5. Risks and limitations are documented.
6. The user approves the phase completion report.

## Current Phase

Phase 33 is completed. Future phases must be planned and approved before implementation.
