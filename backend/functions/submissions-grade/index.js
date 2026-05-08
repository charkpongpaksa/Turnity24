import {
  badRequest,
  forbidden,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { gradeSubmissionBySubmissionId } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const assignmentId = event.pathParameters?.assignmentId;
    const submissionId =
      event.pathParameters?.submissionId ?? event.pathParameters?.studentId;
    const body = parseBody(event);

    if (!assignmentId || !submissionId) {
      return badRequest("assignmentId and submissionId are required");
    }

    if (body.score === undefined || body.score < 0 || body.score > 100) {
      return badRequest("score must be between 0 and 100");
    }

    return ok(
      await gradeSubmissionBySubmissionId(assignmentId, submissionId, {
        score: body.score,
        feedback: body.feedback || "",
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to grade submission";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
