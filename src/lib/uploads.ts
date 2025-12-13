// src/lib/uploads.ts

// Single source of truth for your presign endpoint
const PRESIGN_URL: string = import.meta.env.VITE_UPLOAD_URL || "";

// Helpful in the browser console to confirm what the app is using
console.log("[uploads] PRESIGN_URL =", PRESIGN_URL);

/**
 * Upload an image file to S3 using a presigned URL from your backend
 * and return a VIEWABLE URL (signed GET) for immediate preview.
 *
 * NOTE: This assumes your Lambda now returns:
 *   { uploadUrl, viewUrl, key }
 */
export async function uploadImage(file: File): Promise<string> {
  if (!PRESIGN_URL) {
    throw new Error("Missing VITE_UPLOAD_URL for image uploads");
  }

  // 1) Ask backend for presigned PUT + signed GET (viewUrl)
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

  const data = (await presignRes.json()) as {
    uploadUrl?: string;
    viewUrl?: string; // ✅ signed GET for preview
    key?: string;
    fileUrl?: string; // optional legacy
  };

  const uploadUrl = data.uploadUrl;
  const viewUrl = data.viewUrl;

  if (!uploadUrl || !viewUrl) {
    throw new Error("Presign response missing uploadUrl/viewUrl");
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
  return viewUrl;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
