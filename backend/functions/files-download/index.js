import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  badRequest,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";

const s3 = new S3Client({});

export async function handler(event) {
  try {
    await requireAuthenticatedUser(event);
    const body = parseBody(event);
    const fileKey = String(body.fileKey || "").trim();
    const bucket = process.env.UPLOADS_BUCKET_NAME;

    if (!bucket) {
      return internalError("UPLOADS_BUCKET_NAME is not configured");
    }
    if (!fileKey) {
      return badRequest("fileKey is required");
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    return ok({
      downloadUrl: await getSignedUrl(s3, command, { expiresIn: 300 }),
    });
  } catch (error) {
    if (error?.message === "Unauthorized") return unauthorized();
    return internalError(
      error instanceof Error ? error.message : "Failed to create download URL"
    );
  }
}
