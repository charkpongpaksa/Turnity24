import { internalError, ok } from "../../shared/http.js";
import { listComments } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const discussionId = event.pathParameters.discussionId;
    return ok(await listComments(discussionId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list comments");
  }
}
