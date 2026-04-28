import { badRequest, internalError, notFound, ok, parseBody } from "../../shared/http.js";
import { getCourseById, updateCourse } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
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
    return internalError(error instanceof Error ? error.message : "Failed to update course");
  }
}
