import { badRequest, created, internalError, parseBody } from "../../shared/http.js";
import { createSubmission } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const assignmentId = event.pathParameters.assignmentId;
    const body = parseBody(event);

    if (!body.studentId) {
      return badRequest("Missing required field: studentId");
    }

    return created(await createSubmission(assignmentId, body.studentId, body));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create submission");
  }
}
