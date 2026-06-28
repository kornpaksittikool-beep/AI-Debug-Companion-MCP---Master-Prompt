import { Module } from '@nestjs/common';
import { ErrorMapperService } from './errors/error-mapper.service.js';
import { PlatformLoggerService } from './logging/platform-logger.service.js';
import { McpExecutionService } from './mcp/services/mcp-execution.service.js';
import { McpStdioServerService } from './mcp/services/mcp-stdio-server.service.js';
import { ToolRegistryService } from './registry/services/tool-registry.service.js';
import { CommandPolicyService } from './security/command-policy.service.js';
import { PathPolicyService } from './security/path-policy.service.js';
import { ExecutionTelemetryService } from './telemetry/execution-telemetry.service.js';

@Module({
  providers: [
    ToolRegistryService,
    PlatformLoggerService,
    ErrorMapperService,
    McpExecutionService,
    McpStdioServerService,
    PathPolicyService,
    CommandPolicyService,
    ExecutionTelemetryService,
  ],
  exports: [
    ToolRegistryService,
    PlatformLoggerService,
    ErrorMapperService,
    McpExecutionService,
    PathPolicyService,
    CommandPolicyService,
    ExecutionTelemetryService,
  ],
})
export class CoreModule {}
