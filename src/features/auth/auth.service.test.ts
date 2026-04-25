import { describe, expect, it } from "vitest";
import { login, logout, restoreSession } from "./auth.service";
import { tokenStore } from "@/lib/apiClient";

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
