import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  badRequest,
  internalError,
  ok,
  parseBody,
  unauthorized,
} from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";
import { updateUserProfile } from "../../shared/users.js";

const s3 = new S3Client({});

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    const body = parseBody(event);
    
    const fileName = String(body.fileName || body.filename || "avatar.png").trim();
    const contentType = String(body.contentType || "image/png").trim();
    const bucket = process.env.UPLOADS_BUCKET_NAME;

    if (!bucket) {
      return internalError("UPLOADS_BUCKET_NAME is not configured");
    }

    // Use avatars/ prefix and userId to keep it organized
    const fileKey = `avatars/${user.userId}-${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    await updateUserProfile(user.userId, { avatarUrl: fileKey });

    // The avatarUrl for the public (if using CloudFront CDN) or just the s3 key
    // For now, we return the fileKey and the frontend can update profile with it
    return ok({
      uploadUrl,
      fileKey,
      avatarUrl: fileKey // Frontend will handle prepending base URL if needed
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create avatar upload URL";
    if (message === "Unauthorized") return unauthorized(message);
    return internalError(message);
  }
}
