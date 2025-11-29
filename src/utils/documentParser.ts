// src/lib/documentParser.ts
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
  // Chapter detection patterns
  private chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^CHAPTER\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
    /^(\d+)\.\s+(.*?)$/im,
    /^Part\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*?)$/im,
  ];

  class DocumentParser {
  // 🔹 Generate a truly unique ID for each chapter
  private makeChapterId(chapterNumber: number, order: number): string {
    // Use crypto.randomUUID when available
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return (crypto as any).randomUUID();
    }
    // Fallback: timestamp + chapter info + random segment
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
          ],
          includeDefaultStyleMap: true,
        }
      );

      const html = result.value;
      const messages = result.messages;

      // Log any conversion issues
      if (messages.length > 0) {
        console.warn("Document conversion warnings:", messages);
      }

      // Parse HTML to extract chapters
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
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract document title
    const titleElement = doc.querySelector("h1.title, h1");
    const documentTitle =
      titleElement?.textContent?.trim() ||
      filename.replace(/\.(docx|doc)$/i, "");

    // Find all potential chapter headings
    const headings = Array.from(
      doc.querySelectorAll("h1, h2, p strong, p b")
    )
      .map((el) => ({
        element: el,
        text: el.textContent?.trim() || "",
      }))
      .filter((h) => this.isChapterHeading(h.text));

    const chapters: ChapterCard[] = [];
    const tableOfContents: Array<{ title: string; id: string; order: number }> =
      [];

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
      // Extract content between chapter headings
      let currentChapterNum = 1;

      headings.forEach((heading, index) => {
        const chapterTitle = this.extractChapterTitle(heading.text);
        const chapterContent = this.extractChapterContent(
          doc.body,
          heading.element,
          headings[index + 1]?.element
        );

        // Normalize any existing StoryLab spans back to @char tags
        const normalizedChapterHtml = normalizeCharacterTags(
          chapterContent.html
        );

        const chapter = this.createChapterCard(
          currentChapterNum,
          chapterTitle,
          normalizedChapterHtml,
          chapterContent.text,
          index
        );

        chapters.push(chapter);
        tableOfContents.push({
          title: chapter.title,
          id: chapter.id,
          order: index,
        });

        currentChapterNum++;
      });
    }

    // Full document content (normalized)
    const fullContent = normalizeCharacterTags(doc.body.innerHTML);
    const totalWordCount = this.countWords(doc.body.textContent || "");

    return {
      title: documentTitle,
      chapters,
      tableOfContents,
      fullContent,
      totalWordCount,
    };
  }

  private isChapterHeading(text: string): boolean {
    return this.chapterPatterns.some((pattern) => pattern.test(text));
  }

  private extractChapterTitle(headingText: string): string {
    for (const pattern of this.chapterPatterns) {
      const match = headingText.match(pattern);
      if (match) {
        const number = match[1];
        const title = match[2]?.trim() || "";
        return title ? `Chapter ${number}: ${title}` : `Chapter ${number}`;
      }
    }
    return headingText;
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
      words.slice(0, 20).join(" ") + (words.length > 20 ? "..." : "");

    return {
      id: `chapter-${chapterNumber}-${Date.now()}`,
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
      const tableOfContents: Array<{ title: string; id: string; order: number }> =
        [];

      let currentChapter:
        | { title: string; content: string[]; number: number }
        | null = null;
      let chapterNumber = 0;

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        if (this.isChapterHeading(trimmedLine)) {
          // Save previous chapter
          if (currentChapter) {
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
            title: this.extractChapterTitle(trimmedLine),
            content: [],
            number: chapterNumber,
          };
        } else if (currentChapter && trimmedLine) {
          currentChapter.content.push(line);
        } else if (!currentChapter && trimmedLine) {
          // Content before first chapter
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
      if (currentChapter) {
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

  private createChapterCard(
  chapterNumber: number,
  title: string,
  htmlContent: string,
  textContent: string,
  order: number
): ChapterCard {
  const words = textContent.split(/\s+/).filter((w) => w.length > 0);
  const preview =
    words.slice(0, 20).join(" ") + (words.length > 20 ? "..." : "");

  return {
    id: this.makeChapterId(chapterNumber, order), // 🔹 UNIQUE ID
    chapterNumber,
    title,
    content: htmlContent,
    preview,
    wordCount: words.length,
    order,
  };
}

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

export const documentParser = new DocumentParser();
