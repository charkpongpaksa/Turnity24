import { api } from "@/lib/apiClient";
import { AUTH } from "@/lib/apiEndpoints";
import { appConfig } from "@/lib/config/env";
import type { AuthLoginResponse } from "@/lib/contracts/api";
import type {
  AuthSession,
  LoginFormInput,
  TuApiProfile,
} from "./auth.types";
import { authSessionStore } from "./auth.storage";
import { buildAuthSession } from "./auth.utils";

function createMockProfile(username: string): TuApiProfile {
  const normalized = username.trim().toLowerCase();
  const isInstructor =
    normalized.startsWith("emp") ||
    normalized.startsWith("teacher") ||
    normalized.startsWith("lec") ||
    normalized.includes("staff");

  if (isInstructor) {
    return {
      status: true,
      message: "Success",
      type: "employee",
      username,
      displayname_th: "อาจารย์ ทดสอบ",
      displayname_en: "Lecturer Demo",
      StatusWork: "1",
      StatusEmp: "ปกติ",
      email: `${username}@tu.ac.th`,
      department: "Computer Science",
      organization: "Thammasat University",
    };
  }

  return {
    status: true,
    message: "Success",
    type: "student",
    username,
    tu_status: "ปกติ",
    statusid: "10",
    displayname_th: "นักศึกษา ทดสอบ",
    displayname_en: "Student Demo",
    email: `${username}@dome.tu.ac.th`,
    department: "Computer Science",
    faculty: "Faculty of Science and Technology",
  };
}

async function loginWithMock(input: LoginFormInput): Promise<AuthSession> {
  if (!input.username.trim() || !input.password.trim()) {
    throw new Error("Username and password are required.");
  }

  if (input.password.trim().length < 4) {
    throw new Error("Mock password must be at least 4 characters.");
  }

  const session = buildAuthSession({
    accessToken: `mock-token-${input.username}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    profile: createMockProfile(input.username),
  });

  authSessionStore.set(session);
  return session;
}

async function loginWithApi(input: LoginFormInput): Promise<AuthSession> {
  const response = await api.post<AuthLoginResponse>(
    AUTH.LOGIN,
    {
      username: input.username,
      password: input.password,
    },
    { skipAuth: true }
  );

  const session = buildAuthSession(response);
  authSessionStore.set(session);
  return session;
}

export async function login(input: LoginFormInput): Promise<AuthSession> {
  if (appConfig.dataSource === "api") {
    return loginWithApi(input);
  }

  return loginWithMock(input);
}

export async function logout(): Promise<void> {
  if (appConfig.dataSource === "api") {
    try {
      await api.post<void>(AUTH.LOGOUT);
    } catch {
      // Local cleanup still matters even if the backend logout call fails.
    }
  }

  authSessionStore.clear();
}

export function restoreSession(): AuthSession | null {
  return authSessionStore.get();
}
