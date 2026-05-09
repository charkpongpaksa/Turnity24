import { badRequest, forbidden, internalError, ok, unauthorized } from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { deleteDiscussion } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const { courseId, discussionId } = event.pathParameters || {};

    if (!courseId || !discussionId) {
      return badRequest("courseId and discussionId are required");
    }

    await deleteDiscussion(courseId, discussionId);
    return ok({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete discussion";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
