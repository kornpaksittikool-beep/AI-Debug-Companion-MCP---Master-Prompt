# ADR 0002: NestJS and TypeScript

## Status

Proposed

## Context

The platform must be maintainable, modular, testable, and extensible for years. It must support many capability modules, plugin registration, dependency injection, structured configuration, guards, interceptors, filters, and logging.

The requested implementation language is TypeScript with NestJS.

## Decision

Use TypeScript and NestJS as the primary implementation stack.

NestJS modules will define capability boundaries. Services will hold business logic. Providers will expose replaceable implementations. Interfaces and DTOs will define stable contracts.

## Reasons

- TypeScript provides type safety for tool contracts, schemas, module interfaces, and plugin manifests.
- NestJS provides dependency injection, modules, providers, guards, interceptors, exception filters, and testing utilities.
- NestJS supports long-term modular architecture better than a minimal hand-rolled server structure.
- The framework aligns with the requested engineering rules and project constraints.

## Benefits

- Clear module boundaries.
- Mature dependency injection model.
- Strong testing support.
- Familiar architecture for production TypeScript teams.
- Good fit for plugin-oriented service composition.

## Drawbacks

- More framework concepts than a small custom Node.js server.
- Higher initial scaffolding cost.
- Developers must follow module discipline to avoid god modules and god services.

## Impact

- Phase 1 must create a strict TypeScript NestJS baseline.
- Every capability must live inside a module.
- Core services must be injected through interfaces where replacement is expected.
- Public tool and plugin contracts must be typed and validated.
