# AI Engineering Platform Architecture

## Architecture Goals

The platform must help AI clients behave like evidence-driven senior engineers. MCP is the communication protocol, not the product boundary. The core product is an extensible engineering intelligence platform that can gather evidence, build plans, assess impact, request approval, execute safe changes, verify results, and produce traceable reports.

The core must remain independent from OpenAI, Codex, Claude, DeepSeek, Gemini, Ollama, OpenRouter, local LLMs, and any specific IDE or AI client.

## Core Responsibilities

The platform is responsible for finding truth from project systems:

- Repository structure, files, symbols, imports, routes, and call flows.
- Database schema, relations, and read-only query previews.
- Git history, blame, and recent changes.
- Logs, stack traces, build output, and test output.
- Project memory for architecture, business flows, naming conventions, known issues, and decisions.

AI clients are responsible for analysis and reasoning over the evidence returned by the platform.

## Architectural Principles

- Evidence first: every conclusion must reference traceable evidence.
- Planning first: no patch execution can occur without evidence, impact analysis, approval, verification strategy, and rollback strategy.
- AI independence: no core workflow can depend on a single model provider.
- Plugin first: tools must be installed, removed, or updated without changing core server logic.
- Loose coupling: core coordinates tools through contracts and registries.
- High cohesion: each module owns a clear capability.
- Type safety: avoid untyped contracts and avoid `any` except at external boundaries with validation.
- Security by default: validate paths, restrict command execution, and defend against prompt injection.
- Scale-aware design: avoid full repository scans on every request.

## Exact Folder Structure

The intended repository structure is:

```text
ai-engineering-platform/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  tsconfig.build.json
  nest-cli.json
  eslint.config.mjs
  prettier.config.cjs
  jest.config.ts
  README.md
  ROADMAP.md
  TODO.md
  docs/
    architecture.md
    engineering-rules.md
    mcp-tool-contract.md
    phase-1-deliverables.md
    adr/
      0001-platform-core-and-mcp-boundary.md
      0002-nestjs-and-typescript.md
      0003-plugin-registry-architecture.md
  src/
    main.ts
    app.module.ts
    config/
      configuration.ts
      validation.schema.ts
    core/
      core.module.ts
      mcp/
        mcp.module.ts
        interfaces/
          mcp-transport.interface.ts
          mcp-request.interface.ts
          mcp-response.interface.ts
        services/
          mcp-server.service.ts
      registry/
        registry.module.ts
        interfaces/
          tool-definition.interface.ts
          tool-handler.interface.ts
          tool-registry.interface.ts
        services/
          tool-registry.service.ts
      errors/
        platform-error.ts
        error-envelope.interface.ts
        exception.filter.ts
      logging/
        logging.module.ts
        platform-logger.service.ts
        execution-timer.interceptor.ts
      security/
        security.module.ts
        path-policy.service.ts
        command-policy.service.ts
        permission.interface.ts
    modules/
      health/
        health.module.ts
        tools/
          health.tool.ts
          platform-metadata.tool.ts
        services/
          health.service.ts
        dto/
          health-output.dto.ts
      investigation/
        investigation.module.ts
        interfaces/
        services/
        dto/
        tools/
      repository-intelligence/
        repository-intelligence.module.ts
        interfaces/
        services/
        dto/
        tools/
      database-intelligence/
        database-intelligence.module.ts
        interfaces/
        services/
        dto/
        tools/
      git-intelligence/
        git-intelligence.module.ts
        interfaces/
        services/
        dto/
        tools/
      planning/
        planning.module.ts
        interfaces/
        services/
        dto/
        tools/
      patch/
        patch.module.ts
        interfaces/
        services/
        dto/
        tools/
      verification/
        verification.module.ts
        interfaces/
        services/
        dto/
        tools/
      project-memory/
        project-memory.module.ts
        interfaces/
        services/
        dto/
        tools/
    plugins/
      plugin-api/
        plugin.interface.ts
        plugin-manifest.interface.ts
        plugin-loader.interface.ts
      built-in/
        README.md
    shared/
      dto/
      entities/
      interfaces/
      utils/
      constants/
    test/
      unit/
      integration/
      fixtures/
      mocks/
```

Phase 0 must not create this implementation structure as source code. It only defines the target structure.

## Module Boundaries

### Core

Core owns transport integration, tool registration, logging, errors, configuration, and security policies. Core must not know the implementation details of any tool.

### Modules

Each module owns one capability area. Modules can expose MCP tools through the registry. Modules must depend on core contracts rather than concrete implementations from other feature modules unless a documented interface exists.

### Plugins

Plugins provide tool definitions and handlers. A plugin must register through the registry and must declare permissions, schemas, timeouts, and retry behavior. Core can load plugins but cannot call plugin internals directly.

## Request Lifecycle

1. AI client sends an MCP request.
2. MCP transport adapter normalizes the request.
3. Tool registry resolves the requested tool.
4. Security policies validate permissions, paths, and command access.
5. Logger records start time and correlation ID.
6. Tool handler executes through its module service.
7. Errors are converted to a standard error envelope.
8. Logger records success or failure with execution time.
9. MCP response is returned to the client.

## Investigation Lifecycle

1. Create investigation session.
2. Classify input type.
3. Collect evidence through relevant tools.
4. Record hypotheses with confidence levels.
5. Track visited files, APIs, tables, logs, and commands.
6. Generate impact and planning inputs.
7. Produce a conclusion only when evidence is sufficient.
8. Report missing context when evidence is insufficient.

## Security Model

The platform must enforce:

- Path validation for all file access.
- Workspace root boundaries.
- Path traversal protection.
- Command allow list for verification tools.
- No direct arbitrary command execution.
- Explicit permission declaration per tool.
- Prompt injection defense by separating evidence from instructions.
- Read-only mode for database preview tools unless a future approved write workflow exists.

## Performance Model

The platform must avoid reading entire repositories repeatedly. Repository intelligence must support:

- Ignore rules.
- Lazy file reads.
- Incremental indexing.
- Cache invalidation.
- Symbol-level context retrieval.
- Project, module, file, function, business, and runtime context scopes.

## Testing Model

Every module must have:

- Unit tests for business logic.
- Integration tests for module wiring and tool registration.
- Mock tests for external systems.
- MCP tool contract tests.

The coverage target is at least 80%.
