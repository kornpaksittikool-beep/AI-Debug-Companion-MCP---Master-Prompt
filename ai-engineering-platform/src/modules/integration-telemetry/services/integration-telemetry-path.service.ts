import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { RepositorySafetyService } from '../../repository-intelligence/services/repository-safety.service.js';

export interface IntegrationTelemetryPaths {
  readonly rootPath: string;
  readonly telemetryDir: string;
  readonly sessionsPath: string;
  readonly recordsPath: string;
}

@Injectable()
export class IntegrationTelemetryPathService {
  constructor(private readonly safety: RepositorySafetyService) {}

  resolve(rootPath: string): IntegrationTelemetryPaths {
    const resolvedRoot = this.safety.resolveRoot(rootPath);
    const telemetryDir = this.safety.resolveInsideRoot(
      resolvedRoot,
      path.join('.ai-engineering-platform', 'integration-telemetry'),
    );

    return {
      rootPath: resolvedRoot,
      telemetryDir,
      sessionsPath: this.safety.resolveInsideRoot(telemetryDir, 'sessions.jsonl'),
      recordsPath: this.safety.resolveInsideRoot(telemetryDir, 'tool-usage.jsonl'),
    };
  }
}
