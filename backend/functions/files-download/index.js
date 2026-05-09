import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ok, badRequest, internalError, parseBody, unauthorized } from "../../shared/http.js";
import { requireAuthenticatedUser } from "../../shared/auth.js";

const s3 = new S3Client({});

export async function handler(event) {
  try {
    const user = await requireAuthenticatedUser(event);
    if (!user) {
      return unauthorized();
    }

    const body = parseBody(event);
    const { fileKey } = body;

    if (!fileKey) {
      return badRequest("fileKey is required");
    }

    const bucketName = process.env.UPLOADS_BUCKET_NAME;
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${fileKey.split('/').pop()}"`
    });

    // URL expires in 5 minutes (300 seconds)
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return ok({ downloadUrl });
  } catch (error) {
    console.error("Presigned download error:", error);
    return internalError(error.message);
  }
}
