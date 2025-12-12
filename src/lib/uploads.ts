// src/lib/uploads.ts

const PRESIGN_URL: string =
  import.meta.env.VITE_UPLOAD_URL || "";
// Example: "https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/dev/presign"

const PRESIGN_URL: string =
  import.meta.env.VITE_UPLOAD_URL || "";

console.log("[uploads] PRESIGN_URL =", PRESIGN_URL);

/**
 * Upload an image file to S3 using a presigned URL from your backend
 * and return the final public URL.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1. Ask your backend (Lambda/API Gateway) for a presigned URL + final file URL
  const presignRes = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      folder: "images", // adjust or remove if your Lambda does not expect this
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to get upload URL");
  }

  const data = await presignRes.json();
  const uploadUrl: string = data.uploadUrl;
  const fileUrl: string = data.fileUrl; // public URL to save in your chapter content

  if (!uploadUrl || !fileUrl) {
    throw new Error("Presign response missing uploadUrl/fileUrl");
  }

  // 2. PUT the file to S3 using the presigned URL
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("Image upload failed");
  }

  // 3. Return the final URL so the editor can insert it into your content
  return fileUrl;
}
