import type { AuthSession } from "./auth.types";

const SESSION_KEY = "turnity_auth_session";

export const authSessionStore = {
  get(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as AuthSession;
      return {
        ...session,
        activeRole: session.activeRole ?? session.user.role,
      };
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  set(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
