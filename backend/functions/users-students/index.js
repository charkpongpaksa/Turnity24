import { internalError, ok, unauthorized, forbidden } from "../../shared/http.js";
import { listStudents } from "../../shared/dynamo.js";
import { requireRole } from "../../shared/auth.js";

export async function handler(event) {
  try {
    await requireRole(event, ["instructor"]);
    return ok(await listStudents());
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    if (error?.message === "Forbidden") return forbidden();
    return internalError(error instanceof Error ? error.message : "Failed to list students");
  }
}
