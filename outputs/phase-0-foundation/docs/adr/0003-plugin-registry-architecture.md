# ADR 0003: Plugin Registry Architecture

## Status

Proposed

## Context

The platform must allow new MCP tools to be added without changing core server logic. Tools must belong to modules or plugins, and every tool must register through a registry. Core must not know tool implementation details.

Future requirements include plugin marketplace readiness, language plugins, external tool plugins, and install/update/remove workflows.

## Decision

Use a registry-based plugin architecture.

Core will provide a tool registry contract. Modules and plugins will contribute tool definitions and handlers. The registry will validate tool metadata before registration and resolve handlers at execution time.

## Reasons

- New tools can be added without modifying core server code.
- Tool metadata can be validated consistently.
- Permissions, schemas, timeout, retry strategy, and side effects can be enforced centrally.
- Marketplace readiness requires tools to be discoverable and self-describing.

## Benefits

- Loose coupling between core and tools.
- High cohesion inside capability modules.
- Clear tool lifecycle.
- Easier testing of tool contracts.
- Supports future plugin installation and version compatibility checks.

## Drawbacks

- Registry validation and plugin loading add complexity.
- Tool authors must follow strict contracts.
- Runtime discovery can make debugging harder unless logging and diagnostics are strong.

## Impact

- Phase 1 must implement the registry before adding real intelligence tools.
- Built-in tools must register through the same mechanism as plugins.
- Tool contract tests are mandatory.
- Core server code must not import concrete tool handlers directly.
