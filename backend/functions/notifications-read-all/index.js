import { internalError, ok, unauthorized } from "./shared/http.js";
import { requireAuthenticatedUser } from "./shared/auth.js";
import { markAllNotificationsRead } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    await markAllNotificationsRead(user.userId);
    return ok({});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark all notifications as read";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
