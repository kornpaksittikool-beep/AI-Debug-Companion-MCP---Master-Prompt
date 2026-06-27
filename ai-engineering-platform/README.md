# AI Engineering Platform

AI Engineering Platform is a production-oriented MCP foundation for evidence-driven software engineering workflows.

Phase 4 provides the Core MCP Framework, Investigation Engine, bounded Repository Intelligence, and read-only SQLite Database Intelligence. It does not include git intelligence, planning engine, patch engine, verification engine, or project memory.

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
- Read-only SQLite schema discovery.
- Read-only SQLite foreign-key relation discovery.
- Read-only SQLite query preview with row limits.
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

### `database.schema`

Reads SQLite table and column metadata through a read-only connection.

### `database.relations`

Reads SQLite foreign-key relations through a read-only connection.

### `database.query_preview`

Runs read-only SQLite query previews with explicit row limits.

## Architecture Boundary

Core owns MCP transport integration, execution, logging, errors, security policy foundations, and registry behavior.

Tools are contributed by modules or plugins. Core execution resolves tools through the registry and does not call concrete tool internals directly.

## Current Non-Goals

The current implementation intentionally excludes:

- AST parser.
- Full symbol index.
- Full call graph.
- Full import graph.
- Git history reader.
- Database writes.
- Production database secret management.
- Postgres/MySQL adapters.
- Database connector.
- Patch application.
- Planning engine.
- Project memory.
- AI provider adapters.
- Plugin marketplace installation workflow.
