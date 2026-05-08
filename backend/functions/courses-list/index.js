import { ok, badRequest, internalError, unauthorized } from "./shared/http.js";
import { listCourses, listCoursesByStudent } from "./shared/dynamo.js";
import { requireAuthenticatedUser } from "./shared/auth.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const { role, userId } = event.queryStringParameters || {};

    if (role === "student") {
      if (!userId) return badRequest("userId is required for student role");
      return ok(await listCoursesByStudent(userId));
    }

    return ok(await listCourses());
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to list courses");
  }
}
