import { internalError, ok, unauthorized } from "./shared/http.js";
import { requireAuthenticatedUser } from "./shared/auth.js";
import { listNotifications } from "./shared/dynamo.js";

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    return ok(await listNotifications(user.userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list notifications";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
