import {
  badRequest,
  forbidden,
  internalError,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { getCourseAnalytics } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify instructor role
    await requireRole(event, ["instructor"]);
    
    // 2. Get courseId from path
    const { courseId } = event.pathParameters || {};

    if (!courseId) {
      return badRequest("courseId is required");
    }

    // 3. Get Course Analytics
    const result = await getCourseAnalytics(courseId);
    
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch course analytics";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
