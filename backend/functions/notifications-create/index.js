import { badRequest, created, internalError, parseBody } from "../../shared/http.js";
import { createNotification } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const studentId = event.pathParameters.studentId;
    const body = parseBody(event);

    if (!body.title || !body.message) {
      return badRequest("Missing required fields: title, message");
    }

    return created(await createNotification(studentId, body));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create notification");
  }
}
