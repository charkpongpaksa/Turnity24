import { badRequest, internalError, ok, parseBody } from "./shared/http.js";
import { likeDiscussion } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const { courseId, discussionId } = event.pathParameters;
    const body = parseBody(event);

    if (!body.userId) {
      return badRequest("Missing required field: userId");
    }

    return ok(await likeDiscussion(courseId, discussionId, body.userId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to like discussion");
  }
}
