import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, LoginFormInput } from "./auth.types";
import {
  getDefaultRouteForRole,
} from "./auth.utils";
import { login as loginRequest, logout as logoutRequest, restoreSession } from "./auth.service";
import { authSessionStore } from "./auth.storage";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentRole: "student" | "instructor" | null;
  canSwitchViews: boolean;
  login: (input: LoginFormInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  switchActiveRole: (role: "student" | "instructor") => void;
  homePath: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(restoreSession());
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      currentRole: session?.activeRole ?? null,
      canSwitchViews: session?.user.role === "instructor",
      async login(input) {
        const nextSession = await loginRequest(input);
        setSession(nextSession);
        return nextSession;
      },
      async logout() {
        await logoutRequest();
        setSession(null);
      },
      switchActiveRole(role) {
        setSession((current) => {
          if (!current) return current;
          if (current.user.role !== "instructor") return current;

          const nextSession = { ...current, activeRole: role };
          return nextSession;
        });
      },
      homePath: session ? getDefaultRouteForRole(session.activeRole) : "/login",
    }),
    [isLoading, session]
  );

  useEffect(() => {
    if (!session) return;
    authSessionStore.set(session);
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
