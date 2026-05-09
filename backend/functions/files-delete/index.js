import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    // 1. Verify authenticated user
    await requireAuthenticatedUser(event);
    
    // 2. Get fileKey from body or path
    const body = parseBody(event);
    const fileKey = body.fileKey || event.pathParameters?.fileKey;

    if (!fileKey) {
      return badRequest("fileKey is required");
    }

    const bucketName = process.env.UPLOADS_BUCKET_NAME;

    // 3. Delete from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
    );
    
    return ok({ message: "File deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
