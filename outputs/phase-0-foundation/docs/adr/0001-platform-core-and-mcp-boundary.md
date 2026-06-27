# ADR 0001: Platform Core and MCP Boundary

## Status

Proposed

## Context

The product is an AI Engineering Platform. MCP is the protocol used by AI clients to interact with the platform, but the platform must not be limited to one AI client, one model, or one MCP transport implementation.

The system must collect evidence from repositories, databases, git history, logs, and project memory. AI clients use that evidence for analysis.

## Decision

Separate the platform core from the MCP transport boundary.

The core will expose internal contracts for tool registration, execution, permissions, logging, errors, and evidence handling. MCP adapters will translate protocol requests into core execution requests and translate core responses back into MCP responses.

## Reasons

- The platform can support multiple AI clients without changing business logic.
- The core can be tested without protocol-specific infrastructure.
- Future transports or protocol changes can be added through adapters.
- Evidence collection remains a platform capability, not an AI-client-specific implementation.

## Benefits

- Strong separation of concerns.
- Easier testing and mocking.
- Lower risk when MCP protocol details change.
- Better long-term support for non-MCP integrations if needed.

## Drawbacks

- More interfaces and adapter code are required.
- Initial implementation is slower than directly implementing tools inside an MCP server.
- Contract design must be disciplined to avoid leaky abstractions.

## Impact

- Phase 1 must include a core execution boundary.
- Tool handlers must not depend directly on the MCP transport.
- Tests must cover core execution separately from transport behavior.
- Documentation must distinguish platform concepts from MCP protocol concepts.
