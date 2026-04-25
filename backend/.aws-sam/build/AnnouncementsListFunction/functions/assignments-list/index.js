import { ok, internalError } from "../../shared/http.js";
import { listAssignments } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    return ok(await listAssignments(courseId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list assignments");
  }
}
