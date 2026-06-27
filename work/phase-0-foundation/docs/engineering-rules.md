# Engineering Rules

## Development Strategy

The platform must be built through iterative development. A phase cannot start until the previous phase has produced usable, verified, and accepted deliverables.

Phase 0 is documentation only. It must not create implementation code.

## Planning First Workflow

Every change request must follow this workflow:

1. Analyze the problem.
2. Investigate relevant context.
3. Collect evidence.
4. Analyze impact.
5. Create an execution plan.
6. Request approval.
7. Execute only after approval.
8. Verify the result.
9. Produce a final report.

Execution is blocked unless the request has:

- Plan.
- Evidence.
- Impact analysis.
- Approval.
- Verification strategy.
- Rollback strategy.

## Code Quality Rules

All implementation code must be:

- Readable.
- Maintainable.
- Testable.
- Reusable.
- Type safe.
- SOLID.
- DRY.
- KISS.
- Clean Architecture aligned.

Avoid `any` unless the value is at an external boundary and immediately validated or narrowed.

Avoid hardcoded values, duplicated logic, god services, and god modules.

## NestJS Rules

The platform must use NestJS best practices:

- Modules define capability boundaries.
- Services own business logic.
- Providers expose replaceable implementations.
- Interfaces define contracts.
- DTOs define validated inputs and outputs.
- Entities represent persisted or domain records when needed.
- Config is centralized and validated.
- Exceptions use standard platform envelopes.
- Interceptors handle cross-cutting concerns such as execution timing.
- Guards enforce access and permission rules.
- Logger captures structured operational events.
- Utilities remain generic and small.

## Plugin Rules

Every tool must belong to a module or plugin. Core must not know tool internals.

Every tool must register through the registry with:

- Description.
- Input schema.
- Output schema.
- Error schema.
- Permission.
- Timeout.
- Retry strategy.

## Testing Rules

Every module must include:

- Unit tests.
- Integration tests.
- Mock tests for external systems.
- MCP tool contract tests.

Every business rule must have tests. Every MCP tool must have tests.

The target coverage is at least 80%.

## Documentation Rules

Every module must include documentation.

Every public method must include a concise comment explaining its contract when the behavior is not obvious from the name and type signature.

Every MCP tool must document:

- Input.
- Output.
- Errors.
- Example.

## Logging Rules

Every tool execution must log:

- Start.
- Success.
- Failure.
- Execution time.
- Error detail.

Logs must include a correlation ID when available.

## Error Handling Rules

Every handled error must return:

- Message.
- Reason.
- Suggestion.
- Error code.
- Context safe for users and logs.

Unhandled exceptions must be converted into a platform error envelope with enough context to investigate without leaking secrets.

## Security Rules

The platform must not execute arbitrary commands.

Command execution must use an allow list. File access must validate paths and reject path traversal.

The platform must defend against:

- Path traversal.
- Command injection.
- Prompt injection.
- Secret leakage.
- Unsafe plugin behavior.

## Performance Rules

The platform must support large repositories.

It must not read the entire repository for every request.

Repository intelligence must use:

- Cache.
- Index.
- Incremental scan.
- Smart context.
- Lazy loading.

## Reporting Rules

Every completed execution must produce a report containing:

- Summary.
- Files changed.
- Reason.
- Root cause.
- Evidence.
- Risk.
- Verification result.
- Next recommendation.
- Future improvement.
