import {
  badRequest,
  created,
  forbidden,
  internalError,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { createAnnouncement } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event.pathParameters.courseId;
    const body = JSON.parse(event.body || "{}");

    if (!body.title || !body.content || !body.author) {
      return badRequest("Missing required fields: title, content, author");
    }

    const result = await createAnnouncement(courseId, body);
    return created(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create announcement";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
