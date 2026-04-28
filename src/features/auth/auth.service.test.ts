import { beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/lib/apiClient";

vi.mock("@/lib/config/env", () => ({
  appConfig: {
    dataSource: "mock",
    apiBaseUrl: "",
  },
}));

let login: typeof import("./auth.service").login;
let logout: typeof import("./auth.service").logout;
let restoreSession: typeof import("./auth.service").restoreSession;

beforeEach(async () => {
  const authService = await import("./auth.service");
  login = authService.login;
  logout = authService.logout;
  restoreSession = authService.restoreSession;
});

describe("auth.service", () => {
  it("creates a student session in mock mode", async () => {
    const session = await login({
      username: "student01",
      password: "password123",
    });

    expect(session.user.role).toBe("student");
    expect(restoreSession()?.user.username).toBe("student01");
  });

  it("creates an instructor session in mock mode", async () => {
    const session = await login({
      username: "teacher01",
      password: "password123",
    });

    expect(session.user.role).toBe("instructor");
  });

  it("clears the stored session and token on logout", async () => {
    await login({
      username: "student01",
      password: "password123",
    });

    await logout();

    expect(restoreSession()).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });
});
