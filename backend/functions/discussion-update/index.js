import {
  badRequest,
  forbidden,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { requireAuthenticatedUser } from "./shared/auth.js";
import { getDiscussionById, updateDiscussion } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const { courseId, discussionId } = event.pathParameters || {};
    const body = parseBody(event);

    if (!courseId || !discussionId) {
      return badRequest("courseId and discussionId are required");
    }

    const discussion = await getDiscussionById(courseId, discussionId);
    if (!discussion) {
      return badRequest("Discussion not found");
    }
    if (user.role !== "instructor" && discussion.authorId !== user.userId) {
      return forbidden("Forbidden");
    }

    return ok(await updateDiscussion(courseId, discussionId, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update discussion";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
