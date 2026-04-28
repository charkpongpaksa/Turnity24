import { internalError, ok } from "../../shared/http.js";
import { listStudents } from "../../shared/dynamo.js";

export async function handler() {
  try {
    return ok(await listStudents());
  } catch (error) {
    return internalError(error instanceof Error ? error.message : "Failed to list students");
  }
}
