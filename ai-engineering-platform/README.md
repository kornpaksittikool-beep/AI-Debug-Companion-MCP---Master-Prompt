# AI Engineering Platform

AI Engineering Platform is a production-oriented MCP foundation for evidence-driven software engineering workflows.

Phase 38 provides the Core MCP Framework, Investigation Engine, bounded Repository Intelligence, summary startup mode, summary strict mode, summary project profile mode, compact project profile routing, adaptive planning gates for explicit Codex skill responses, user-facing compact reporting modes, summary excerpt byte caps, low-token file excerpts, question-type token profiles, summary symbol-search guardrails, summary search result caps, summary fallback discipline, TypeScript/JavaScript symbol intelligence, bounded import and call graphs, persistent repository graph indexing, cross-repository search, read-only SQLite Database Intelligence, PostgreSQL/MySQL connection profile validation, read-only Git Intelligence, Planning and Impact Engine, patch proposal workflow, deterministic approved patch application, rollback execution, allow-listed verification execution, versioned Project Memory, cache foundation, cache invalidation, read-only security audits, plugin marketplace readiness, semantic plugin compatibility resolution, approved local plugin state loading, remote plugin staging metadata, provider-neutral AI routing contracts, token-aware context budgeting tools, client integration telemetry, durable telemetry flush/load, workflow routing index, automatic MCP execution token telemetry, compact metadata routing, token-aware MCP routing, and an explicit Codex skill command for MCP-assisted work. It does not include automatic unapproved patch application, dynamic remote plugin installation, external plugin code execution, external database network execution, AI API execution, exact provider tokenizer integration, exact total Codex billing telemetry without host usage metadata, distributed telemetry storage, distributed cache, vector memory, cloud sync, remote Git hosting integration, automatic skill activation for ordinary prompts, or guaranteed host-level forced tool use.

Phase 39 completed documentation consistency across README, roadmap, TODO, phase reports, smoke-test metadata, and Codex skill guidance.

Phase 40 completes real integration workflow contracts for summary, debugging, code review, and planning by exposing workflow acceptance criteria through token strategy and workflow index metadata, adding regression coverage, and validating those contracts in the MCP smoke test.

## Requirements

- Node.js `>=22 <25`
- pnpm

## Setup

```bash
pnpm install
```

