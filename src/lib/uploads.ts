// src/lib/uploads.ts

const PRESIGN_URL: string = import.meta.env.VITE_UPLOAD_URL || "";

/** Build a stable API base (usually ends with /dev) */
const API_BASE: string = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/** Your backend endpoint that returns a fresh signed GET url for an existing key */
const VIEW_URL: string = API_BASE ? `${API_BASE}/files/view` : "";

/**
 * Upload an image file to S3 using a presigned URL from your backend.
 * Returns:
 *  - key: the S3 object key to persist (localStorage / DB)
 *  - viewUrl: a signed GET URL for immediate preview (expires)
 */
export async function uploadImage(
  file: File
): Promise<{ key: string; viewUrl: string }> {
  if (!PRESIGN_URL) throw new Error("Missing VITE_UPLOAD_URL for image uploads");

  // 1) Ask backend for presigned PUT + (optionally) viewUrl + key
  const presignRes = await fetch(PRESIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      folder: "images",
    }),
  });

  const presignText = await presignRes.text();

  if (!presignRes.ok) {
    throw new Error(`Presign failed: ${presignRes.status} ${presignText}`);
  }

  let data: {
    uploadUrl?: string;
    viewUrl?: string;
    fileUrl?: string;
    key?: string;
  };

  try {
    data = JSON.parse(presignText);
  } catch {
    console.error("[uploads] presign returned non-JSON:", presignText);
    throw new Error("Presign returned non-JSON response");
  }

  console.log("[uploads] presign response =", data);

  const uploadUrl = data.uploadUrl;
  const viewUrl = data.viewUrl || data.fileUrl;
  const key = data.key;

  // IMPORTANT: key must exist if we want persistence across reloads
  if (!key) {
    throw new Error("Presign response missing key (required for persistence)");
  }

  if (!uploadUrl || !viewUrl) {
    throw new Error(
      "Presign response missing uploadUrl and/or viewUrl (or fileUrl)"
    );
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

  // 3) Return key + viewUrl for immediate preview (viewUrl expires later)
  return { key, viewUrl };
}

/**
 * Fetch a fresh signed GET url for an existing object key.
 * This is how you keep reads PRIVATE but still reload the image later.
 */
export async function getViewUrl(key: string): Promise<string> {
  if (!VIEW_URL) throw new Error("Missing VITE_API_BASE for view URLs");
  if (!key) throw new Error("Missing key for view URL request");

  // If your API uses CORS/auth later, you may need headers or credentials here.
  const res = await fetch(`${VIEW_URL}?key=${encodeURIComponent(key)}`);

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`ViewUrl failed: ${res.status} ${text}`);
  }

  let data: { viewUrl?: string };
  try {
    data = JSON.parse(text);
  } catch {
    console.error("[uploads] view returned non-JSON:", text);
    throw new Error("ViewUrl returned non-JSON response");
  }

  if (!data.viewUrl) throw new Error("No viewUrl returned");

  return data.viewUrl;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
