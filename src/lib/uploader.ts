// src/lib/uploader.ts
export async function presignUpload(
  presignUrl: string,
  params: { userId: string; file: File }
) {
  const res = await fetch(presignUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: params.userId,
      fileName: params.file.name,
      contentType: params.file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) {
    throw new Error(`Presign failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<{ url: string; fields: Record<string, string> }>;
}

export async function uploadToS3(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress?: (pct: number) => void
) {
  // Use XHR to get progress (fetch has no upload progress)
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`S3 upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}
