import {
  badRequest,
  internalError,
  ok,
  unauthorized,
  parseBody,
} from "../../shared/http.js";
import { authenticateUser, createAccessToken } from "../../shared/auth.js";

export async function handler(event) {
  try {
    const body = parseBody(event);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!username || !password) {
      return badRequest("username and password are required");
    }

    const { profile, user } = await authenticateUser({ username, password });

    return ok({
      accessToken: createAccessToken(user.userId),
      refreshToken: `refresh-${user.userId}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (
      message.toLowerCase().includes("failed") ||
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("authentication")
    ) {
      return unauthorized(message);
    }
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
