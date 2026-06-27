# AI Engineering Platform

AI Engineering Platform is a production-oriented MCP foundation for evidence-driven software engineering workflows.

Phase 14 provides the Core MCP Framework, Investigation Engine, bounded Repository Intelligence, TypeScript/JavaScript symbol intelligence, read-only SQLite Database Intelligence, PostgreSQL/MySQL connection profile validation, read-only Git Intelligence, Planning and Impact Engine, patch proposal workflow, rollback planning, allow-listed verification execution, versioned Project Memory, cache foundation, cache invalidation, read-only security audits, plugin marketplace readiness, semantic plugin compatibility resolution, approved local plugin state loading, and provider-neutral AI routing contracts. It does not include automatic patch application, dynamic remote plugin installation, external plugin code execution, external database network execution, AI API execution, distributed cache, vector memory, cloud sync, or remote Git hosting integration.

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
- Example `example.echo` plugin tool.
- Investigation sessions.
- Evidence registry inside each investigation session.
- Hypothesis tracking.
- Visited resource tracking.
- Evidence-backed investigation closure.
- Safe bounded repository overview.
- Safe bounded repository scan.
- File search by path, extension, and text preview.
- Bounded file context reads.
- Bounded module context reads.
- TypeScript and JavaScript AST-backed symbol search.
- Bounded symbol context reads for classes, functions, methods, interfaces, types, enums, and variables.
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
- Stored plugin lifecycle execution results with rollback and verification plans.
- Provider-neutral AI provider profiles for OpenAI, Claude, Gemini, DeepSeek, Ollama, OpenRouter, and local LLMs.
- AI request validation against provider and model metadata.
- Deterministic AI routing plans without calling external AI APIs.
- Jest unit and integration test baseline.

## Registered Tools

### `platform.health`

Returns platform health and readiness information.

### `platform.metadata`

Returns platform metadata and registered tool names.

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

### `repository.overview`

Returns a bounded overview of repository files and extension distribution.

### `repository.scan`

Scans repository files with ignore rules, path validation, and explicit bounds.

### `repository.search_files`

Searches bounded repository files by path, extension, or text preview.

### `repository.read_file_context`

Reads bounded content for one file inside the repository root.

### `repository.read_module_context`

Reads bounded file context for files under a module directory.

### `repository.search_symbols`

Searches bounded TypeScript and JavaScript symbols using an AST-backed parser.

### `repository.read_symbol_context`

Reads bounded source context for a specific TypeScript or JavaScript symbol.

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

### `ai.providers`

Lists provider-neutral AI provider profiles and model metadata.

### `ai.provider_metadata`

Returns metadata for one registered AI provider profile.

### `ai.validate_request`

Validates a normalized AI request against provider and model metadata without calling an AI API.

### `ai.route_request`

Creates a deterministic provider-neutral AI routing plan without calling an AI API.

## Architecture Boundary

Core owns MCP transport integration, execution, logging, errors, security policy foundations, and registry behavior.

Tools are contributed by modules or plugins. Core execution resolves tools through the registry and does not call concrete tool internals directly.

## Current Non-Goals

The current implementation intentionally excludes:

- Cross-language AST parsers beyond TypeScript and JavaScript.
- Persistent or incremental symbol index.
- Full call graph.
- Full import graph.
- Git writes, branches, merges, commits, resets, and pushes.
- Remote Git hosting integration.
- Database writes.
- External PostgreSQL/MySQL network execution.
- External database drivers and connection pooling.
- Production database secret management.
- Automatic patch application.
- Git commit or push automation.
- Distributed cache.
- Full persistent incremental index.
- Automatic security auto-fix.
- Dynamic remote plugin download or execution.
- Dynamic import of external plugin code.
- Package manager based plugin installation.
- AI provider API calls.
- Provider SDK coupling inside core.
- Vector database memory.
- Cloud memory synchronization.
- AI provider adapters.
