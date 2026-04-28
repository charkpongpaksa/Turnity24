import { badRequest, internalError, notFound, ok, parseBody } from "../../shared/http.js";
import { updateAnnouncement } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
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
    return internalError(error instanceof Error ? error.message : "Failed to update announcement");
  }
}
