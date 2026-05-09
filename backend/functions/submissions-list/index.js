import { forbidden, internalError, ok, unauthorized } from "../../shared/http.js";
import { requireAuthenticatedUser, requireRole } from "../../shared/auth.js";
import { listSubmissions } from "../../shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const assignmentId = event.pathParameters.assignmentId;
    
    const allSubmissions = await listSubmissions(assignmentId);
    
    // If user is a student, only return their own submissions
    if (user.role === "student") {
      const studentSubmissions = allSubmissions.filter(sub => sub.studentId === user.id);
      return ok(studentSubmissions);
    }
    
    // For instructors, require instructor role and return all submissions
    await requireRole(event, ["instructor"]);
    return ok(allSubmissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list submissions";
    if (message === "Unauthorized") return unauthorized(message);
    if (message === "Forbidden") return forbidden(message);
    return internalError(message);
  }
}
