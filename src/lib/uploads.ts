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
