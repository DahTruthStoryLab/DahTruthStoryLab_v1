// src/lib/uploads.js
import { presignUpload, uploadToS3 } from "./uploader";

const PRESIGN_URL = import.meta.env.VITE_UPLOAD_URL || "";

/**
 * Upload an image using your existing presign + S3 POST flow,
 * and return the final public URL for that image.
 *
 * userId is optional here – you can wire it to your auth later.
 */
export async function uploadImage(file, userId = "local-user") {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1. Ask backend for presigned POST data
  const { url, fields } = await presignUpload(PRESIGN_URL, {
    userId,
    file,
  });

  // 2. Upload file to S3 using POST
  await uploadToS3(url, fields, file);

  // 3. Build final file URL
  // For standard S3 POST, "url" is bucket root, and "fields.key" is the object key.
  const key = fields.key || fields.Key;
  const finalUrl = key ? `${url}/${key}` : url;

  return finalUrl;
}
// src/lib/uploads.ts
const PRESIGN_URL: string =
  import.meta.env.VITE_UPLOAD_URL ||
  ""; // e.g. "https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/dev/presign"

/**
 * Upload an image file to S3 and return the final public URL.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1. Ask your backend for a presigned URL
  const presignRes = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      folder: "images", // you can change/remove this depending on your Lambda
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to get upload URL");
  }

  const data = await presignRes.json();
  const uploadUrl = data.uploadUrl;
  const fileUrl = data.fileUrl; // public URL you’ll save in your chapter text

  if (!uploadUrl || !fileUrl) {
    throw new Error("Presign response missing uploadUrl/fileUrl");
  }

  // 2. PUT the file to S3 using the presigned URL
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("Image upload failed");
  }

  // 3. Return the final URL to store in your chapter content
  return fileUrl;
}
