import {
  badRequest,
  forbidden,
  internalError,
  ok,
  unauthorized,
} from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { deleteAssignment } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event?.pathParameters?.courseId;
    const assignmentId = event?.pathParameters?.assignmentId;

    if (!courseId || !assignmentId) {
      return badRequest("courseId and assignmentId are required");
    }

    await deleteAssignment(courseId, assignmentId);
    return ok({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete assignment";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
