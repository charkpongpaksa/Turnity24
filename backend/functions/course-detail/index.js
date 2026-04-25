import { internalError, notFound, ok } from "../../shared/http.js";
import { getCourseById } from "../../shared/course-store.js";

export async function handler(event) {
  try {
    const courseId = event?.pathParameters?.courseId;
    const course = getCourseById(courseId);

    if (!course) {
      return notFound("Course not found");
    }

    return ok(course);
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to load course");
  }
}
