import { Injectable } from '@nestjs/common';

export interface ToolLogEvent {
  readonly toolName: string;
  readonly correlationId: string;
  readonly executionTimeMs?: number;
  readonly error?: unknown;
}

@Injectable()
export class PlatformLoggerService {
  logToolStart(event: ToolLogEvent): void {
    this.write('tool.start', event);
  }

  logToolSuccess(event: ToolLogEvent): void {
    this.write('tool.success', event);
  }

  logToolFailure(event: ToolLogEvent): void {
    this.write('tool.failed', {
      ...event,
      error: event.error instanceof Error ? event.error.message : event.error,
    });
  }

  private write(event: string, payload: ToolLogEvent | Record<string, unknown>): void {
    const logRecord = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    process.stderr.write(`${JSON.stringify(logRecord)}\n`);
  }
}
