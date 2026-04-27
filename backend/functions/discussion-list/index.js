import { listDiscussions } from "../../shared/dynamo.js";
import { ok, internalError } from "../../shared/http.js";

export const handler = async (event) => {
  try {
    const courseId = event.queryStringParameters?.courseId;

    const data = await listDiscussions(courseId);
    return ok(data);
  } catch (err) {
    return internalError(err.message);
  }
};