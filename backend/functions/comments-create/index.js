import {
  badRequest,
  created,
  internalError,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { createComment, getDiscussionById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const courseId = event.pathParameters.courseId;
    const discussionId = event.pathParameters.discussionId;
    const body = parseBody(event);

    if (!body.content) {
      return badRequest("Missing required field: content");
    }

    await createComment(discussionId, {
      content: body.content,
      authorId: user.userId,
      authorName: user.nameEn || user.username,
      authorRole: user.role,
    });
    return created(await getDiscussionById(courseId, discussionId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create reply";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
