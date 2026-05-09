import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { deleteCourse } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify instructor role
    await requireRole(event, ["instructor"]);
    
    // 2. Get path parameters
    const { courseId } = event.pathParameters || {};

    if (!courseId) {
      return badRequest("courseId is required");
    }

    // 3. Delete from DynamoDB (Cascading)
    await deleteCourse(courseId);
    
    return ok({ message: "Course and all related data deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete course";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
