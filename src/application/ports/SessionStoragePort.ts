import { SessionMetadata } from '../../domain/entities/SessionEntity';

export interface SessionStoragePort {
  /**
   * Create a new session
   */
  createSession(metadata: SessionMetadata): Promise<SessionMetadata>;

  /**
   * Find an active session by token
   */
  findSessionByToken(token: string): Promise<SessionMetadata | null>;

  /**
   * Find all active sessions for a user
   */
  findSessionsByUserId(userId: string): Promise<SessionMetadata[]>;

  /**
   * Invalidate a specific session
   */
  invalidateSession(token: string): Promise<boolean>;

  /**
   * Invalidate all sessions for a user
   */
  invalidateAllUserSessions(userId: string): Promise<number>;

  /**
   * Delete expired sessions (cleanup)
   */
  deleteExpiredSessions(): Promise<number>;

  /**
   * Validate session by token (IP validation removed)
   */
  validateSession(token: string): Promise<SessionMetadata | null>;
}
