import { badRequest, internalError, notFound, ok } from "../../shared/http.js";
import { getAssignmentById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
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
    return internalError(error instanceof Error ? error.message : "Failed to get assignment");
  }
}
