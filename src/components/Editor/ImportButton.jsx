// src/components/Editor/ImportButton.jsx
// Simplified - passes File object to ComposePage for processing
import React, { useRef } from "react";
import { Upload } from "lucide-react";

export default function ImportButton({ onImport, aiBusy }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // Check file type
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Pass the File object directly to ComposePage for processing
      console.log("Starting import of:", file.name);
      
      // Ask if they want to split into chapters
      const shouldSplit = window.confirm(
        "Would you like to split this document into separate chapters?\n\n" +
        "Click OK to create separate chapters, or Cancel to import as one chapter."
      );
      
      // Pass File object (not HTML) to ComposePage
      onImport(file, shouldSplit);
      
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      // For HTML files, read as text
      const text = await file.text();
      const shouldSplit = window.confirm(
        "Would you like to split this document into separate chapters?"
      );
      onImport(text, shouldSplit);
      
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Pass text files as File objects too
      const shouldSplit = window.confirm(
        "Would you like to split this document into separate chapters?"
      );
      onImport(file, shouldSplit);
      
    } else {
      alert("Please choose a .docx, .doc, .txt, .md, or .html file.");
      e.target.value = "";
      return;
    }

    // Reset input
    e.target.value = "";
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
        accept=".docx,.doc,.txt,.md,.html,.htm"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
