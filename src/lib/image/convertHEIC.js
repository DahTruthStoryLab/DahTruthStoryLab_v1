import heic2any from "heic2any";

export async function heicFileToJpegBlob(file, quality = 0.9) {
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality });
  return Array.isArray(out) ? out[0] : out;
}

export async function ensureJpegFile(file, quality = 0.9) {
  const name = file.name || "";
  const type = file.type || "";

  const looksHeic =
    /heic|heif/i.test(type) ||
    /\.heic$/i.test(name) ||
    /\.heif$/i.test(name) ||
    (type === "application/octet-stream" && /\.heic$/i.test(name));

  if (!looksHeic) return file;

  const jpegBlob = await heicFileToJpegBlob(file, quality);
  const newName = name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([jpegBlob], newName, { type: "image/jpeg" });
}
