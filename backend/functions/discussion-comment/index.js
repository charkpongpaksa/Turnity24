import { createComment } from "../../shared/dynamo.js";
import { created, parseBody, internalError } from "../../shared/http.js";

export const handler = async (event) => {
  try {
    const body = parseBody(event);
    const { discussionId, content, author } = body;

    const data = await createComment(discussionId, {
      content,
      author,
    });

    return created(data);
  } catch (err) {
    return internalError(err.message);
  }
};