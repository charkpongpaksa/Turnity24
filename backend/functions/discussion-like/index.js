import { badRequest, internalError, ok, unauthorized } from "./shared/http.js";
import { requireAuthenticatedUser } from "./shared/auth.js";
import { likeDiscussion } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const { courseId, discussionId } = event.pathParameters || {};
    const userId = user.userId;

    if (!courseId || !discussionId || !userId) {
      return badRequest("courseId, discussionId, and userId are required");
    }

    return ok(await likeDiscussion(courseId, discussionId, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to like discussion";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
