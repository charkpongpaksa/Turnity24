import { internalError, ok, unauthorized } from "./shared/http.js";
import { listComments } from "./shared/dynamo.js";
import { requireAuthenticatedUser } from "./shared/auth.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const discussionId = event.pathParameters.discussionId;
    return ok(await listComments(discussionId));
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to list comments");
  }
}
