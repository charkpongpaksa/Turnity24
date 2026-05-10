import {
  badRequest,
  created,
  forbidden,
  internalError,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { createSubmission } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const assignmentId = event.pathParameters.assignmentId;
    const body = parseBody(event);
    const requestedStudentId = String(body.studentId || "").trim();
    const studentId =
      user.role === "student"
        ? user.userId
        : String(requestedStudentId || user.userId).trim();

    if (user.role !== "student" && user.role !== "instructor") {
      return forbidden("Forbidden");
    }

    return created(await createSubmission(assignmentId, studentId, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create submission";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    if (message.includes("required")) return badRequest(message);
    return internalError(message);
  }
}
