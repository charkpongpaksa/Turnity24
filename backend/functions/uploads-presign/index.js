import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { badRequest, internalError, ok, parseBody } from "../../shared/http.js";

const s3 = new S3Client({});

export async function handler(event) {
  try {
    const body = parseBody(event);
    const fileName = String(body.fileName || body.filename || "").trim();
    const contentType = String(body.contentType || "application/octet-stream").trim();
    const bucket = process.env.UPLOADS_BUCKET_NAME;

    if (!bucket) {
      return internalError("UPLOADS_BUCKET_NAME is not configured");
    }
    if (!fileName) {
      return badRequest("fileName is required");
    }

    const fileKey = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return ok({
      uploadUrl,
      fileKey,
      publicUrl: "",
    });
  } catch (error) {
    return internalError(
      error instanceof Error ? error.message : "Failed to create upload URL"
    );
  }
}
