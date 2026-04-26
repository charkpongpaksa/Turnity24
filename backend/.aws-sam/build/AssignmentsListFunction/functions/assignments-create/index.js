import { created, internalError, badRequest } from "../../shared/http.js";
import { createAssignment } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const courseId = event.pathParameters.courseId;
    const body = JSON.parse(event.body || "{}");

    if (!body.title || !body.description || !body.dueDate) {
      return badRequest("Missing required fields: title, description, dueDate");
    }

    const result = await createAssignment(courseId, body);
    return created(result);
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to create assignment");
  }
}
