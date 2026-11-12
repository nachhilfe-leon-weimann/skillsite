import { sessionEnd, type PortalSession } from "../model/session";

/**
 * Where portal sessions live. In memory for now (AH-5): after a restart the admin logs in again. A persistent
 * store comes with the student portal and implements the same interface.
 */
export interface SessionStore {
  get(id: string): PortalSession | undefined;
  set(session: PortalSession): void;
  delete(id: string): void;
}

/** Most sessions kept at once: the admin area has one user, the bound only stops unbounded growth. */
export const MAX_SESSIONS = 100;

/**
 * Sessions in a `Map`, at most `maxSessions`. Adding one at the bound first drops every ended session, then the one
 * idle the longest. Reading an ended session drops it. `now` is injectable for tests.
 */
export class MemorySessionStore implements SessionStore {
  // Ordered by the last write, oldest first: `set` moves a session to the end.
  readonly #sessions = new Map<string, PortalSession>();
  readonly #maxSessions: number;
  readonly #now: () => number;

  constructor({
    maxSessions = MAX_SESSIONS,
    now = Date.now,
  }: { maxSessions?: number; now?: () => number } = {}) {
    this.#maxSessions = maxSessions;
    this.#now = now;
  }

  get(id: string): PortalSession | undefined {
    const session = this.#sessions.get(id);
    if (session && sessionEnd(session, this.#now()) === "expired") {
      // Past its refresh token's expiry, nothing can be done with it any more. An idle one is still handed out:
      // the caller ends it and revokes its SkillForge session.
      this.#sessions.delete(id);
      return undefined;
    }
    return session;
  }

  set(session: PortalSession): void {
    this.#sessions.delete(session.id);
    if (this.#sessions.size >= this.#maxSessions) this.#prune();
    this.#sessions.set(session.id, session);
  }

  delete(id: string): void {
    this.#sessions.delete(id);
  }

  get size(): number {
    return this.#sessions.size;
  }

  #prune() {
    const now = this.#now();
    for (const [id, session] of this.#sessions) {
      if (sessionEnd(session, now)) this.#sessions.delete(id);
    }
    while (this.#sessions.size >= this.#maxSessions) {
      const oldest = this.#sessions.keys().next().value;
      if (oldest === undefined) break;
      this.#sessions.delete(oldest);
    }
  }
}
