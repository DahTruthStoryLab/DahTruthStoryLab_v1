// src/components/Editor/ImportButton.jsx
// Word document import with Mammoth.js and chapter detection

import React, { useRef } from "react";
import { Upload } from "lucide-react";
import mammoth from "mammoth";

export default function ImportButton({ onImport, aiBusy }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".docx")) {
      alert("Please choose a .docx file (not .doc or other formats).");
      e.target.value = "";
      return;
    }

    console.log("Starting import of:", file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log("File read, size:", arrayBuffer.byteLength, "bytes");

      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1:fresh",
          ],
          includeDefaultStyleMap: true,
        }
      );

      const htmlContent = result.value;
      console.log("Conversion complete, HTML length:", htmlContent.length);

      const hasHeadings = /<h[123]>/i.test(htmlContent);

      if (hasHeadings) {
        const shouldSplit = window.confirm(
          "This document contains headings. Would you like to split it into separate chapters?\n\n" +
            "Click OK to create separate chapters, or Cancel to import as one chapter."
        );

        onImport(htmlContent, shouldSplit);
      } else {
        onImport(htmlContent, false);
      }

      alert("Document imported successfully!");
    } catch (err) {
      console.error("Import error:", err);
      alert(`Failed to import document: ${err.message}\n\nPlease make sure this is a valid .docx file.`);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        title="Import Word Document"
        disabled={aiBusy}
      >
        <Upload size={16} /> {aiBusy ? "Importing..." : "Import"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
