import { badRequest, created, internalError, parseBody } from "./shared/http.js";
import { createDiscussion } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const body = parseBody(event);

    if (!body.title || !body.content || !body.author || !body.authorId) {
      return badRequest("Missing required fields: title, content, author, authorId");
    }

    return created(await createDiscussion(courseId, body));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create discussion");
  }
}
