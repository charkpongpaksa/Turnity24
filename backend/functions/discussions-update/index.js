import { badRequest, internalError, ok, parseBody } from "./shared/http.js";
import { updateDiscussion } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const { courseId, discussionId } = event.pathParameters;
    const body = parseBody(event);

    if (!body.content) {
      return badRequest("Missing required field: content");
    }

    return ok(await updateDiscussion(courseId, discussionId, body));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to update discussion");
  }
}
