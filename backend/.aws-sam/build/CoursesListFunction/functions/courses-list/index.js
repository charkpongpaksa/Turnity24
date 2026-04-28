import { ok, badRequest, internalError } from "../../shared/http.js";
import { listCourses, listCoursesByStudent } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const { role, userId } = event.queryStringParameters || {};

    if (role === "student") {
      if (!userId) return badRequest("userId is required for student role");
      return ok(await listCoursesByStudent(userId));
    }

    return ok(await listCourses());
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list courses");
  }
}
