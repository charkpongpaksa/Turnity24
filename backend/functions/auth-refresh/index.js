import { badRequest, internalError, ok, parseBody, unauthorized } from "../../shared/http.js";
import { createAccessToken } from "../../shared/auth.js";
import { getUserById } from "../../shared/users.js";

export async function handler(event) {
  try {
    const body = parseBody(event);
    const refreshToken = String(body.refreshToken || "").trim();

    if (!refreshToken.startsWith("refresh-")) {
      return unauthorized("Invalid refresh token");
    }

    const userId = refreshToken.slice("refresh-".length);
    if (!userId) {
      return badRequest("refreshToken is required");
    }

    const user = await getUserById(userId);
    if (!user) {
      return unauthorized("Invalid refresh token");
    }

    return ok({
      accessToken: createAccessToken(user.userId, user.role),
      refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh token";
    if (message.includes("Invalid JSON")) return badRequest(message);
    return internalError(message);
  }
}
