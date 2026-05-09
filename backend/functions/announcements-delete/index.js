import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireRole } from "../../shared/auth.js";
import { deleteAnnouncement } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify instructor role
    await requireRole(event, ["instructor"]);
    
    // 2. Get path parameters
    const { courseId, announcementId } = event.pathParameters || {};

    if (!courseId || !announcementId) {
      return badRequest("courseId and announcementId are required");
    }

    // 3. Delete from DynamoDB
    const result = await deleteAnnouncement(courseId, announcementId);
    
    return ok({ message: "Announcement deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete announcement";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
