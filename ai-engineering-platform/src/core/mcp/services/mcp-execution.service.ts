import { Injectable } from '@nestjs/common';
import { ErrorMapperService } from '../../errors/error-mapper.service.js';
import { PlatformLoggerService } from '../../logging/platform-logger.service.js';
import { ToolRegistryService } from '../../registry/services/tool-registry.service.js';
import { createCorrelationId } from '../../../shared/utils/correlation-id.js';
import type { McpToolExecutionRequest } from '../interfaces/mcp-request.interface.js';
import type { McpToolExecutionResponse } from '../interfaces/mcp-response.interface.js';

@Injectable()
export class McpExecutionService {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly logger: PlatformLoggerService,
    private readonly errorMapper: ErrorMapperService,
  ) {}

  async execute(request: McpToolExecutionRequest): Promise<McpToolExecutionResponse> {
    const correlationId = request.correlationId ?? createCorrelationId();
    const startedAt = new Date();
    const startedMs = performance.now();

    this.logger.logToolStart({ toolName: request.toolName, correlationId });

    try {
      const registeredTool = this.registry.get(request.toolName);
      const output = await registeredTool.handler.execute(request.input, {
        correlationId,
        startedAt,
      });
      const executionTimeMs = Math.round(performance.now() - startedMs);
      this.logger.logToolSuccess({ toolName: request.toolName, correlationId, executionTimeMs });

      return {
        ok: true,
        output,
        correlationId,
      };
    } catch (error) {
      const executionTimeMs = Math.round(performance.now() - startedMs);
      this.logger.logToolFailure({
        toolName: request.toolName,
        correlationId,
        executionTimeMs,
        error,
      });

      return {
        ok: false,
        error: this.errorMapper.toEnvelope(error, correlationId),
        correlationId,
      };
    }
  }
}
