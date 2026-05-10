import {
  badRequest,
  forbidden,
  internalError,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { addStudentToCourse } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify student role
    const user = await requireRole(event, ["student"]);
    
    // 2. Get courseId from path
    const { courseId } = event.pathParameters || {};

    if (!courseId) {
      return badRequest("courseId is required");
    }

    // 3. Enroll student in course
    const result = await addStudentToCourse(courseId, user.userId);
    
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enroll in course";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
