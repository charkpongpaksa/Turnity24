import { badRequest, internalError, ok, unauthorized, parseBody } from "../../shared/http.js";
import { verifyWithTuApi } from "../../shared/auth.js";

export async function handler(event) {
  try {
    const body = parseBody(event);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!username || !password) {
      return badRequest("username and password are required");
    }

    const profile = await verifyWithTuApi({ username, password });

    return ok({
      accessToken: `dev-token-${username}`,
      refreshToken: `dev-refresh-${username}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message.toLowerCase().includes("failed")) {
      return unauthorized(message);
    }
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
