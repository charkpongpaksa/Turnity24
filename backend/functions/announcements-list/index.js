import { ok, internalError, unauthorized } from "./shared/http.js";
import { listAnnouncements } from "./shared/dynamo.js";
import { requireAuthenticatedUser } from "./shared/auth.js";

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const courseId = event.pathParameters.courseId;
    return ok(await listAnnouncements(courseId));
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(error instanceof Error ? error.message : "Failed to list announcements");
  }
}
