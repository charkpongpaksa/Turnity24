import { createDiscussion } from "./shared/dynamo.js";
import { created, parseBody, internalError } from "./shared/http.js";

export const handler = async (event) => {
  try {
    const body = parseBody(event);
    const { courseId, title, content, author } = body;

    const data = await createDiscussion(courseId, {
      title,
      content,
      author,
    });

    return created(data);
  } catch (err) {
    return internalError(err.message);
  }
};
