import { forbidden, internalError, ok, unauthorized } from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { listSubmissions } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const assignmentId = event.pathParameters.assignmentId;
    return ok(await listSubmissions(assignmentId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list submissions";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
