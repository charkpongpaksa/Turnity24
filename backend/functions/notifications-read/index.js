import { internalError, ok, unauthorized } from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { markNotificationReadById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const notificationId = event.pathParameters.notificationId;
    await markNotificationReadById(notificationId);
    return ok({});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark notification as read";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
