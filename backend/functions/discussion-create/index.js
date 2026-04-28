import { createDiscussion } from "../../shared/dynamo.js";
import { badRequest, created, internalError, parseBody } from "../../shared/http.js";

export const handler = async (event) => {
  try {
    const body = parseBody(event);
    const courseId = event?.pathParameters?.courseId;
    const { title, content, author, authorAvatar, authorId, authorRole } = body;

    if (!courseId || !title || !content || !author) {
      return badRequest("courseId, title, content, and author are required");
    }

    const data = await createDiscussion(courseId, {
      title,
      content,
      author,
      authorAvatar,
      authorId,
      authorRole,
    });

    return created(data);
  } catch (err) {
    return internalError(err instanceof Error ? err.message : "Failed to create discussion");
  }
};
