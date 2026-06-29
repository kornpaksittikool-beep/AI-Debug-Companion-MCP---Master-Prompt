import { ErrorMapperService } from '../../src/core/errors/error-mapper.service.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { NO_RETRY } from '../../src/core/registry/interfaces/retry-strategy.interface.js';
import type { ToolDefinition } from '../../src/core/registry/interfaces/tool-definition.interface.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';
import { NO_PERMISSION } from '../../src/core/security/permission.interface.js';
import { STANDARD_ERROR_SCHEMA } from '../../src/core/errors/error-envelope.interface.js';
import type { PlatformLoggerService } from '../../src/core/logging/platform-logger.service.js';
import { ExecutionTelemetryService } from '../../src/core/telemetry/execution-telemetry.service.js';

const definition: ToolDefinition = {
  name: 'test.echo',
  version: '1.0.0',
  description: 'Echo tool.',
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

const logger: Pick<PlatformLoggerService, 'logToolStart' | 'logToolSuccess' | 'logToolFailure'> = {
  logToolStart: jest.fn(),
  logToolSuccess: jest.fn(),
  logToolFailure: jest.fn(),
};

describe('McpExecutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes a registered tool and logs success', async () => {
    const registry = new ToolRegistryService();
    registry.register(definition, {
      execute: (input) => Promise.resolve(input),
    });
    const service = new McpExecutionService(
      registry,
      logger as PlatformLoggerService,
      new ErrorMapperService(),
      new ExecutionTelemetryService(),
    );

    const result = await service.execute({
      toolName: 'test.echo',
      input: { message: 'hello' },
      correlationId: 'corr_123',
    });

    expect(result).toEqual({
      ok: true,
      output: { message: 'hello' },
      correlationId: 'corr_123',
    });
    expect(logger.logToolStart).toHaveBeenCalled();
    expect(logger.logToolSuccess).toHaveBeenCalled();
  });

  it('normalizes missing tool errors and logs failure', async () => {
    const telemetry = new ExecutionTelemetryService();
    const service = new McpExecutionService(
      new ToolRegistryService(),
      logger as PlatformLoggerService,
      new ErrorMapperService(),
      telemetry,
    );

    const result = await service.execute({
      toolName: 'missing.tool',
      input: {},
      correlationId: 'corr_123',
    });

    expect(result.ok).toBe(false);
    expect(logger.logToolFailure).toHaveBeenCalled();
    expect(telemetry.summary()).toMatchObject({
      toolCalls: 1,
      failedCalls: 1,
    });
  });

  it('records automatic token telemetry for successful tool calls', async () => {
    const registry = new ToolRegistryService();
    const telemetry = new ExecutionTelemetryService();
    registry.register(definition, {
      execute: (input) => {
        const message = typeof input.message === 'string' ? input.message : '';
        return Promise.resolve({ received: message });
      },
    });
    const service = new McpExecutionService(
      registry,
      logger as PlatformLoggerService,
      new ErrorMapperService(),
      telemetry,
    );

    await service.execute({
      toolName: 'test.echo',
      input: { message: 'hello' },
      correlationId: 'corr_123',
    });

    const summary = telemetry.summary();
    expect(summary.toolCalls).toBe(1);
    expect(summary.successfulCalls).toBe(1);
    expect(summary.estimatedTotalTokens).toBeGreaterThan(0);
    expect(summary.topTools[0]).toMatchObject({ toolName: 'test.echo', calls: 1 });
  });

  it('reports automatic telemetry as over budget when a target is provided', () => {
    const telemetry = new ExecutionTelemetryService();
    telemetry.recordSuccess({
      correlationId: 'corr_big',
      toolName: 'repository.read_file_excerpt',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      executionTimeMs: 1,
      input: {},
      output: { content: 'x'.repeat(80) },
    });

    const summary = telemetry.summary({ targetTokens: 5 });

    expect(summary.budgetStatus).toMatchObject({
      status: 'over_budget',
      targetTokens: 5,
    });
    expect(summary.budgetStatus?.overByTokens).toBeGreaterThan(0);
  });

  it('warns when project summary strict mode is violated by broad search', () => {
    const telemetry = new ExecutionTelemetryService();
    telemetry.recordSuccess({
      correlationId: 'corr_search',
      toolName: 'repository.search_files',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      executionTimeMs: 1,
      input: { query: 'src' },
      output: { matches: 'x'.repeat(120) },
    });

    const summary = telemetry.summary({ questionType: 'project_summary', targetTokens: 5 });

    expect(summary.budgetStatus?.recommendation).toContain('Summary strict mode was likely violated');
    expect(summary.budgetStatus?.recommendation).toContain('repository.search_files');
  });

  it('warns when project summary startup mode is violated by tool summary', () => {
    const telemetry = new ExecutionTelemetryService();
    telemetry.recordSuccess({
      correlationId: 'corr_tools',
      toolName: 'platform.tool_summary',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      executionTimeMs: 1,
      input: {},
      output: { tools: 'x'.repeat(120) },
    });

    const summary = telemetry.summary({ questionType: 'project_summary', targetTokens: 5 });

    expect(summary.budgetStatus?.recommendation).toContain('Summary strict mode was likely violated');
    expect(summary.budgetStatus?.recommendation).toContain('platform.tool_summary');
  });

  it('reports a summary fallback violation when broad file context dominates', () => {
    const telemetry = new ExecutionTelemetryService();
    telemetry.recordSuccess({
      correlationId: 'corr_context',
      toolName: 'repository.read_file_context',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      executionTimeMs: 1,
      input: { filePath: 'src/app.module.ts' },
      output: { content: 'x'.repeat(120) },
    });

    const summary = telemetry.summary({ questionType: 'project_summary', targetTokens: 5 });

    expect(summary.budgetStatus?.recommendation).toContain('Summary fallback violation');
    expect(summary.budgetStatus?.recommendation).toContain('repository.project_profile');
    expect(summary.budgetStatus?.recommendation).toContain('repository.read_file_excerpt only');
  });
});
