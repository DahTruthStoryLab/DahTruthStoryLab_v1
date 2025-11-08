// src/utils/textFormatting.js
// Utilities for converting between HTML and plain text

/**
 * Convert HTML to plain text
 */
export const htmlToPlain = (html = "") => {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Convert plain text to HTML with proper paragraph handling
 * Preserves paragraph breaks and line breaks
 */
export const plainToSimpleHtml = (text = "") => {
  if (!text) return "";

  // Split by double line breaks OR single line breaks followed by capital letter
  let paragraphs = text.split(/\n\n+/);

  // If we only have one "paragraph" but the text has single newlines,
  // try splitting on those too (common AI response pattern)
  if (paragraphs.length === 1 && text.includes("\n")) {
    // Split on single newlines that are followed by a capital letter or number
    paragraphs = text.split(/\n(?=[A-Z0-9])/);
  }

  // Convert each paragraph to HTML
  const htmlParagraphs = paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      // Within each paragraph, convert single newlines to <br/>
      const withBreaks = p.replace(/\n/g, "<br/>");
      return `<p>${withBreaks}</p>`;
    })
    .join("");

  return htmlParagraphs || `<p>${text}</p>`;
};

/**
 * Count words in HTML content
 */
export const countWords = (html = "") => {
  const text = htmlToPlain(html);
  return text ? text.split(/\s+/).length : 0;
};

/**
 * Truncate text to a certain length
 */
export const truncateText = (text, maxLength = 180) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

/**
 * Strip HTML and truncate for previews
 */
export const getPreviewText = (html, maxLength = 180) => {
  const plain = htmlToPlain(html);
  return truncateText(plain, maxLength);
};
