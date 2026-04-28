import { badRequest, internalError, ok, parseBody } from "../../shared/http.js";
import { likeDiscussion } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const { courseId, discussionId } = event.pathParameters || {};
    const body = parseBody(event);
    const userId = String(body.userId || "").trim();

    if (!courseId || !discussionId || !userId) {
      return badRequest("courseId, discussionId, and userId are required");
    }

    return ok(await likeDiscussion(courseId, discussionId, userId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to like discussion");
  }
}
