// src/utils/documentParser.ts
import mammoth from "mammoth";

export interface ChapterCard {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  preview: string;
  wordCount: number;
  order: number;
}

export interface ParsedDocument {
  title: string;
  chapters: ChapterCard[];
  tableOfContents: Array<{ title: string; id: string; order: number }>;
  fullContent: string;
  totalWordCount: number;
}

// 🔹 Normalize any StoryLab character spans back to @char: tags
function normalizeCharacterTags(html: string): string {
  if (!html) return "";
  return html.replace(
    /<span class="dt-character-tag"[^>]*>@char:\s*([A-Za-z0-9 .'-]+)<\/span>/gi,
    "@char: $1"
  );
}

class DocumentParser {
  // Chapter detection patterns (used as FALLBACK for non-h1 elements)
  private chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^CHAPTER\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^(\d+)\.\s+(.*?)$/im,
    /^Part\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^Section\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^SECTION\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
  ];

  // 🔹 Generate a truly unique ID for each chapter
  private makeChapterId(chapterNumber: number, order: number): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return (crypto as any).randomUUID();
    }
    return `chapter-${chapterNumber}-${order}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  async parseWordDocument(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert Word doc to HTML with mammoth
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            // Also map common variations
            "p[style-name='heading 1'] => h1:fresh",
            "p[style-name='Heading1'] => h1:fresh",
          ],
          includeDefaultStyleMap: true,
        }
      );

      const html = result.value;
      const messages = result.messages;

      if (messages.length > 0) {
        console.warn("Document conversion warnings:", messages);
      }

      return this.parseHTMLContent(html, file.name);
    } catch (error) {
      console.error("Error parsing Word document:", error);
      throw new Error(
        `Failed to parse document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private parseHTMLContent(html: string, filename: string): ParsedDocument {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract document title (first h1.title or first h1)
    const titleElement = doc.querySelector("h1.title") || doc.querySelector("h1");
    const documentTitle =
      titleElement?.textContent?.trim() ||
      filename.replace(/\.(docx|doc)$/i, "");

    // 🔹 FIXED: Get ALL h1 elements as chapter headings (trust the Word styling!)
    const h1Elements = Array.from(doc.querySelectorAll("h1")).filter(
      (el) => !el.classList.contains("title") // Skip the document title
    );

    // Also check for pattern-based headings in other elements (fallback)
    const patternHeadings = Array.from(
      doc.querySelectorAll("h2, p strong, p b")
    )
      .map((el) => ({
        element: el,
        text: el.textContent?.trim() || "",
      }))
      .filter((h) => this.isChapterHeading(h.text));

    // Combine: prioritize h1 elements, then pattern-based
    const headings: Array<{ element: Element; text: string }> = [];

    // Add all h1 elements (these ARE chapter headings - user styled them that way)
    h1Elements.forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (text && text !== documentTitle) {
        headings.push({ element: el, text });
      }
    });

    // If no h1 elements found, use pattern-based detection
    if (headings.length === 0 && patternHeadings.length > 0) {
      headings.push(...patternHeadings);
    }

    // Sort headings by their position in the document
    headings.sort((a, b) => {
      const position = a.element.compareDocumentPosition(b.element);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    const chapters: ChapterCard[] = [];
    const tableOfContents: Array<{ title: string; id: string; order: number }> = [];

    if (headings.length === 0) {
      // No chapter headings found, treat entire document as one chapter
      const fullText = doc.body.textContent || "";
      const normalizedHtml = normalizeCharacterTags(html);

      const chapter = this.createChapterCard(
        1,
        documentTitle,
        normalizedHtml,
        fullText,
        0
      );
      chapters.push(chapter);
      tableOfContents.push({
        title: chapter.title,
        id: chapter.id,
        order: 0,
      });
    } else {
      // 🔹 Check if there's content BEFORE the first heading (prologue/intro)
      const firstHeading = headings[0].element;
      const preContent = this.extractContentBefore(doc.body, firstHeading);
      
      if (preContent.text.trim().length > 100) {
        // There's substantial content before the first chapter
        const chapter = this.createChapterCard(
          0,
          "Prologue",
          normalizeCharacterTags(preContent.html),
          preContent.text,
          0
        );
        chapters.push(chapter);
        tableOfContents.push({
          title: chapter.title,
          id: chapter.id,
          order: 0,
        });
      }

      // Extract content between chapter headings
      headings.forEach((heading, index) => {
        const chapterTitle = this.cleanChapterTitle(heading.text);
        const chapterContent = this.extractChapterContent(
          doc.body,
          heading.element,
          headings[index + 1]?.element
        );

        const normalizedChapterHtml = normalizeCharacterTags(chapterContent.html);

        const chapter = this.createChapterCard(
          chapters.length + 1,
          chapterTitle,
          normalizedChapterHtml,
          chapterContent.text,
          chapters.length
        );

        chapters.push(chapter);
        tableOfContents.push({
          title: chapter.title,
          id: chapter.id,
          order: chapters.length - 1,
        });
      });
    }

    const fullContent = normalizeCharacterTags(doc.body.innerHTML);
    const totalWordCount = this.countWords(doc.body.textContent || "");

    console.log(`[DocumentParser] Parsed "${documentTitle}": ${chapters.length} chapters, ${totalWordCount} words`);

    return {
      title: documentTitle,
      chapters,
      tableOfContents,
      fullContent,
      totalWordCount,
    };
  }

  // 🔹 Extract content BEFORE a given element
  private extractContentBefore(
    body: HTMLElement,
    beforeElement: Element
  ): { html: string; text: string } {
    const content: Element[] = [];
    let current: Element | null = body.firstElementChild;

    while (current && current !== beforeElement) {
      // Skip if it's a title h1
      if (!(current.tagName === "H1" && current.classList.contains("title"))) {
        content.push(current);
      }
      current = current.nextElementSibling;
    }

    const html = content.map((el) => el.outerHTML).join("\n");
    const text = content.map((el) => el.textContent?.trim() || "").join("\n");

    return { html, text };
  }

  private isChapterHeading(text: string): boolean {
    return this.chapterPatterns.some((pattern) => pattern.test(text));
  }

  // 🔹 Clean up chapter title (remove "Chapter X:" prefix if it's redundant)
  private cleanChapterTitle(headingText: string): string {
    // First try to extract from pattern
    for (const pattern of this.chapterPatterns) {
      const match = headingText.match(pattern);
      if (match) {
        const number = match[1];
        const title = match[2]?.trim() || "";
        return title ? `Chapter ${number}: ${title}` : `Chapter ${number}`;
      }
    }
    // Otherwise just use the heading text as-is (for Heading 1 styled titles)
    return headingText.trim();
  }

  private extractChapterContent(
    body: HTMLElement,
    startElement: Element,
    endElement?: Element
  ): { html: string; text: string } {
    const content: Element[] = [];
    let current: Element | null = startElement.nextElementSibling;

    while (current && current !== endElement) {
      content.push(current);
      current = current.nextElementSibling;
    }

    const html = content.map((el) => el.outerHTML).join("\n");
    const text = content.map((el) => el.textContent?.trim() || "").join("\n");

    return { html, text };
  }

  private createChapterCard(
    chapterNumber: number,
    title: string,
    htmlContent: string,
    textContent: string,
    order: number
  ): ChapterCard {
    const words = textContent.split(/\s+/).filter((w) => w.length > 0);
    const preview =
      words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");

    return {
      id: this.makeChapterId(chapterNumber, order),
      chapterNumber,
      title,
      content: htmlContent,
      preview,
      wordCount: words.length,
      order,
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  // Parse plain text documents
  async parseTextDocument(file: File): Promise<ParsedDocument> {
    try {
      const text = await file.text();
      const lines = text.split("\n");

      const chapters: ChapterCard[] = [];
      const tableOfContents: Array<{ title: string; id: string; order: number }> = [];

      let currentChapter: { title: string; content: string[]; number: number } | null = null;
      let chapterNumber = 0;

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        if (this.isChapterHeading(trimmedLine)) {
          // Save previous chapter
          if (currentChapter && currentChapter.content.length > 0) {
            const chapter = this.createChapterFromText(
              currentChapter.number,
              currentChapter.title,
              currentChapter.content.join("\n"),
              chapters.length
            );
            chapters.push(chapter);
            tableOfContents.push({
              title: chapter.title,
              id: chapter.id,
              order: chapters.length - 1,
            });
          }

          // Start new chapter
          chapterNumber++;
          currentChapter = {
            title: this.cleanChapterTitle(trimmedLine),
            content: [],
            number: chapterNumber,
          };
        } else if (currentChapter) {
          currentChapter.content.push(line);
        } else if (trimmedLine) {
          // Content before first chapter heading
          if (chapterNumber === 0) {
            chapterNumber = 1;
            currentChapter = {
              title: file.name.replace(/\.(txt|md)$/i, ""),
              content: [line],
              number: 1,
            };
          }
        }
      });

      // Save last chapter
      if (currentChapter && currentChapter.content.length > 0) {
        const chapter = this.createChapterFromText(
          currentChapter.number,
          currentChapter.title,
          currentChapter.content.join("\n"),
          chapters.length
        );
        chapters.push(chapter);
        tableOfContents.push({
          title: chapter.title,
          id: chapter.id,
          order: chapters.length - 1,
        });
      }

      // If no chapters were created, create one from the whole document
      if (chapters.length === 0) {
        const chapter = this.createChapterFromText(
          1,
          file.name.replace(/\.(txt|md)$/i, ""),
          text,
          0
        );
        chapters.push(chapter);
        tableOfContents.push({
          title: chapter.title,
          id: chapter.id,
          order: 0,
        });
      }

      return {
        title: file.name.replace(/\.(txt|md)$/i, ""),
        chapters,
        tableOfContents,
        fullContent: text,
        totalWordCount: this.countWords(text),
      };
    } catch (error) {
      console.error("Error parsing text document:", error);
      throw new Error(
        `Failed to parse text document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private createChapterFromText(
    chapterNumber: number,
    title: string,
    content: string,
    order: number
  ): ChapterCard {
    // Convert plain text to HTML with proper paragraph breaks
    const paragraphs = content
      .split(/\n\s*\n/) // Split on blank lines
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const htmlContent = paragraphs
      .map((p) => `<p>${this.escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("\n");

    return this.createChapterCard(
      chapterNumber,
      title,
      htmlContent,
      content,
      order
    );
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

export const documentParser = new DocumentParser();












