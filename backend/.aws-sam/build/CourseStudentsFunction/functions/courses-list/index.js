import { ok, internalError } from "../../shared/http.js";
import { listCourses } from "../../shared/dynamo.js";

export async function handler() {
  try {
    return ok(await listCourses());
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list courses");
  }
}
