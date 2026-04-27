import { internalError, ok } from "../../shared/http.js";
import { deleteDiscussion } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const { courseId, discussionId } = event.pathParameters;
    await deleteDiscussion(courseId, discussionId);
    return ok({});
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to delete discussion");
  }
}
