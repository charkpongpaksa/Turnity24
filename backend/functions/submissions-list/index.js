import { internalError, ok } from "../../shared/http.js";
import { listSubmissions } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const assignmentId = event.pathParameters.assignmentId;
    return ok(await listSubmissions(assignmentId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list submissions");
  }
}
