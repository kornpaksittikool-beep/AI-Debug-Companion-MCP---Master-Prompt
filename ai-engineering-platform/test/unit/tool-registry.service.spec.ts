import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { STANDARD_ERROR_SCHEMA } from '../../src/core/errors/error-envelope.interface.js';
import { PlatformError } from '../../src/core/errors/platform-error.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import type { ToolHandler } from '../../src/core/registry/interfaces/tool-handler.interface.js';

const definition: ToolDefinition = {
  name: 'test.tool',
  version: '1.0.0',
  description: 'Test tool.',
  module: 'test',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  errorSchema: STANDARD_ERROR_SCHEMA,
  permissions: NO_PERMISSION,
  timeoutMs: 1000,
  retryStrategy: NO_RETRY,
  sideEffects: 'none',
  examples: [{ input: {}, output: {} }],
};

const handler: ToolHandler = {
  execute() {
    return Promise.resolve({});
  },
};

describe('ToolRegistryService', () => {
  it('registers and resolves a tool', () => {
    const registry = new ToolRegistryService();

    registry.register(definition, handler);

    expect(registry.get('test.tool').definition).toBe(definition);
    expect(registry.list()).toHaveLength(1);
  });

  it('rejects duplicate tool names', () => {
    const registry = new ToolRegistryService();
    registry.register(definition, handler);

    expect(() => registry.register(definition, handler)).toThrow(PlatformError);
  });

  it('rejects incomplete definitions', () => {
    const registry = new ToolRegistryService();
    const invalidDefinition: ToolDefinition = {
      ...definition,
      name: '',
    };

    expect(() => registry.register(invalidDefinition, handler)).toThrow(PlatformError);
  });
});
