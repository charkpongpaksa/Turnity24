import { badRequest, created, internalError, parseBody } from "../../shared/http.js";
import { createComment } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const discussionId = event.pathParameters.discussionId;
    const body = parseBody(event);

    if (!body.content || !body.authorId || !body.authorName) {
      return badRequest("Missing required fields: content, authorId, authorName");
    }

    return created(await createComment(discussionId, body));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create reply");
  }
}
