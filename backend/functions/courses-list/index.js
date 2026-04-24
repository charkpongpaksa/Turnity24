import { ok, internalError } from "../../shared/http.js";
import { listCourses } from "../../shared/course-store.js";

export async function handler() {
  try {
    return ok(listCourses());
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list courses");
  }
}
