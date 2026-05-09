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
    
    const { courseId, assignmentId } = event.pathParameters;
    const body = parseBody(event);

    const result = await updateAssignment(courseId, assignmentId, body);
    
    if (!result) {
      return notFound("Assignment not found");
    }

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update assignment";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
