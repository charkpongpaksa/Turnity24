import {
  badRequest,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { getUserById, updateUserProfile } from "../../shared/users.js";

function initialsFromName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function toCurrentUser(user) {
  return {
    id: user.userId,
    name: user.nameEn || user.username,
    initials: initialsFromName(user.nameEn || user.username),
    avatarUrl: user.avatar || "",
    activeRole: user.role,
  };
}

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "GET") {
      const dbUser = await getUserById(user.userId);
      return ok(toCurrentUser(dbUser));
    }

    if (method === "PUT" || method === "POST") {
      const body = parseBody(event);
      const updatedUser = await updateUserProfile(user.userId, body);
      return ok(toCurrentUser(updatedUser));
    }

    return badRequest("Method not allowed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile action failed";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
