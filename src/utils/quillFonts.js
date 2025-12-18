src/utils/quillFonts.js
// src/utils/quillFonts.js
// Import this file ONCE in your App.jsx or index.js

import ReactQuill from "react-quill";

// Get Quill from ReactQuill
const Quill = ReactQuill.Quill;

// Get the Font format
const Font = Quill.import("formats/font");

// Add custom fonts to whitelist
Font.whitelist = [
  false,           // default (sans-serif)
  "serif",
  "monospace", 
  "arial",
  "times-new-roman",
  "georgia",
  "verdana",
  "courier"
];

// Register the extended Font format
Quill.register(Font, true);

// Also extend Size if you want more options
const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

export default Quill;
