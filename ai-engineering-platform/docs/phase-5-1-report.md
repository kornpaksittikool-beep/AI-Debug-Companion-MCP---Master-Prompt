# Phase 5.1 Completion Report: Backlog Cleanup Before Planning Engine

## Summary

Phase 5.1 closes the remaining Repository Intelligence and Git Intelligence backlog before Phase 6. It adds bounded TypeScript/JavaScript symbol intelligence, symbol-level context reads, and read-only git impact hints derived from recent file history.

## Delivered Features

| Feature | Status | Evidence |
| --- | --- | --- |
| TypeScript/JavaScript symbol parser | Completed | `src/modules/repository-intelligence/services/typescript-symbol-parser.service.ts` uses the TypeScript compiler API. |
| Symbol index service | Completed | `src/modules/repository-intelligence/services/repository-symbol.service.ts` builds bounded per-request symbol results from repository scans. |
| Symbol search tool | Completed | `repository.search_symbols` is registered through `RepositoryIntelligenceModule`. |
| Symbol context tool | Completed | `repository.read_symbol_context` returns bounded source context for a matched symbol. |
| Git impact hints | Completed | `git.impact_hints` summarizes recent file change frequency through read-only `git log --name-only`. |
| Unit tests | Completed | Symbol service, repository tools, git service, and git tools are covered. |
| Integration tests | Completed | Repository and Git module tests verify registry and MCP execution paths. |

## Architecture Decisions

### Use TypeScript Compiler API for TS/JS Symbols

- Reason: symbol extraction must be syntax-aware and maintainable.
- Benefits: avoids fragile regex parsing, supports TypeScript and JavaScript source files, and keeps future parser plugins possible.
- Drawbacks: current parser is intentionally bounded and does not build a persistent project-wide graph.
- Impact: Phase 6 can request targeted symbol evidence without reading whole files.

### Keep Symbol Index Bounded and Per Request

- Reason: persistent indexing and incremental invalidation belong in the later performance phase.
- Benefits: avoids premature cache complexity while delivering usable symbol intelligence now.
- Drawbacks: repeated symbol searches rescan the bounded file window.
- Impact: Phase 9 can replace or augment this with an incremental cache without changing MCP tool contracts.

### Use Git File Frequency as a Hint, Not a Final Impact Report

- Reason: Phase 6 owns formal impact analysis.
- Benefits: provides evidence about recent change hotspots without overstepping into planning logic.
- Drawbacks: the output is heuristic and does not understand call graphs or runtime dependencies.
- Impact: Phase 6 can consume these hints as one evidence source alongside repository, database, and investigation data.

## Tool Contracts

### `repository.search_symbols`

- Input: `rootPath`, optional `query`, optional `kind`, bounded scan options.
- Output: matching symbols with kind, file path, line range, export status, and signature.
- Error: standardized platform error envelope.
- Permission: filesystem read only.
- Timeout: 5000 ms.
- Retry: none.

### `repository.read_symbol_context`

- Input: `rootPath`, `symbolName`, optional `filePath`, optional `kind`, optional `maxBytes`, bounded scan options.
- Output: matched symbol metadata and bounded source context.
- Error: standardized platform error envelope.
- Permission: filesystem read only.
- Timeout: 5000 ms.
- Retry: none.

### `git.impact_hints`

- Input: `rootPath`, optional `maxCommits`.
- Output: file-level change counts, last commit metadata, recent subjects, and heuristic risk levels.
- Error: standardized platform error envelope.
- Permission: filesystem read, git read, read-only command execution.
- Timeout: 5000 ms.
- Retry: none.

## Verification Result

Commands executed before this report was written:

```bash
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd test:integration
pnpm.cmd test:cov
```

Results:

- Build: passed.
- Lint: passed.
- Unit and module tests: 18 suites passed, 57 tests passed.
- Integration tests: 5 suites passed, 11 tests passed.
- Coverage: 93.82% statements, 93.14% lines.

## Risks and Limitations

- Symbol extraction currently supports TypeScript, TSX, JavaScript, and JSX only.
- Symbol intelligence is bounded and per request; persistent incremental indexing remains in Phase 9.
- Symbol context is syntax-range based and does not include dependency expansion yet.
- Git impact hints are heuristics based on recent file history, not a complete impact report.
- Formal planning and impact reports remain Phase 6 work.
