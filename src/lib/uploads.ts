// src/lib/uploads.ts

// Single source of truth for your presign endpoint
const PRESIGN_URL: string = import.meta.env.VITE_UPLOAD_URL || "";

// Helpful in the browser console to confirm what the app is using
console.log("[uploads] PRESIGN_URL =", PRESIGN_URL);

/**
 * Upload an image file to S3 using a presigned URL from your backend
 * and return a VIEWABLE URL for immediate preview.
 *
 * Supports BOTH backend responses:
 *   - { uploadUrl, viewUrl, key }  ✅ preferred (private bucket)
 *   - { uploadUrl, fileUrl, key }  ✅ legacy/public style
 */
export async function uploadImage(file: File): Promise<string> {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1) Ask backend for presigned PUT + view URL
  const presignRes = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      folder: "images",
    }),
  });

  if (!presignRes.ok) {
    const msg = await safeText(presignRes);
    throw new Error(`Failed to get upload URL: ${presignRes.status} ${msg}`);
  }

  // Read text first so we can log/debug if JSON is weird
  const presignText = await presignRes.text();

  let data: {
    uploadUrl?: string;
    viewUrl?: string; // ✅ signed GET (private bucket)
    fileUrl?: string; // ✅ legacy/public style
    key?: string;
  } = {};

  try {
    data = JSON.parse(presignText);
  } catch {
    console.error("[uploads] presign returned non-JSON:", presignText);
    throw new Error("Presign returned non-JSON response");
  }

  console.log("[uploads] presign response =", data);

  const uploadUrl = data.uploadUrl;
  const displayUrl = data.viewUrl || data.fileUrl; // ✅ fallback

  if (!uploadUrl || !displayUrl) {
    throw new Error("Presign response missing uploadUrl and/or display URL (viewUrl/fileUrl)");
  }

  // 2) PUT the file to S3 using the presigned URL
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    const msg = await safeText(putRes);
    throw new Error(`Image upload failed: ${putRes.status} ${msg}`);
  }

  // 3) Return the VIEWABLE URL for the UI to display immediately
  return displayUrl;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
