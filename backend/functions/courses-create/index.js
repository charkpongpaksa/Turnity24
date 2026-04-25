import { badRequest, created, internalError, parseBody } from "../../shared/http.js";
import { createCourse } from "../../shared/course-store.js";

export async function handler(event) {
  try {
    const body = parseBody(event);
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim();
    const instructor = String(body.instructor ?? "").trim();

    if (!name || !code || !instructor) {
      return badRequest("name, code, and instructor are required");
    }

    return created(
      createCourse({
        name,
        code,
        instructor,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create course";
    if (message.includes("required") || message.includes("Invalid JSON")) {
      return badRequest(message);
    }
    return internalError(message);
  }
}
