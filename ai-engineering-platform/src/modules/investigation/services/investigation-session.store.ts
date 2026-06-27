import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type { InvestigationSession } from '../interfaces/investigation-session.interface.js';

@Injectable()
export class InvestigationSessionStore {
  private readonly sessions = new Map<string, InvestigationSession>();

  save(session: InvestigationSession): InvestigationSession {
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): InvestigationSession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new PlatformError({
        code: 'INVESTIGATION_SESSION_NOT_FOUND',
        message: `Investigation session "${sessionId}" was not found.`,
        reason: 'The requested investigation session does not exist in the current in-memory store.',
        suggestion: 'Create a new investigation session or verify the session ID.',
      });
    }

    return session;
  }
}
