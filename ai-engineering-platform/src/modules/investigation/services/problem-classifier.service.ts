import { Injectable } from '@nestjs/common';
import type { ProblemType } from '../interfaces/investigation-session.interface.js';

@Injectable()
export class ProblemClassifierService {
  classify(input: string): ProblemType {
    const normalized = input.toLowerCase();

    if (this.looksLikeStackTrace(input)) {
      return 'stack_trace';
    }

    if (normalized.includes('error') || normalized.includes('exception') || normalized.includes('failed')) {
      return 'error';
    }

    if (normalized.includes('trace_id') || normalized.includes('timestamp') || normalized.includes('warn')) {
      return 'log';
    }

    if (normalized.includes('screenshot') || normalized.includes('image attached')) {
      return 'screenshot';
    }

    if (normalized.includes('bug') || normalized.includes('issue')) {
      return 'issue';
    }

    if (normalized.includes('feature') || normalized.includes('requirement') || normalized.includes('request')) {
      return 'feature_request';
    }

    return 'unknown';
  }

  private looksLikeStackTrace(input: string): boolean {
    return /\bat\s+\S+\s+\(.+:\d+:\d+\)/.test(input) || input.includes('Traceback (most recent call last)');
  }
}
