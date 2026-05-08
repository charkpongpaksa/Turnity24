import {
  badRequest,
  created,
  forbidden,
  internalError,
  parseBody,
  unauthorized,
} from "./shared/http.js";
import { requireRole } from "./shared/auth.js";
import { createCourse } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    const body = parseBody(event);
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim();
    const instructor = String(body.instructor ?? "").trim();

    if (!name || !code || !instructor) {
      return badRequest("name, code, and instructor are required");
    }

    return created(
      await createCourse({
        name,
        code,
        instructor,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create course";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
