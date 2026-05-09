import { forbidden, internalError, ok, unauthorized } from "../../shared/http.js";
import { requireAuthenticatedUser, requireRole } from "../../shared/auth.js";
import { listSubmissions } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const assignmentId = event.pathParameters.assignmentId;
    const submissions = await listSubmissions(assignmentId);

    return ok(
      user.role === "instructor"
        ? submissions
        : submissions.filter((submission) => submission.studentId === user.userId)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list submissions";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
