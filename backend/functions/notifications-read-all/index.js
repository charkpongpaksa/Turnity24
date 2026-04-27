import { internalError, ok } from "../../shared/http.js";
import { markAllNotificationsRead } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const studentId = event.queryStringParameters?.studentId;
    await markAllNotificationsRead(studentId);
    return ok({});
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to mark all notifications as read");
  }
}
