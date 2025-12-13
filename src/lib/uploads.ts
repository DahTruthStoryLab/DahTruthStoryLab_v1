// src/lib/uploads.ts
const PRESIGN_URL: string = import.meta.env.VITE_UPLOAD_URL || "";
const VIEW_URL: string =
  (import.meta.env.VITE_API_BASE || "") + "/files/view";

export async function uploadImage(file: File): Promise<{ key: string; viewUrl: string }> {
  if (!PRESIGN_URL) throw new Error("Missing VITE_UPLOAD_URL for image uploads");

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
    throw new Error(`Presign failed: ${presignRes.status} ${msg}`);
  }

  // Read text first so we can log/debug if JSON is weird
  const presignText = await presignRes.text();
  let data: {
    uploadUrl?: string;
    viewUrl?: string;
    fileUrl?: string;
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
  const displayUrl = data.viewUrl || data.fileUrl;
  const key = data.key || "";

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

  // 3) Return key + viewable URL for the UI to display immediately
  return { key, viewUrl: displayUrl };
}

export async function getViewUrl(key: string): Promise<string> {
  if (!VIEW_URL) throw new Error("Missing VITE_API_BASE for view URLs");

  const res = await fetch(`${VIEW_URL}?key=${encodeURIComponent(key)}`);

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`ViewUrl failed: ${res.status} ${msg}`);
  }

  const data = (await res.json()) as { viewUrl?: string };

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
