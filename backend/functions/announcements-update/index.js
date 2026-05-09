import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { updateAnnouncement } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const courseId = event?.pathParameters?.courseId;
    const announcementId = event?.pathParameters?.announcementId;
    const body = parseBody(event);

    if (!courseId || !announcementId) {
      return badRequest("courseId and announcementId are required");
    }

    const updated = await updateAnnouncement(courseId, announcementId, body);
    if (!updated) {
      return notFound("Announcement not found");
    }

    return ok(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update announcement";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