## Scripts

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:cov
pnpm test:integration
pnpm codex:install
```

## Run MCP Server

```bash
pnpm build
pnpm start
```

The Phase 1 server uses stdio transport through the official Model Context Protocol TypeScript SDK.

## Current Capabilities

- NestJS TypeScript application scaffold.
- Core MCP execution boundary.
- Registry-based tool registration.
- Plugin manifest and plugin module contract.
- Structured tool execution logging.
- Standardized error envelope.
- Built-in `platform.health` tool.
- Built-in `platform.metadata` tool.
- Built-in `platform.tool_summary` tool for compact low-token routing.
- Example `example.echo` plugin tool.
- Investigation sessions.
- Evidence registry inside each investigation session.
- Hypothesis tracking.
- Visited resource tracking.
- Evidence-backed investigation closure.
- Compact repository project profile for low-token summaries.
- Safe bounded repository overview.
- Safe bounded repository scan.
- File search by path, extension, and text preview.
- Compact file excerpts for low-token summaries, with summary default capped at 700 bytes.
- Bounded file context reads.
- Bounded module context reads.
- TypeScript and JavaScript AST-backed symbol search.
- Bounded symbol context reads for classes, functions, methods, interfaces, types, enums, and variables.
- Bounded TypeScript and JavaScript import graph generation with relative import resolution.
- Bounded best-effort TypeScript and JavaScript call graph generation.
- Persistent repository graph index metadata under `.ai-engineering-platform/repository-index`.
- Repository index freshness checks based on file size and modified time.
- Cross-repository bounded file search for multi-repository workflows.
- Read-only SQLite schema discovery.
- Read-only SQLite foreign-key relation discovery.
- Read-only SQLite query preview with row limits.
- Supported database dialect metadata for SQLite, PostgreSQL, and MySQL.
- PostgreSQL and MySQL connection profile validation without accepting passwords in MCP input.
- PostgreSQL and MySQL adapter contracts that fail closed until external read execution is explicitly enabled in a future phase.
- Read-only git recent change discovery.
- Read-only git blame metadata for tracked files.
- Read-only git file history lookup.
- Read-only git change impact hints from recent file history.
- Evidence-backed engineering plan generation.
- Read-only impact report generation.
- Approval gate state management before patch execution.
- Reviewable patch proposal creation from approved plans.
- Rollback plan generation for patch proposals.
- Approved deterministic whole-file patch application for create, update, and delete operations.
- Pre-apply file snapshots and rollback execution for applied patch runs.
- Allow-listed verification command execution with stored results.
- Versioned project memory records.
- Project memory search, summary, refresh, and export workflows.
- In-memory cache foundation for bounded scan workflows.
- Cache summary and invalidation workflows.
- Read-only project security audit for common prompt-injection and secret-marker risks.
- Tool permission audit against registered tool contracts.
- Plugin marketplace catalog metadata.
- Plugin manifest validation with compatibility metadata.
- Reviewable plugin install, remove, and update plans.
- Language plugin SDK and external tool plugin SDK contracts.
- Semantic compatibility checks for plugin platform, Node.js, and runtime requirements.
- Local plugin inventory stored under `.ai-engineering-platform/plugins`.
- Approved local plugin enable, disable, and staged update state workflows.
- Remote plugin staging plans for HTTPS archives, GitHub releases, and Git repository sources.
- SHA-256 remote plugin artifact verification without network access.
- Remote plugin staged metadata inventory under `.ai-engineering-platform/plugins/remote-staging`.
- Stored plugin lifecycle execution results with rollback and verification plans.
- Provider-neutral AI provider profiles for OpenAI, Claude, Gemini, DeepSeek, Ollama, OpenRouter, and local LLMs.
- AI request validation against provider and model metadata.
- Deterministic AI routing plans without calling external AI APIs.
- Approximate token estimation for candidate context.
- Deterministic context compression with priority-aware retention.
- Token-aware MCP evidence gathering strategy recommendations.
- Question-type token profiles for summary, tech stack quick view, debugging, code review, and planning workflows.
- Per-profile excerpt `maxBytes`, excerpt call limits, hard do-not-call tool guidance, and telemetry over-budget status.
- Codex and generic MCP client readiness checks from provided evidence.
- In-memory integration session and tool usage telemetry.
- Estimated manual-read token avoidance summaries.
- Durable local telemetry flush and reload under `.ai-engineering-platform/integration-telemetry`.
- Workflow index for routing task types to MCP tools, modules, and relevant files.
- Automatic MCP tool execution telemetry with approximate input and output token estimates.
- Automatic execution telemetry summary and reset tools.
- Real integration workflow acceptance criteria for project summary, debugging, code review, and planning workflows.
- Explicit Codex skill command through `$ai-engineering-platform-auto-use`.
- Adaptive `Workflow Gate` policy for explicit skill responses: compact read-only gates for summaries and expanded execution gates for change workflows.
- User-facing compact reporting policy with `normal_user_summary` as the default and `debug_telemetry` available for tools-used, telemetry, token-detail, evidence-detail, and debug-MCP requests.
- Summary fallback discipline that forbids broad `repository.read_file_context` fallback for routine project summaries, project-purpose answers, and `normal_user_summary`.
- Documentation consistency check for current phase status, roadmap/TODO alignment, Phase 39 report coverage, and smoke-test platform metadata.
- Codex integration installer for MCP config and skill installation.
- Token-aware routing policy that keeps `repository.import_graph` on-demand for project summaries and follow-ups.
- Jest unit and integration test baseline.

## Registered Tools

### `platform.health`

Returns platform health and readiness information.

### `platform.metadata`

Returns platform metadata and optionally registered tool details. Use `{ "includeTools": false }` for a compact summary when full tool descriptions are not needed.

### `platform.tool_summary`

Returns a compact registered tool summary grouped by module for low-token routing.

### `example.echo`

Echoes a provided message. This tool exists to verify plugin registration through the same registry path used by built-in tools.

### `investigation.create`

Creates an investigation session and classifies the initial problem input.

### `investigation.add_evidence`

Adds traceable evidence to an open investigation session.

### `investigation.add_hypothesis`

Adds a confidence-scored hypothesis to an open investigation session.

### `investigation.record_visit`

Records a visited resource during an investigation.

### `investigation.summarize`

Returns the current investigation session state.

### `investigation.close`

Closes an investigation with an evidence-backed conclusion.

### `repository.project_profile`

Returns a compact repository profile for low-token project summaries. It supports `mode` (`compact` or `summary`). Summary mode returns fewer key files, package manifests, entrypoints, extensions, and no largest-file sample so routine summaries can stay closer to the 1k-2k target.

### `repository.overview`

Returns a bounded overview of repository files and extension distribution.

### `repository.scan`

Scans repository files with ignore rules, path validation, and explicit bounds.

### `repository.search_files`

Searches bounded repository files by path, extension, or text preview. It supports `mode` (`full`, `compact`, or `summary`) and `maxMatches`; summary mode caps returned matches at 8 and omits preview text to keep project-summary prompts small.

### `repository.read_file_context`

Reads bounded content for one file inside the repository root.

### `repository.read_file_excerpt`

Reads a compact excerpt for one file, optimized for project summaries and routing. `purpose: "summary"` defaults to `maxBytes: 700`; routing defaults to a larger bounded excerpt, and debug/review excerpts default larger still. Use this before `repository.read_file_context` when only a short product or architecture summary is needed.

### `repository.read_module_context`

Reads bounded file context for files under a module directory.

### `repository.search_symbols`

Searches bounded TypeScript and JavaScript symbols using an AST-backed parser.

### `repository.read_symbol_context`

Reads bounded source context for a specific TypeScript or JavaScript symbol.

### `repository.import_graph`

Builds a bounded TypeScript and JavaScript import graph with relative import resolution.

### `repository.call_graph`

Builds a bounded best-effort TypeScript and JavaScript call graph.

### `repository.index_status`

Returns persistent repository index freshness and changed-file metadata.

### `repository.rebuild_index`

Rebuilds the persistent repository graph index under `.ai-engineering-platform`.

### `repository.cross_repo_search`

Searches multiple bounded repository roots and returns normalized matches.

### `database.schema`

Reads SQLite table and column metadata through a read-only connection.

### `database.relations`

Reads SQLite foreign-key relations through a read-only connection.

### `database.query_preview`

Runs read-only SQLite query previews with explicit row limits.

### `database.supported_dialects`

Lists supported database dialect metadata, execution status, and connection requirements.

### `database.connection_profile`

Validates a database connection profile without opening a network connection or accepting secrets.

### `git.recent_changes`

Reads recent commits from a local git repository using read-only `git log`.

### `git.blame`

Reads line ownership metadata for one file using read-only `git blame`.

### `git.find_commit_by_file`

Reads commit history for one file using read-only `git log -- <file>`.

### `git.impact_hints`

Summarizes file-level change frequency hints from recent read-only git history.

### `planning.create_plan`

Creates a read-only engineering plan with objective, scope, evidence, risk, rollback, and verification strategy.

### `planning.impact_report`

Generates a read-only impact report across files, modules, APIs, database, frontend, backend, cache, queue, workers, and events.

### `planning.approval_gate`

Updates approval state for a generated plan without applying patches.

### `planning.summarize_plan`

Returns a generated engineering plan by ID.

### `patch.create_proposal`

Creates a reviewable patch proposal from an approved plan without modifying files.

### `patch.summarize_proposal`

Returns a patch proposal by ID.

### `patch.rollback_plan`

Returns the rollback plan for a patch proposal.

### `patch.apply_proposal`

Applies an approved patch proposal using deterministic whole-file operations with rollback snapshots.

### `patch.rollback_apply`

Rolls back a patch apply run using captured pre-apply snapshots.

### `verification.run_check`

Runs an allow-listed verification command and records stdout, stderr, exit code, duration, and status.

### `verification.summarize_result`

Returns a recorded verification result by ID.

### `memory.record`

Records a versioned project memory item in `.ai-engineering-platform/memory`.

### `memory.search`

Searches project memory by query, category, and tags.

### `memory.summarize`

Summarizes project memory counts and latest version.

### `memory.refresh`

Rebuilds a project memory snapshot from append-only records.

### `memory.export`

Exports project memory records and summary metadata.

### `performance.cache_summary`

Returns cache entry counts by namespace with total entry count.

### `performance.invalidate_cache`

Invalidates cache entries by namespace and optional key.

### `security.audit_project`

Runs a bounded read-only project audit for prompt-injection markers and common secret markers.

### `security.audit_tool_permissions`

Audits registered tool permissions and reports broad write, command, network, and git risks.

### `plugin.catalog`

Returns marketplace-ready metadata for bundled and known plugins.

### `plugin.validate_manifest`

Validates plugin manifest metadata, compatibility, tool schemas, permissions, timeout, and retry strategy.

### `plugin.resolve_compatibility`

Resolves plugin platform, Node.js, and runtime compatibility from manifest metadata.

### `plugin.install_plan`

Creates a reviewable plugin installation plan without installing or executing plugin code.

### `plugin.remove_plan`

Creates a reviewable plugin removal plan without disabling plugin code.

### `plugin.update_plan`

Creates a reviewable plugin update plan without replacing plugin code.

### `plugin.sdk_metadata`

Returns language plugin and external tool plugin SDK metadata.

### `plugin.inventory`

Returns local plugin state inventory and lifecycle execution history.

### `plugin.enable`

Enables a local plugin manifest in plugin state metadata after validation and compatibility checks.

### `plugin.disable`

Disables a local plugin in plugin state metadata without deleting plugin files.

### `plugin.stage_update`

Stages a local plugin update in plugin state metadata after validation and compatibility checks.

### `plugin.lifecycle_result`

Returns a stored plugin lifecycle execution result by ID.

### `plugin.remote_stage_plan`

Creates a reviewable remote plugin staging plan without downloading, installing, or executing plugin code.

### `plugin.verify_artifact`

Verifies remote plugin artifact content against declared source checksum metadata without network access.

### `plugin.stage_remote`

Stages verified remote plugin metadata under `.ai-engineering-platform` without executing plugin code.

### `plugin.staged_inventory`

Returns remote plugin staging metadata inventory.

### `ai.providers`

Lists provider-neutral AI provider profiles and model metadata.

### `ai.provider_metadata`

Returns metadata for one registered AI provider profile.

### `ai.validate_request`

Validates a normalized AI request against provider and model metadata without calling an AI API.

### `ai.route_request`

Creates a deterministic provider-neutral AI routing plan without calling an AI API.

### `token_budget.estimate`

Estimates approximate token usage for candidate context items before sending them to an AI model.

### `token_budget.compress_context`

Compresses candidate context items to fit an approximate token budget while preserving priority order.

### `token_budget.recommend_strategy`

Recommends a token-aware MCP evidence gathering flow for a repository task. It accepts an optional `questionType` (`project_summary`, `tech_stack_quick_view`, `debugging`, `code_review`, `planning`, or `general`) and returns a target token range, `gateMode`, `defaultReportMode`, `debugReportTriggers`, excerpt `maxBytes`, excerpt call limits, start/evidence/escalation tools, `fallbackPolicy`, and hard `doNotCallTools` guidance. For `project_summary`, startup mode skips `platform.tool_summary` when `repository.project_profile` is available, strict mode excludes broad search, symbol search, architecture docs, source tree summaries, app module excerpts, and full context reads from the preferred route, and the context policy tells clients to use a 1-2 line read-only gate plus compact footer in `normal_user_summary`. The summary fallback policy sets `neverUseBroadFileContext=true` and uses `project_profile -> read_file_excerpt -> answer_with_limited_evidence -> ask_for_debug_detail`.

### `integration.start_session`

Starts an in-memory integration telemetry session for Codex or another MCP client.

### `integration.record_tool_usage`

Records one MCP tool usage event for adoption and token-saving telemetry.

### `integration.readiness`

Checks Codex MCP integration readiness from provided server, tool, and instruction evidence.

### `integration.telemetry_summary`

Summarizes recorded MCP usage telemetry and estimated manual-read tokens avoided.

### `integration.flush_telemetry`

Persists in-memory integration telemetry under `.ai-engineering-platform/integration-telemetry`.

### `integration.workflow_index`

Returns the MCP workflow index for routing task types to tools, modules, and files. Each entry includes a target token range, `gateMode`, `defaultReportMode`, `debugReportTriggers`, excerpt limits, optional `fallbackPolicy`, hard do-not-call tools, context policy, and workflow acceptance criteria so clients can keep summary, tech stack, debug, review, and planning workflows narrow and verifiable. The `project_summary` entry uses `compact_read_only` gate mode with `normal_user_summary` output, short evidence labels, one-line token reporting, `No file changes` impact, `Not required: read-only` approval wording, and no broad file context fallback.

### `integration.auto_telemetry_summary`

Summarizes automatically recorded MCP execution telemetry and estimated token usage. When called with `questionType` or `targetTokens`, it returns `budgetStatus` so clients can report and correct over-budget workflows. For `project_summary`, if `repository.read_file_context` is the largest token source, the recommendation reports a `summary fallback violation` and points clients back to profile/excerpt-only evidence.

### `integration.reset_auto_telemetry`

Clears automatically recorded in-memory MCP execution telemetry.

## Architecture Boundary

Core owns MCP transport integration, execution, logging, errors, security policy foundations, and registry behavior.

Tools are contributed by modules or plugins. Core execution resolves tools through the registry and does not call concrete tool internals directly.

## Current Non-Goals

The current implementation intentionally excludes:

- Cross-language AST parsers beyond TypeScript and JavaScript.
- Persistent or incremental symbol index.
- Semantic compiler-backed call graph.
- Full tsconfig path alias and package export resolution.
- Git writes, branches, merges, commits, resets, and pushes.
- Remote Git hosting integration.
- Database writes.
- External PostgreSQL/MySQL network execution.
- External database drivers and connection pooling.
- Production database secret management.
- Automatic unapproved patch application.
- Partial diff merge patching.
- AST-driven refactor patch application.
- Git commit or push automation.
- Distributed cache.
- Distributed repository index.
- Automatic security auto-fix.
- Dynamic remote plugin download, installation, or execution.
- Remote plugin dependency installation.
- Dynamic import of external plugin code.
- Package manager based plugin installation.
- AI provider API calls.
- Exact model-specific tokenizer execution.
- Distributed telemetry storage.
- Provider SDK coupling inside core.
- Vector database memory.
- Cloud memory synchronization.
- AI provider adapters.
