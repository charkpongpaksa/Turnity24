import {
  badRequest,
  created,
  forbidden,
  internalError,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { createAssignment } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event.pathParameters.courseId;
    const body = parseBody(event);

    if (!body.title || !body.description || !body.dueDate) {
      return badRequest("Missing required fields: title, description, dueDate");
    }

    const result = await createAssignment(courseId, body);
    return created(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create assignment";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
