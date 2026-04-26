import { internalError, ok } from "../../shared/http.js";
import { listNotifications } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const studentId = event.queryStringParameters?.studentId;
    return ok(await listNotifications(studentId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list notifications");
  }
}
