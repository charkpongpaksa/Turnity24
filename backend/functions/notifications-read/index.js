import { internalError, ok } from "../../shared/http.js";
import { markNotificationReadById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const notificationId = event.pathParameters.notificationId;
    await markNotificationReadById(notificationId);
    return ok({});
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to mark notification as read");
  }
}
