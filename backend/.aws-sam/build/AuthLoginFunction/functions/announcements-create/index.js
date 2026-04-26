import { created, internalError, badRequest } from "../../shared/http.js";
import { createAnnouncement } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const body = JSON.parse(event.body || "{}");

    if (!body.title || !body.content || !body.author) {
      return badRequest("Missing required fields: title, content, author");
    }

    const result = await createAnnouncement(courseId, body);
    return created(result);
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create announcement");
  }
}
