import { requireAuthenticatedUser } from "./shared/auth.js";
import { createDiscussion } from "./shared/dynamo.js";
import {
  badRequest,
  created,
  internalError,
  parseBody,
  unauthorized,
} from "./shared/http.js";

export const handler = async (event) => {
  try {
    const user = await requireAuthenticatedUser(event);
    const body = parseBody(event);
    const courseId = event?.pathParameters?.courseId;
    const { title, content, authorAvatar } = body;
    const author = user.nameEn || user.username;
    const authorId = user.userId;
    const authorRole = user.role;

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
    const message = err instanceof Error ? err.message : "Failed to create discussion";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
};
