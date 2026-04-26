import { ok, internalError } from "../../shared/http.js";
import { listAnnouncements } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    return ok(await listAnnouncements(courseId));
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list announcements");
  }
}
