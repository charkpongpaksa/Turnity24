import { internalError, ok } from "./shared/http.js";
import { listDiscussions } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    return ok(await listDiscussions(courseId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list discussions");
  }
}
