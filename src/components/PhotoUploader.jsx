import React from "react";
import { ensureJpegFile } from "../lib/image/convertHeic";
import { resizeImageBlob } from "../lib/image/resizeImage";
// If you’ll upload to Amplify Storage, import and wire it here:
// import { Storage } from "aws-amplify";

export default function PhotoUploader({ onUploaded }) {
  const [items, setItems] = React.useState([]); // {name, url, file}[]
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  async function handleFiles(fileList) {
    setBusy(true);
    const files = Array.from(fileList);
    const processed = [];

    for (const f of files) {
      try {
        // 1) HEIC → JPEG if needed
        const jpegFile = await ensureJpegFile(f, 0.9);

        // 2) Optional: downsize if > 5MB
        let finalFile = jpegFile;
        if (jpegFile.size > 5 * 1024 * 1024) {
          const resized = await resizeImageBlob(jpegFile, 2000, 2000, 0.88);
          finalFile = new File([resized], jpegFile.name.replace(/\.png$/i, ".jpg"), { type: "image/jpeg" });
        }

        const url = URL.createObjectURL(finalFile);
        processed.push({ name: finalFile.name, url, file: finalFile });
      } catch (e) {
        console.error("Image process failed:", e);
      }
    }

    setItems((prev) => [...prev, ...processed]);
    setBusy(false);
  }

  async function doUpload() {
    setBusy(true);
    try {
      // TODO: Upload to your backend or Amplify Storage here.
      // on success:
      onUploaded?.(items.map((it) => it.file));
      alert("Upload complete (stub). Wire this to your backend/Storage.");
    } catch (e) {
      console.error(e);
      alert("Upload failed. Check console.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          className="px-4 py-2 rounded-lg border border-border bg-white hover:shadow"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Processing…" : "Select Photos"}
        </button>
        <span className="text-sm text-muted">iPhone photos supported (HEIC → JPEG)</span>
      </div>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {items.map((it, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border bg-white">
                <img src={it.url} alt={it.name} className="w-full h-40 object-cover" />
                <div className="p-2 text-xs truncate">{it.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={doUpload}
              className="px-4 py-2 rounded-lg bg-brand-navy text-white hover:opacity-90"
              disabled={busy}
            >
              Upload
            </button>
            <button
              onClick={() => setItems([])}
              className="px-4 py-2 rounded-lg bg-white border border-border hover:bg-white/80"
              disabled={busy}
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
