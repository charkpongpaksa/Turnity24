import { getCurrentUserFromEvent } from "../../shared/auth.js";
import { ok, unauthorized } from "../../shared/http.js";

function initialsFromName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export async function handler(event) {
  const user = await getCurrentUserFromEvent(event);
  if (!user) {
    return unauthorized("Invalid or missing access token");
  }

  return ok({
    id: user.userId,
    name: user.nameEn || user.username,
    initials: initialsFromName(user.nameEn || user.username),
    activeRole: user.role,
  });
}
