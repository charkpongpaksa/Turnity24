import { internalError, notFound, ok, unauthorized } from "./shared/http.js";
import { getCourseById } from "./shared/dynamo.js";
import { requireAuthenticatedUser } from "./shared/auth.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const courseId = event?.pathParameters?.courseId;
    const course = await getCourseById(courseId);

    if (!course) {
      return notFound("Course not found");
    }

    return ok(course);
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to load course");
  }
}
