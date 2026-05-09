import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { getDiscussionById } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    // 1. Verify authentication
    await requireAuthenticatedUser(event);
    
    // 2. Get path parameters
    const { courseId, discussionId } = event.pathParameters || {};

    if (!courseId || !discussionId) {
      return badRequest("courseId and discussionId are required");
    }

    // 3. Get Discussion Detail
    const result = await getDiscussionById(courseId, discussionId);
    
    if (!result) {
      return notFound("Discussion not found");
    }
    
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch discussion detail";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
