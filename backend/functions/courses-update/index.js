import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { getCourseById, updateCourse } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event?.pathParameters?.courseId;
    const body = parseBody(event);

    if (!courseId) {
      return badRequest("courseId is required");
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return notFound("Course not found");
    }

    return ok(await updateCourse(courseId, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update course";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
