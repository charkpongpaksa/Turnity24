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
import {
  addStudentToCourse,
  getCourseById,
  listCourseStudents,
  removeStudentFromCourse,
} from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event?.pathParameters?.courseId;
    const studentIdFromPath = event?.pathParameters?.studentId;
    const course = await getCourseById(courseId);

    if (!course) {
      return notFound("Course not found");
    }

    if (event.requestContext.http.method === "GET") {
      return ok(await listCourseStudents(courseId));
    }

    if (event.requestContext.http.method === "POST") {
      const body = parseBody(event);
      const studentId = String(body.studentId ?? "").trim();

      if (!studentId) {
        return badRequest("studentId is required");
      }

      return ok(await addStudentToCourse(courseId, studentId));
    }

    if (event.requestContext.http.method === "DELETE") {
      if (!studentIdFromPath) {
        return badRequest("studentId path parameter is required");
      }

      return ok(await removeStudentFromCourse(courseId, studentIdFromPath));
    }

    return badRequest("Unsupported method");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to manage course students";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
