import { badRequest, created, internalError, parseBody } from "../../shared/http.js";
import { createComment, getDiscussionById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const discussionId = event.pathParameters.discussionId;
    const body = parseBody(event);

    if (!body.content || !body.authorId || !body.authorName) {
      return badRequest("Missing required fields: content, authorId, authorName");
    }

    await createComment(discussionId, body);
    return created(await getDiscussionById(courseId, discussionId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create reply");
  }
}
