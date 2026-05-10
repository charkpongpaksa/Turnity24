import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { listSubmissions } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    
    const { assignmentId, submissionId } = event.pathParameters || {};

    if (!assignmentId || !submissionId) {
      return badRequest("assignmentId and submissionId are required");
    }

    // DynamoDB doesn't have a direct Get for submission by ID without PK (ASS#id)
    // So we list submissions and find the one with the ID
    const submissions = await listSubmissions(assignmentId);
    const result = submissions.find(s => s.id === submissionId);
    
    if (!result) {
      return notFound("Submission not found");
    }
    
    // Students can only access their own submissions
    if (user.role === "student" && result.studentId !== user.id) {
      return forbidden("Access denied");
    }
    
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch submission detail";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
