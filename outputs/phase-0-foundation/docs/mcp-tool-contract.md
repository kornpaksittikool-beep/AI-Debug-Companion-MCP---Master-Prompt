# MCP Tool Contract

## Purpose

This document defines the required contract for every MCP tool exposed by the platform. A tool that does not satisfy this contract cannot be registered.

## Tool Definition

Every tool must define:

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Stable machine-readable tool name. |
| `version` | Yes | Semantic version of the tool contract. |
| `description` | Yes | Human-readable purpose and expected usage. |
| `module` | Yes | Owning module or plugin. |
| `inputSchema` | Yes | Validated input schema. |
| `outputSchema` | Yes | Validated output schema. |
| `errorSchema` | Yes | Standard error envelope schema. |
| `permissions` | Yes | Required file, command, git, database, network, or memory permissions. |
| `timeoutMs` | Yes | Maximum execution time. |
| `retryStrategy` | Yes | Retry behavior for transient failures. |
| `sideEffects` | Yes | Declares whether the tool is read-only or mutating. |
| `examples` | Yes | At least one valid input and output example. |

## Required Runtime Behavior

Every tool execution must:

1. Validate input before execution.
2. Check permissions before execution.
3. Log start with correlation ID.
4. Execute through the owning module service.
5. Validate output before returning.
6. Convert errors to the standard error envelope.
7. Log success or failure with execution time.

## Standard Error Envelope

```json
{
  "code": "TOOL_ERROR_CODE",
  "message": "Short user-facing message.",
  "reason": "Why the error happened.",
  "suggestion": "What the caller should do next.",
  "correlationId": "optional-correlation-id",
  "details": {
    "safeContext": "Additional non-secret context."
  }
}
```

## Permission Model

Tool permissions must be explicit:

```json
{
  "fileSystem": {
    "read": true,
    "write": false,
    "allowedRoots": ["workspace"]
  },
  "commands": {
    "execute": false,
    "allowList": []
  },
  "git": {
    "read": false,
    "write": false
  },
  "database": {
    "read": false,
    "write": false
  },
  "network": {
    "enabled": false
  }
}
```

## Retry Strategy

Retry strategy must be explicit even when disabled:

```json
{
  "enabled": false,
  "maxAttempts": 1,
  "backoffMs": 0,
  "retryableErrors": []
}
```

## Read-Only Tool Example

```json
{
  "name": "platform.health",
  "version": "1.0.0",
  "description": "Returns platform health and readiness information.",
  "module": "health",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "required": ["status", "timestamp"],
    "properties": {
      "status": {
        "type": "string",
        "enum": ["ok", "degraded", "unavailable"]
      },
      "timestamp": {
        "type": "string",
        "format": "date-time"
      }
    }
  },
  "errorSchema": {
    "$ref": "StandardErrorEnvelope"
  },
  "permissions": {
    "fileSystem": {
      "read": false,
      "write": false,
      "allowedRoots": []
    },
    "commands": {
      "execute": false,
      "allowList": []
    },
    "git": {
      "read": false,
      "write": false
    },
    "database": {
      "read": false,
      "write": false
    },
    "network": {
      "enabled": false
    }
  },
  "timeoutMs": 1000,
  "retryStrategy": {
    "enabled": false,
    "maxAttempts": 1,
    "backoffMs": 0,
    "retryableErrors": []
  },
  "sideEffects": "none"
}
```

## Registration Rule

Tools must be registered through the tool registry. Core server code must not import or instantiate individual tool handlers directly.
