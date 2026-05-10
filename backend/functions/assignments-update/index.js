import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { updateAssignment } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const { courseId, assignmentId } = event.pathParameters || {};
    const body = parseBody(event);

    if (!courseId || !assignmentId) {
      return badRequest("courseId and assignmentId are required");
    }

    const updated = await updateAssignment(courseId, assignmentId, body);
    if (!updated) {
      return notFound("Assignment not found");
    }

    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update assignment";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
