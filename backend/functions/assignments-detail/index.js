import { badRequest, internalError, notFound, ok, unauthorized } from "../../shared/http.js";
import { getAssignmentById } from "../../shared/dynamo.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const courseId = event?.pathParameters?.courseId;
    const assignmentId = event?.pathParameters?.assignmentId;

    if (!courseId || !assignmentId) {
      return badRequest("courseId and assignmentId are required");
    }

    const assignment = await getAssignmentById(courseId, assignmentId);
    if (!assignment) {
      return notFound("Assignment not found");
    }

    return ok(assignment);
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to get assignment");
  }
}
