import { created, internalError, badRequest } from "../../shared/http.js";
import { createAssignment, getCourseById } from "../../shared/dynamo.js";
import { notifyAssignmentCreated } from "../../shared/notifications.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const body = JSON.parse(event.body || "{}");

    if (!body.title || !body.description || !body.dueDate) {
      return badRequest("Missing required fields: title, description, dueDate");
    }

    const result = await createAssignment(courseId, body);
    let notification;

    try {
      const course = await getCourseById(courseId);
      notification = await notifyAssignmentCreated(course, result);
    } catch (error) {
      notification = {
        skipped: true,
        reason: error instanceof Error ? error.message : "Failed to publish notification",
      };
    }

    return created({ ...result, notification });
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create assignment");
  }
}
