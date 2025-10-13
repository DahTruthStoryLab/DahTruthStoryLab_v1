import heic2any from "heic2any";

/** Convert a HEIC/HEIF file to a JPEG Blob. */
export async function heicFileToJpegBlob(file, quality = 0.9) {
  const output = await heic2any({ blob: file, toType: "image/jpeg", quality });
  return Array.isArray(output) ? output[0] : output;
}

/** If file is HEIC/HEIF (or looks like it), convert to a JPEG File; else return original. */
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
