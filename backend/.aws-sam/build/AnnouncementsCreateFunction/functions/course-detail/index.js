import { internalError, notFound, ok } from "../../shared/http.js";
import { getCourseById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event?.pathParameters?.courseId;
    const course = await getCourseById(courseId);

    if (!course) {
      return notFound("Course not found");
    }

    return ok(course);
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to load course");
  }
}
