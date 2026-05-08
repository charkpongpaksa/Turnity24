import { badRequest, created, internalError, parseBody, unauthorized } from "./shared/http.js";
import { createNotification } from "./shared/dynamo.js";
import { requireAuthenticatedUser } from "./shared/auth.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const studentId = event.pathParameters.studentId;
    const body = parseBody(event);

    if (!body.title || !body.message) {
      return badRequest("Missing required fields: title, message");
    }

    return created(await createNotification(studentId, body));
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to create notification");
  }
}
