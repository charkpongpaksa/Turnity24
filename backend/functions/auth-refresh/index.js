import {
  badRequest,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { createAccessToken, createRefreshToken, parseRefreshToken } from "./shared/auth.js";
import { getUserById } from "./shared/users.js";

export async function handler(event) {
  try {
    const body = parseBody(event);
    const { refreshToken } = body;

    if (!refreshToken) {
      return badRequest("refreshToken is required");
    }

    const payload = parseRefreshToken(refreshToken);
    if (!payload) {
      return unauthorized("Invalid or expired refresh token");
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      return unauthorized("User not found");
    }

    const accessToken = createAccessToken(user.userId, user.role);
    const newRefreshToken = createRefreshToken(user.userId);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const accessTokenTtl = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 28800);

    return ok({
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: nowSeconds + accessTokenTtl,
    });
  } catch (error) {
    console.error("Auth refresh error:", error);
    return internalError(error.message);
  }
}
