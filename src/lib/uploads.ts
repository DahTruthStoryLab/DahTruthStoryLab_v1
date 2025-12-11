// src/lib/uploads.ts
import { presignUpload, uploadToS3 } from "./uploader";

const PRESIGN_URL: string =
  import.meta.env.VITE_UPLOAD_URL || "";
// Example: "https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/dev/presign"

/**
 * Upload an image file using your existing presign + S3 POST flow
 * and return the final public URL that you can store in your content.
 *
 * userId is optional for now; later you can wire it to Cognito.
 */
export async function uploadImage(
  file: File,
  userId: string = "local-user"
): Promise<string> {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1️⃣ Ask backend for presigned POST data
  //    This should return something like: { url, fields }
  const { url, fields } = await presignUpload(PRESIGN_URL, {
    userId,
    file,
  });

  // 2️⃣ Upload file to S3 using POST
  await uploadToS3(url, fields, file);

  // 3️⃣ Build the final public URL
  const key = (fields as any).key || (fields as any).Key;
  const finalUrl = key ? `${url}/${key}` : url;

  if (!finalUrl) {
    throw new Error("No final URL returned from upload");
  }

  return finalUrl;
}
