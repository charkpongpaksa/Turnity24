export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    },
    body: JSON.stringify(body),
  };
}

export function ok(body) {
  return json(200, body);
}

export function created(body) {
  return json(201, body);
}

export function badRequest(message, code = "BAD_REQUEST") {
  return json(400, { message, code });
}

export function unauthorized(message = "Unauthorized") {
  return json(401, { message, code: "UNAUTHORIZED" });
}

export function forbidden(message = "Forbidden") {
  return json(403, { message, code: "FORBIDDEN" });
}

export function notFound(message = "Not found") {
  return json(404, { message, code: "NOT_FOUND" });
}

export function internalError(message = "Internal server error") {
  return json(500, { message, code: "INTERNAL_ERROR" });
}

export function parseBody(event) {
  if (!event.body) return {};

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("Invalid JSON body");
  }
}
