import {
  badRequest,
  forbidden,
  internalError,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { getAssignmentAnalytics } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify instructor role
    await requireRole(event, ["instructor"]);
    
    // 2. Get courseId and assignmentId from path
    const { courseId, assignmentId } = event.pathParameters || {};

    if (!courseId || !assignmentId) {
      return badRequest("courseId and assignmentId are required");
    }

    // 3. Get Assignment Analytics
    const result = await getAssignmentAnalytics(courseId, assignmentId);
    
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch assignment analytics";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
