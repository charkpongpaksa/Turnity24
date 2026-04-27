import { created, internalError, badRequest } from "../../shared/http.js";
import { createAnnouncement, getCourseById } from "../../shared/dynamo.js";
import { notifyAnnouncementCreated } from "../../shared/notifications.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const body = JSON.parse(event.body || "{}");

    if (!body.title || !body.content || !body.author) {
      return badRequest("Missing required fields: title, content, author");
    }

    const result = await createAnnouncement(courseId, body);
    let notification;

    try {
      const course = await getCourseById(courseId);
      notification = await notifyAnnouncementCreated(course, result);
    } catch (error) {
      notification = {
        skipped: true,
        reason: error instanceof Error ? error.message : "Failed to publish notification",
      };
    }

    return created({ ...result, notification });
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create announcement");
  }
}
