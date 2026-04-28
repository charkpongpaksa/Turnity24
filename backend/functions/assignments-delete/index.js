import { badRequest, internalError, ok } from "../../shared/http.js";
import { deleteAssignment } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event?.pathParameters?.courseId;
    const assignmentId = event?.pathParameters?.assignmentId;

    if (!courseId || !assignmentId) {
      return badRequest("courseId and assignmentId are required");
    }

    await deleteAssignment(courseId, assignmentId);
    return ok({});
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to delete assignment");
  }
}
