// src/pages/Publishing.tsx
// Cleaner layout: wide editor + left tool sidebar
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import {
  runGrammar,
  runStyle,
  runReadability,
  runPublishingPrep,
  runAssistant,
  generateSynopsis,
} from "../lib/api";

/* ---------- Theme via CSS variables (from your brand.css) ---------- */
const theme = {
  bg: "var(--brand-bg)",
  surface: "var(--brand-surface, var(--brand-white))",
  border: "var(--brand-border)",
  borderStrong: "var(--brand-border-strong)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  primary: "var(--brand-primary)",
  white: "var(--brand-white)",
  gold: "var(--brand-gold)",
} as const;

const STORAGE_KEY = "dahtruth_chapters";
const META_KEY = "dahtruth_project_meta";

// Publishing-specific keys
const PUBLISHING_DRAFT_KEY = "dt_publishing_draft";
const PUBLISHING_CHAPTERS_KEY = "dt_publishing_chapters";
const PUBLISHING_MATTER_KEY = "dt_publishing_matter";
const PUBLISHING_META_KEY = "dt_publishing_meta";

const GOOGLE_PALETTE = {
  primary: "#1a73e8",
  accent: "#34a853",
  highlight: "rgba(26,115,232,0.10)",
} as const;

/* ---------- Types ---------- */

type Chapter = {
  id: string;
  title: string;
  included: boolean;
  text: string;
  textHTML?: string;
};

type Matter = {
  titlePage: string;
  copyright: string;
  dedication: string;
  epigraph: string;
  toc: boolean;
  acknowledgments: string;
  aboutAuthor: string;
  notes: string;
  tocFromHeadings?: boolean;
};

type Meta = {
  title: string;
  author: string;
  year: string;
  authorLast?: string;
};

type ManuscriptPresetKey =
  | "Agents_Standard_12pt_TNR_Double"
  | "Nonfiction_Chicago_12pt_TNR_1p5"
  | "Screenplay_Basic_Courier_12pt"
  | "Poetry_Minimal_12pt_Serif";

type PlatformPresetKey =
  | "KDP_Paperback_5x8"
  | "KDP_Paperback_5_25x8"
  | "KDP_Paperback_5_5x8_5"
  | "KDP_Paperback_6x9"
  | "KDP_Paperback_7x10"
  | "KDP_Paperback_8x10"
  | "KDP_Ebook"
  | "Generic_Manuscript_Submission";

type ChapterGroup = {
  title: string;
  content: string[];
};

/* ---------- Presets ---------- */

const MANUSCRIPT_PRESETS: Record<
  ManuscriptPresetKey,
  {
    label: string;
    fontFamily: string;
    fontSizePt: number;
    lineHeight: number;
    firstLineIndentInches: number;
    paragraphSpacingPt: number;
    align: "left" | "justify";
    chapterTitleCase: "UPPER" | "Capitalize" | "AsIs";
    chapterStartsOnNewPage: boolean;
  }
> = {
  Agents_Standard_12pt_TNR_Double: {
    label: "Agents: Standard (TNR 12, Double)",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineHeight: 2.0,
    firstLineIndentInches: 0.5,
    paragraphSpacingPt: 0,
    align: "left",
    chapterTitleCase: "UPPER",
    chapterStartsOnNewPage: true,
  },
  Nonfiction_Chicago_12pt_TNR_1p5: {
    label: "Nonfiction (Chicago-ish)",
    fontFamily: "Times New Roman",
    fontSizePt: 12,
    lineHeight: 1.5,
    firstLineIndentInches: 0.5,
    paragraphSpacingPt: 6,
    align: "left",
    chapterTitleCase: "Capitalize",
    chapterStartsOnNewPage: true,
  },
  Screenplay_Basic_Courier_12pt: {
    label: "Screenplay (Courier 12)",
    fontFamily: "Courier New",
    fontSizePt: 12,
    lineHeight: 1.0,
    firstLineIndentInches: 0,
    paragraphSpacingPt: 0,
    align: "left",
    chapterTitleCase: "AsIs",
    chapterStartsOnNewPage: true,
  },
  Poetry_Minimal_12pt_Serif: {
    label: "Poetry (Minimal Serif)",
    fontFamily:
      "Georgia, 'Times New Roman', serif",
    fontSizePt: 12,
    lineHeight: 1.5,
    firstLineIndentInches: 0,
    paragraphSpacingPt: 0,
    align: "left",
    chapterTitleCase: "AsIs",
    chapterStartsOnNewPage: true,
  },
};

const PLATFORM_PRESETS: Record<
  PlatformPresetKey,
  {
    label: string;
    trim?: { widthInch: number; heightInch: number } | null;
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
      gutter?: number;
    };
    headers: boolean;
    footers: boolean;
    pageNumbers: boolean;
    showTOCInEbook: boolean;
  }
> = {
  KDP_Paperback_5x8: {
    label: "KDP Paperback – 5 x 8 in",
    trim: { widthInch: 5, heightInch: 8 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_5_25x8: {
    label: "KDP Paperback – 5.25 x 8 in",
    trim: { widthInch: 5.25, heightInch: 8 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_5_5x8_5: {
    label: "KDP Paperback – 5.5 x 8.5 in",
    trim: { widthInch: 5.5, heightInch: 8.5 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_6x9: {
    label: "KDP Paperback – 6 x 9 in",
    trim: { widthInch: 6, heightInch: 9 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_7x10: {
    label: "KDP Paperback – 7 x 10 in",
    trim: { widthInch: 7, heightInch: 10 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEebook: false as any,
    showTOCInEbook: false,
  },
  KDP_Paperback_8x10: {
    label: "KDP Paperback – 8 x 10 in",
    trim: { widthInch: 8, heightInch: 10 },
    margins: {
      top: 0.75,
      bottom: 0.75,
      left: 0.75,
      right: 0.5,
      gutter: 0.375,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },

  KDP_Ebook: {
    label: "KDP Kindle eBook (reflowable)",
    trim: null,
    margins: {
      top: 0.2,
      bottom: 0.2,
      left: 0.2,
      right: 0.2,
    },
    headers: false,
    footers: false,
    pageNumbers: false,
    showTOCInEbook: true,
  },
  Generic_Manuscript_Submission: {
    label: "Generic Manuscript Submission (DOCX)",
    trim: null,
    margins: {
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
    },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
};

/* ---------- Styles ---------- */

const styles = {
  outer: {
    maxWidth: 1300,
    margin: "32px auto",
    background: "var(--brand-white)",
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(2,20,40,.08)",
    overflow: "hidden",
  } as React.CSSProperties,
  sectionShell: {
    maxWidth: 1240,
    margin: "0 auto",
  } as React.CSSProperties,
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    color: theme.subtext,
  } as React.CSSProperties,
  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    background: theme.white,
    color: theme.text,
  } as React.CSSProperties,
  btn: {
    padding: "8px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
    fontSize: 12,
  } as React.CSSProperties,
  btnPrimary: {
    padding: "9px 14px",
    borderRadius: 12,
    border: "none",
    background: theme.accent,
    color: theme.white,
    cursor: "pointer",
    fontSize: 13,
  } as React.CSSProperties,
  btnDark: {
    padding: "9px 14px",
    borderRadius: 12,
    border: "none",
    background: theme.primary,
    color: theme.white,
    cursor: "pointer",
    fontSize: 13,
  } as React.CSSProperties,
} as const;

type AIKey = "grammar" | "style" | "assistant" | "readability";

const AI_ACTIONS: Array<{
  key: AIKey;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    key: "grammar",
    icon: "✍️",
    title: "Grammar & Clarity",
    subtitle: "Check grammar, spelling",
  },
  {
    key: "style",
    icon: "🎭",
    title: "Style Suggestions",
    subtitle: "Improve flow, tone",
  },
  {
    key: "assistant",
    icon: "✨",
    title: "AI Writing Assistant",
    subtitle: "Generate, rewrite text",
  },
  {
    key: "readability",
    icon: "📊",
    title: "Readability Analysis",
    subtitle: "Grade level, metrics",
  },
];

const MATERIAL_ACTIONS = [
  { key: "synopsis-short", label: "Short Synopsis (200–300 words)" },
  { key: "synopsis-long", label: "Long Synopsis (500–800 words)" },
  { key: "back-cover", label: "Back-Cover Blurb" },
  { key: "logline", label: "Logline" },
  { key: "query-letter", label: "Query Letter" },
] as const;

type MaterialKey = (typeof MATERIAL_ACTIONS)[number]["key"];

/* ---------- Tiny helpers ---------- */

const htmlEscape = (s: string) =>
  s.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const inchToPx = (inch: number) => inch * 96; // CSS assumes 96 DPI

function stripHtml(html: string = ""): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

// Remove @char: markers
function stripCharacterTags(html: string = ""): string {
  return html.replace(/@char:\s*/g, "");
}

// Remove spacer paragraphs like <p>&nbsp;</p>, empty <p></p>, or <p><br/></p>
function stripSpacerParagraphs(html: string = ""): string {
  if (!html) return "";
  return html
    .replace(/<p>&nbsp;<\/p>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<p><br\s*\/?><\/p>/gi, "");
}

/**
 * Trim very large manuscripts before sending to AI.
 * Keeps the beginning + ending and drops the middle.
 */
function trimForAI(
  text: string,
  maxChars: number = 50000 // ~10–12k tokens-ish
): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;

  const headLen = Math.floor(maxChars * 0.6);
  const tailLen = Math.floor(maxChars * 0.3);

  const head = text.slice(0, headLen);
  const tail = text.slice(-tailLen);

  return (
    head +
    "\n\n[...middle of manuscript omitted for AI context...]\n\n" +
    tail
  );
}

/* ---------- Small UI helpers ---------- */

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: checked ? theme.highlight : theme.white,
        color: theme.text,
        cursor: "pointer",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
      aria-pressed={checked}
      type="button"
    >
      <span
        style={{
          width: 32,
          height: 18,
          borderRadius: 999,
          background: checked ? theme.accent : "#CBD5E1",
          position: "relative",
          display: "inline-block",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: theme.white,
            transition: "left .15s ease",
          }}
        />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
};

type ToolbarButtonProps = {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  small?: boolean;
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  children,
  onClick,
  small,
}) => (
  <button
    type="button"
    title={label}
    onClick={onClick}
    style={{
      borderRadius: 6,
      border: `1px solid ${theme.border}`,
      background: theme.white,
      padding: small ? "2px 6px" : "4px 8px",
      fontSize: small ? 10 : 11,
      cursor: "pointer",
      minWidth: small ? 32 : 36,
    }}
  >
    {children}
  </button>
);

const ToolbarDivider: React.FC = () => (
  <span
    style={{
      width: 1,
      height: 20,
      background: theme.border,
      opacity: 0.7,
      marginInline: 4,
    }}
  />
);

function AIActionButton({
  icon,
  title,
  subtitle,
  onClick,
  busy,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      disabled={busy}
      onClick={onClick}
      style={{
        ...styles.btn,
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: busy ? 0.7 : 1,
        cursor: busy ? "progress" : "pointer",
      }}
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.text,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.subtext,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {subtitle}
        </div>
      </div>
      {busy && (
        <span aria-hidden style={{ fontSize: 11, color: theme.subtext }}>
          Working…
        </span>
      )}
    </button>
  );
}

/* ======================== Component ======================== */

export default function Publishing(): JSX.Element {
  const [googleMode] = useState<boolean>(false);
  const [working, setWorking] = useState<AIKey | null>(null);
  const navigate = useNavigate();

  // ---------- Meta (shared with Writing) ----------
  const [meta, setMeta] = useState<Meta>({
    title: "Working Title",
    author: "Your Name",
    year: new Date().getFullYear().toString(),
    authorLast: "YourLastName",
  });

  // Load meta from localStorage (Writing / legacy)
  useEffect(() => {
    try {
      // Prefer publishing meta if present
      const pubMetaRaw = localStorage.getItem(PUBLISHING_META_KEY);
      if (pubMetaRaw) {
        const parsed = JSON.parse(pubMetaRaw);
        if (parsed && typeof parsed === "object") {
          setMeta((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }

      const saved = localStorage.getItem(META_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setMeta((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore bad JSON
    }
  }, []);

  // Persist meta to both keys
  useEffect(() => {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      localStorage.setItem(PUBLISHING_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore storage errors
    }
  }, [meta]);

  // ---------- Chapters + active chapter ----------

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] =
    useState<string>("");

  // Load chapters saved by Writing / Compose
  useEffect(() => {
    try {
      // --- Prefer structured publishingDraft from ComposePage ---
      const draftRaw = localStorage.getItem(PUBLISHING_DRAFT_KEY);

      if (draftRaw) {
        const parsed = JSON.parse(draftRaw) as {
          book?: any;
          chapters?: any[];
        };

        // hydrate meta title from the book object if present
        if (parsed.book?.title) {
          setMeta((prev) => ({
            ...prev,
            title: parsed.book.title || prev.title,
          }));
        }

        const rawChapters = Array.isArray(parsed.chapters)
          ? parsed.chapters
          : [];

        if (rawChapters.length > 0) {
          const normalized: Chapter[] = rawChapters.map(
            (c: any, idx: number) => {
              // Whatever Compose saved: textHTML, content, or text
              const rawHtml =
                typeof c.textHTML === "string"
                  ? c.textHTML
                  : typeof c.content === "string"
                  ? c.content
                  : typeof c.text === "string"
                  ? c.text
                  : "";

              // 🔹 Strip any internal markers / spacer paragraphs
              const cleanedHtml = stripSpacerParagraphs(
                stripCharacterTags(rawHtml)
              );

              return {
                id: c.id || `c_${idx + 1}`,
                title: c.title || `Chapter ${idx + 1}`,
                included:
                  typeof c.included === "boolean"
                    ? c.included
                    : true,
                // plain text used for compiled manuscript
                text: stripHtml(cleanedHtml),
                // keep cleaned HTML for the editor
                textHTML: cleanedHtml || undefined,
              };
            }
          );

          setChapters(normalized);
          setActiveChapterId(normalized[0].id);

          return; // ✅ Done, no need to fall back
        }
      }

      // --- Fallback: legacy dahtruth_chapters behavior ---
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsedCh = JSON.parse(saved) as any[];
      if (!Array.isArray(parsedCh) || parsedCh.length === 0) return;

      const normalizedLegacy: Chapter[] = parsedCh.map(
        (c: any, idx: number) => {
          const rawHtml = c.textHTML || c.content || c.text || "";
          const cleanedHtml = stripSpacerParagraphs(
            stripCharacterTags(rawHtml)
          );
          return {
            id: c.id || `c_${idx + 1}`,
            title: c.title || `Chapter ${idx + 1}`,
            included:
              typeof c.included === "boolean"
                ? c.included
                : true,
            text: stripHtml(cleanedHtml),
            textHTML: cleanedHtml,
          };
        }
      );

      setChapters(normalizedLegacy);
      if (normalizedLegacy[0]) {
        setActiveChapterId(normalizedLegacy[0].id);
      }
    } catch (err) {
      console.error("Failed to load chapters for Publishing:", err);
    }
  }, []);

  // Persist chapters when edited in Publishing
  useEffect(() => {
    try {
      if (!chapters.length) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
      localStorage.setItem(
        PUBLISHING_CHAPTERS_KEY,
        JSON.stringify(chapters)
      );
    } catch (err) {
      console.error(
        "Failed to persist chapters from Publishing:",
        err
      );
    }
  }, [chapters]);

  // ---------- AI + layout state ----------

  const [provider, setProvider] =
    useState<"openai" | "anthropic">("openai");

  const [matter, setMatter] = useState<Matter>({
    titlePage: "{title}\nby {author}",
    copyright: "© {year} {author}. All rights reserved.",
    dedication: "For those who kept the light on.",
    epigraph: '"We live by stories."',
    toc: true,
    acknowledgments: "Thank you to every early reader.",
    aboutAuthor:
      "{author} writes stories about family, faith, and becoming.",
    notes: "",
    tocFromHeadings: true,
  });

  // Load matter for Publishing (for Proof tab)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PUBLISHING_MATTER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setMatter((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error("Failed to load publishing matter:", err);
    }
  }, []);

  // Persist matter to storage
  useEffect(() => {
    try {
      localStorage.setItem(
        PUBLISHING_MATTER_KEY,
        JSON.stringify(matter)
      );
    } catch {
      /* ignore */
    }
  }, [matter]);

  const [manuscriptPreset, setManuscriptPreset] =
    useState<ManuscriptPresetKey>(
      "Agents_Standard_12pt_TNR_Double"
    );
  const [platformPreset, setPlatformPreset] =
    useState<PlatformPresetKey>(
      "Generic_Manuscript_Submission"
    );

  const [msOverrides, setMsOverrides] = useState<
    Partial<(typeof MANUSCRIPT_PRESETS)[ManuscriptPresetKey]>
  >({});

  useEffect(() => {
    setMsOverrides((prev) => ({
      ...prev,
      lineHeight:
        MANUSCRIPT_PRESETS[manuscriptPreset].lineHeight,
    }));
  }, [manuscriptPreset]);

  const ms = {
    ...MANUSCRIPT_PRESETS[manuscriptPreset],
    ...msOverrides,
  };
  const pf = PLATFORM_PRESETS[platformPreset];
  const includeHeadersFooters = pf.headers || pf.footers;

  // Rough visual page-size preview
  const pageWidthPx = pf.trim?.widthInch
    ? inchToPx(pf.trim.widthInch) * 0.9
    : 840;

  const leftPaddingPx = pf.margins.left
    ? inchToPx(pf.margins.left) * 0.6
    : 48;
  const rightPaddingPx = pf.margins.right
    ? inchToPx(pf.margins.right) * 0.6
    : 48;

  const activeIdx = Math.max(
    0,
    chapters.findIndex((c) => c.id === activeChapterId)
  );
  const activeChapter =
    chapters[activeIdx] || chapters[0];

  const editorRef = useRef<HTMLDivElement>(null);

  const [isWide, setIsWide] = useState<boolean>(
    typeof window !== "undefined"
      ? window.innerWidth >= 1100
      : true
  );

  useEffect(() => {
    const onResize = () =>
      setIsWide(
        typeof window !== "undefined" &&
          window.innerWidth >= 1100
      );
    window.addEventListener("resize", onResize);
    return () =>
      window.removeEventListener("resize", onResize);
  }, []);

  // Load HTML for active chapter into editor (and clean it)
  useEffect(() => {
    const chap = chapters[activeIdx];
    const el = editorRef.current;
    if (!chap || !el) return;

    // compute or clean HTML
    if (!chap.textHTML) {
      const html = `<p>${htmlEscape(chap.text)
        .replaceAll("\n\n", "</p><p>")
        .replaceAll("\n", "<br/>")}</p>`;
      const cleaned = stripSpacerParagraphs(
        stripCharacterTags(html)
      );
      setChapters((prev) => {
        const next = [...prev];
        next[activeIdx] = {
          ...chap,
          textHTML: cleaned,
        };
        return next;
      });
      el.innerHTML = cleaned;
    } else {
      const cleaned = stripSpacerParagraphs(
        stripCharacterTags(chap.textHTML)
      );
      if (cleaned !== chap.textHTML) {
        setChapters((prev) => {
          const next = [...prev];
          next[activeIdx] = {
            ...chap,
            textHTML: cleaned,
            text: stripHtml(cleaned),
          };
          return next;
        });
      }
      el.innerHTML = cleaned;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId]);

  // ---------- Editor commands ----------

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const setBlock = (tag: "P" | "H1" | "H2" | "H3") =>
    exec("formatBlock", tag);

  const setFont = (family: string) =>
    exec("fontName", family);

  const setFontSizePt = (sizePx: number) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = `${sizePx}px`;
    range.surroundContents(span);
  };

  const insertPageBreak = () => {
    const hr = document.createElement("hr");
    hr.style.pageBreakAfter = "always";
    hr.style.border = "0";
    hr.style.borderTop = "1px dashed #e5e7eb";

    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.insertNode(hr);
    range.setStartAfter(hr);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const saveActiveChapterHTML = () => {
    if (!editorRef.current) {
      alert("⚠️ No editor content to save.");
      return;
    }
    const rawHtml =
      editorRef.current.innerHTML || "";
    const cleaned = stripSpacerParagraphs(
      stripCharacterTags(rawHtml)
    );

    editorRef.current.innerHTML = cleaned;

    setChapters((prev) => {
      const next = [...prev];
      const ch = next[activeIdx];
      if (ch) {
        next[activeIdx] = {
          ...ch,
          textHTML: cleaned,
          text: stripHtml(cleaned),
        };
      }
      return next;
    });
    alert("✅ Chapter saved successfully!");
  };

  const genId = () =>
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? (crypto as any).randomUUID()
      : `c_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

  const addChapter = () => {
    setChapters((prev) => {
      const id = genId();
      const idx = prev.length + 1;
      const html = `<h1>Chapter ${idx} – Untitled</h1><p>New chapter text…</p>`;
      const cleaned = stripSpacerParagraphs(
        stripCharacterTags(html)
      );
      const ch: Chapter = {
        id,
        title: `Chapter ${idx} – Untitled`,
        included: true,
        text: stripHtml(cleaned),
        textHTML: cleaned,
      };
      return [...prev, ch];
    });
  };

  /* ----- Import DOCX / HTML (stubbed for now) ----- */

  const importDocx = useCallback(
    async (_file: File, _asNewChapter: boolean = true) => {
      alert(
        "DOCX import will be wired back in soon. For now, paste your text directly into the editor."
      );
    },
    []
  );

  const importHTML = useCallback(
    async (
      file: File,
      asNewChapter: boolean = true
    ) => {
      try {
        const html = await file.text();
        const cleanedHtml = stripSpacerParagraphs(
          stripCharacterTags(html)
        );
        const plain = stripHtml(cleanedHtml);

        if (asNewChapter) {
          const id = genId();
          const title =
            file.name.replace(
              /\.(html?|xhtml)$/i,
              ""
            ) || "Imported HTML";

          const ch: Chapter = {
            id,
            title,
            included: true,
            text: plain,
            textHTML: cleanedHtml,
          };

          setChapters((prev) => [...prev, ch]);
          setActiveChapterId(id);

          alert(
            `Imported "${title}" successfully! Use the chapter dropdown to open it.`
          );
        } else {
          // Replace the current active chapter content with imported HTML
          setChapters((prev) => {
            const next = [...prev];
            const cur = next[activeIdx];
            if (cur) {
              const title =
                cur.title ||
                file.name.replace(
                  /\.(html?|xhtml)$/i,
                  ""
                ) ||
                "Imported HTML";

              next[activeIdx] = {
                ...cur,
                title,
                text: plain,
                textHTML: cleanedHtml,
              };
            }
            return next;
          });

          alert("Chapter replaced successfully!");
        }
      } catch (err) {
        console.error(err);
        alert(
          "Sorry—HTML import failed. The file may be malformed or unreadable."
        );
      }
    },
    [activeIdx]
  );

  /* ---------- Compile (Preview/Export) ---------- */

  const tocFromHeadings: string[] = useMemo(() => {
    if (!matter.tocFromHeadings) return [];
    const items: string[] = [];

    chapters.forEach((c) => {
      if (!c.included) return;
      const html =
        c.textHTML ||
        `<p>${htmlEscape(c.text)}</p>`;
      const dom = new DOMParser().parseFromString(
        `<div>${html}</div>`,
        "text/html"
      );
      const hs = Array.from(
        dom.querySelectorAll("h1, h2, h3")
      );
      if (hs.length === 0) {
        items.push(c.title);
      } else {
        hs.forEach((h) =>
          items.push(h.textContent || "")
        );
      }
    });

    return items.filter(Boolean);
  }, [chapters, matter.tocFromHeadings]);

  const compiledPlain: string = useMemo(() => {
    const parts: string[] = [];
    const vars = (s: string) =>
      s
        .replaceAll("{title}", meta.title)
        .replaceAll("{author}", meta.author)
        .replaceAll("{year}", meta.year);

    parts.push(vars(matter.titlePage));
    parts.push("\n\n" + vars(matter.copyright));

    if (matter.dedication) {
      parts.push(
        "\n\nDedication\n" + matter.dedication
      );
    }

    if (matter.epigraph) {
      parts.push(
        "\n\nEpigraph\n" + matter.epigraph
      );
    }

    if (matter.toc) {
      const tocList = matter.tocFromHeadings
        ? tocFromHeadings
        : chapters
            .filter((c) => c.included)
            .map((c) => c.title);
      parts.push(
        "\n\nContents\n" +
          tocList
            .map(
              (t, i) => `${i + 1}. ${t}`
            )
            .join("\n")
      );
    }

    chapters.forEach((c) => {
      if (!c.included) return;
      const textNoTags = c.textHTML
        ? stripHtml(c.textHTML)
        : c.text;
      parts.push(
        "\n\n" + c.title + "\n" + textNoTags
      );
    });

    if (matter.acknowledgments) {
      parts.push(
        "\n\nAcknowledgments\n" +
          matter.acknowledgments
      );
    }
    if (matter.aboutAuthor) {
      parts.push(
        "\n\nAbout the Author\n" +
          vars(matter.aboutAuthor)
      );
    }
    if (matter.notes) {
      parts.push("\n\nNotes\n" + matter.notes);
    }

    return parts.join("\n").trim();
  }, [chapters, matter, meta, tocFromHeadings]);

  const wordCount = useMemo(
    () =>
      compiledPlain
        ? compiledPlain
            .split(/\s+/)
            .filter(Boolean).length
        : 0,
    [compiledPlain]
  );

  // Save compiled manuscript text for other tabs (proof/format/export)
  useEffect(() => {
    try {
      if (compiledPlain) {
        localStorage.setItem(
          "dahtruth_publishing_manuscript",
          compiledPlain
        );
      }
    } catch {
      /* ignore */
    }
  }, [compiledPlain]);

  // Story materials state
  const [materialKey, setMaterialKey] =
    useState<MaterialKey>("synopsis-short");
  const [materialOutput, setMaterialOutput] =
    useState<string>("");
  const [materialBusy, setMaterialBusy] =
    useState<boolean>(false);

  const handleGenerateMaterial = async (
    key: MaterialKey
  ) => {
    if (!compiledPlain) {
      alert(
        "Your publishing manuscript is empty. Add chapters and front matter first."
      );
      return;
    }
    if (materialBusy) return;
    setMaterialBusy(true);
    setMaterialKey(key);

    const baseText = trimForAI(compiledPlain);

    try {
      let generatedText = "";

      // synopsis routes use dedicated endpoint
      if (
        key === "synopsis-short" ||
        key === "synopsis-long"
      ) {
        const synopsisRes = await generateSynopsis({
          manuscriptText: trimForAI(
            compiledPlain,
            60000
          ),
          title:
            (meta as any)?.title ||
            (meta as any)?.workingTitle ||
            "Untitled Manuscript",
          genre: (meta as any)?.genre || "",
          tone:
            key === "synopsis-short"
              ? "brief agent-ready synopsis"
              : "expanded reader-facing synopsis",
          maxWords:
            key === "synopsis-short" ? 300 : 800,
        });
        generatedText =
          synopsisRes.synopsis || "";
      } else {
        // other materials via assistant + instructions
        let instructions = "";

        if (key === "back-cover") {
          instructions =
            "Using this manuscript, write a compelling back-cover blurb in 2–3 short paragraphs aimed at adult readers. Write in third person, highlight the central conflict and emotional stakes, avoid spoilers, and end with an intriguing hook. Keep it under 350 words.";
        } else if (key === "logline") {
          instructions =
            "Write a single-sentence logline for this story suitable for pitching to agents and editors. Focus on the main character, central conflict, and stakes. Provide 2–3 options.";
        } else if (key === "query-letter") {
          instructions =
            "Write a professional query letter to a literary agent for this manuscript. Include: a strong hook opening paragraph, a 2–3 paragraph concise synopsis without major spoilers for the final pages, and a short third-person author bio paragraph. The tone should be confident, warm, and professional. Keep the whole letter between 350 and 500 words.";
        }

        const res: any = await runAssistant(
          baseText,
          "improve",
          instructions,
          provider
        );

        generatedText =
          res?.result ||
          res?.text ||
          res?.output ||
          baseText;
      }

      if (!generatedText) {
        throw new Error("AI returned an empty response.");
      }

      setMaterialOutput(generatedText);

      navigate("/publishing-prep", {
        state: {
          from: "story-materials",
          materialType: key,
          manuscriptMeta: meta,
          manuscriptText: compiledPlain,
          generated: generatedText,
        },
      });
    } catch (e: any) {
      console.error(
        "[Story Material Error]:",
        e
      );
      const msg =
        typeof e?.message === "string"
          ? e.message
          : String(e);
      if (
        /maximum context length|max tokens|context length/i.test(
          msg
        )
      ) {
        alert(
          "Your manuscript is very large, and the AI hit its context limit. I’ve added trimming on our side, but if this continues, try generating materials by section or with a shorter working version."
        );
      } else {
        alert(
          msg ||
            "Could not generate story material. Please try again."
        );
      }
    } finally {
      setMaterialBusy(false);
    }
  };

  // Clear Publishing manuscript and local state (without touching Writing)
  const handleClearPublishingDraft = () => {
    const confirmed = window.confirm(
      "Clear the current Publishing manuscript? This will NOT delete your chapters in Compose."
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem(PUBLISHING_DRAFT_KEY);
      localStorage.removeItem(
        PUBLISHING_CHAPTERS_KEY
      );
      localStorage.removeItem(PUBLISHING_META_KEY);
      localStorage.removeItem(
        PUBLISHING_MATTER_KEY
      );
      localStorage.removeItem(
        "dahtruth_publishing_manuscript"
      );
    } catch (err) {
      console.error(
        "Failed to clear publishing draft:",
        err
      );
    }

    setChapters([]);
    setActiveChapterId("");
    setMatter({
      titlePage: "{title}\nby {author}",
      copyright:
        "© {year} {author}. All rights reserved.",
      dedication:
        "For those who kept the light on.",
      epigraph: '"We live by stories."',
      toc: true,
      acknowledgments:
        "Thank you to every early reader.",
      aboutAuthor:
        "{author} writes stories about family, faith, and becoming.",
      notes: "",
      tocFromHeadings: true,
    });
  };

  /* ---------- UI ---------- */

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
        ...(googleMode
          ? ({
              ["--brand-primary" as any]:
                GOOGLE_PALETTE.primary,
              ["--brand-accent" as any]:
                GOOGLE_PALETTE.accent,
              ["--brand-highlight" as any]:
                GOOGLE_PALETTE.highlight,
            } as React.CSSProperties)
          : {}),
      }}
    >
      <div style={styles.outer}>
        {/* HEADER STRIP */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #b897d6, #e3c8ff)",
            backdropFilter: "blur(12px)",
            color: theme.white,
            padding: "14px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                ...styles.btn,
                border: "none",
                background: theme.gold,
                color: "#1f2933",
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                boxShadow:
                  "0 4px 10px rgba(0,0,0,0.15)",
              }}
            >
              ← Back to Dashboard
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
              }}
            >
              <span
                aria-hidden
                style={{ fontSize: 24 }}
              >
                📖✒️
              </span>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    fontFamily:
                      "Garamond, Georgia, serif",
                  }}
                >
                  Publishing Studio
                </h1>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.9,
                  }}
                >
                  Format, polish, and prepare your
                  manuscript for the world.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 11 }}>
                Word count:{" "}
                <span
                  style={{ fontWeight: 600 }}
                >
                  {wordCount.toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: 11 }}>
                Platform:{" "}
                <span
                  style={{ fontWeight: 600 }}
                >
                  {PLATFORM_PRESETS[platformPreset]
                    .label}
                </span>
              </div>
              <button
                type="button"
                onClick={
                  handleClearPublishingDraft
                }
                style={{
                  marginTop: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    "1px solid rgba(255,255,255,0.6)",
                  background:
                    "rgba(255,255,255,0.12)",
                  color: theme.white,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                Clear Manuscript
              </button>
            </div>
          </div>
        </div>

        {/* MAIN GRID: sidebar left, editor right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isWide
              ? "260px minmax(0, 1fr)"
              : "1fr",
            gridTemplateAreas: isWide
              ? '"sidebar editor"'
              : '"sidebar" "editor"',
            gap: 24,
            padding: "20px 24px",
          }}
        >
          {/* TOOL SIDEBAR (LEFT) */}
          <aside
            style={{
              gridArea: "sidebar",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Platform details */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  color: theme.text,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>📐</span>
                Platform Details
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: theme.subtext,
                  marginBottom: 10,
                }}
              >
                Based on your selected platform,
                this preview approximates page
                size and margins for the editor.
              </p>
              <div
                style={{
                  fontSize: 11,
                  display: "grid",
                  gap: 4,
                }}
              >
                <div>
                  <strong>Preset:</strong>{" "}
                  {pf.label}
                </div>
                <div>
                  <strong>Trim size:</strong>{" "}
                  {pf.trim
                    ? `${pf.trim.widthInch}" × ${pf.trim.heightInch}"`
                    : "Ebook / no fixed trim"}
                </div>
                <div>
                  <strong>
                    Margins (top / right /
                    bottom / left):
                  </strong>{" "}
                  {pf.margins.top}" /{" "}
                  {pf.margins.right}" /{" "}
                  {pf.margins.bottom}" /{" "}
                  {pf.margins.left}"
                </div>
                {typeof pf.margins.gutter ===
                  "number" && (
                  <div>
                    <strong>Gutter:</strong>{" "}
                    {pf.margins.gutter}"
                  </div>
                )}
                <div>
                  <strong>
                    Headers / footers:
                  </strong>{" "}
                  {includeHeadersFooters
                    ? "On"
                    : "Off"}
                </div>
                <div>
                  <strong>
                    Page numbers:
                  </strong>{" "}
                  {pf.pageNumbers
                    ? "Shown"
                    : "Hidden"}
                </div>
                <div>
                  <strong>
                    Show TOC in ebook:
                  </strong>{" "}
                  {pf.showTOCInEbook
                    ? "Yes"
                    : "No"}
                </div>
              </div>
            </div>

            {/* Publishing tools menu */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  color: theme.text,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>🧭</span>
                Publishing Tools
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: theme.subtext,
                  marginBottom: 10,
                }}
              >
                Quick routes into deeper tools
                when you are ready.
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                <button
                  style={{
                    ...styles.btn,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() =>
                    navigate("/proof")
                  }
                >
                  <span
                    style={{ fontSize: 18 }}
                  >
                    ✅
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Proof & Consistency
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.subtext,
                      }}
                    >
                      Grammar, style, timeline
                    </div>
                  </div>
                </button>

                <button
                  style={{
                    ...styles.btn,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() =>
                    navigate("/format")
                  }
                >
                  <span
                    style={{ fontSize: 18 }}
                  >
                    🎨
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Format & Styles
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.subtext,
                      }}
                    >
                      Fonts, spacing, margins
                    </div>
                  </div>
                </button>

                <button
                  style={{
                    ...styles.btn,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() =>
                    navigate("/export")
                  }
                >
                  <span
                    style={{ fontSize: 18 }}
                  >
                    📦
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Export
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.subtext,
                      }}
                    >
                      PDF, DOCX, EPUB
                    </div>
                  </div>
                </button>

                <button
                  style={{
                    ...styles.btn,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() =>
                    navigate(
                      "/publishing-prep"
                    )
                  }
                >
                  <span
                    style={{ fontSize: 18 }}
                  >
                    🚀
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Publishing Prep
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.subtext,
                      }}
                    >
                      Query, synopsis,
                      marketing
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* AI tools */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  color: theme.text,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>🤖</span>
                Line-level AI Help
              </h3>
              <div
                style={{ marginBottom: 10 }}
              >
                <label
                  style={{
                    ...styles.label,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) =>
                    setProvider(
                      e.target.value as
                        | "openai"
                        | "anthropic"
                    )
                  }
                  style={{
                    ...styles.input,
                    fontSize: 12,
                  }}
                >
                  <option value="openai">
                    OpenAI
                  </option>
                  <option value="anthropic">
                    Anthropic
                  </option>
                </select>
              </div>

              <div
                role="group"
                aria-label="AI tools"
                style={{
                  display: "grid",
                  gap: 6,
                }}
              >
                {AI_ACTIONS.map((a) => (
                  <AIActionButton
                    key={a.key}
                    icon={a.icon}
                    title={a.title}
                    subtitle={a.subtitle}
                    busy={working === a.key}
                    onClick={async () => {
                      if (working) return;
                      setWorking(a.key);
                      try {
                        const currentHtml =
                          editorRef.current
                            ?.innerHTML ?? "";
                        const cleanedCurrentHtml =
                          stripSpacerParagraphs(
                            stripCharacterTags(
                              currentHtml
                            )
                          );
                        const currentText =
                          stripHtml(
                            cleanedCurrentHtml
                          ) || "";
                        let res: any;

                        if (
                          a.key === "grammar"
                        ) {
                          res =
                            await runGrammar(
                              currentText,
                              provider
                            );
                        } else if (
                          a.key === "style"
                        ) {
                          res =
                            await runStyle(
                              currentText,
                              provider
                            );
                        } else if (
                          a.key ===
                          "readability"
                        ) {
                          res =
                            await runReadability(
                              currentText,
                              provider
                            );
                        } else if (
                          a.key ===
                          "assistant"
                        ) {
                          res =
                            await runAssistant(
                              currentText,
                              "improve",
                              "",
                              provider
                            );
                        }

                        const improvedText =
                          res?.result ||
                          res?.text ||
                          res?.output ||
                          currentText;

                        const improved =
                          improvedText !==
                          currentText
                            ? `<p>${improvedText
                                .split(
                                  "\n\n"
                                )
                                .join(
                                  "</p><p>"
                                )}</p>`.replace(
                                /<p><\/p>/g,
                                "<p><br/></p>"
                              )
                            : cleanedCurrentHtml;

                        const finalHtml =
                          stripSpacerParagraphs(
                            stripCharacterTags(
                              improved
                            )
                          );

                        if (
                          editorRef.current &&
                          finalHtml !==
                            currentHtml
                        ) {
                          editorRef.current.innerHTML =
                            finalHtml;
                        }

                        setChapters((prev) => {
                          const next = [
                            ...prev,
                          ];
                          const ch =
                            next[
                              activeIdx
                            ];
                          if (ch) {
                            next[activeIdx] =
                              {
                                ...ch,
                                textHTML:
                                  finalHtml,
                                text: stripHtml(
                                  finalHtml
                                ),
                              };
                          }
                          return next;
                        });
                      } catch (e: any) {
                        console.error(
                          "[AI Error]:",
                          e
                        );
                        alert(
                          e?.message ||
                            "AI request failed. Check console for details."
                        );
                      } finally {
                        setWorking(null);
                      }
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent:
                    "flex-end",
                }}
              >
                <button
                  style={styles.btnDark}
                  disabled={working !== null}
                  onClick={async () => {
                    if (working) return;
                    setWorking("assistant");
                    try {
                      const chaptersPlain =
                        chapters
                          .filter(
                            (c) =>
                              c.included
                          )
                          .map((c) => ({
                            id: c.id,
                            title: c.title,
                            text: c.textHTML
                              ? stripHtml(
                                  c.textHTML
                                )
                              : c.text,
                          }));

                      const res =
                        await runPublishingPrep(
                          meta,
                          chaptersPlain,
                          {
                            tone: "professional/warm",
                            audience:
                              "agents_and_publishers",
                          },
                          provider
                        );

                      if (
                        !res?.prep &&
                        !res?.result
                      ) {
                        throw new Error(
                          "No prep content returned from AI."
                        );
                      }

                      navigate(
                        "/publishing-prep",
                        {
                          state: {
                            generated:
                              res.prep ||
                              res.result ||
                              res,
                          },
                        }
                      );
                    } catch (e: any) {
                      console.error(
                        "[Publishing Prep Error]:",
                        e
                      );
                      alert(
                        e?.message ||
                          "Couldn't generate publishing prep just yet."
                      );
                    } finally {
                      setWorking(null);
                    }
                  }}
                >
                  ✨ Full Publishing Prep
                </button>
              </div>
            </div>

            {/* Story materials */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 15,
                  color: theme.text,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span aria-hidden>📄</span>
                Story Materials
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: theme.subtext,
                  marginBottom: 8,
                }}
              >
                Uses your compiled manuscript
                (front matter + chapters) to
                draft agent-ready materials.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {MATERIAL_ACTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      handleGenerateMaterial(
                        opt.key
                      )
                    }
                    disabled={materialBusy}
                    style={{
                      ...styles.btn,
                      padding: "5px 9px",
                      fontSize: 11,
                      borderRadius: 999,
                      border:
                        materialKey ===
                        opt.key
                          ? `1px solid ${theme.accent}`
                          : `1px solid ${theme.border}`,
                      background:
                        materialKey ===
                        opt.key
                          ? theme.highlight
                          : theme.white,
                      opacity: materialBusy
                        ? 0.7
                        : 1,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  handleGenerateMaterial(
                    materialKey
                  )
                }
                disabled={materialBusy}
                style={{
                  ...styles.btnPrimary,
                  padding: "7px 12px",
                  fontSize: 12,
                }}
              >
                {materialBusy
                  ? "Generating..."
                  : "Generate selected"}
              </button>
              {materialOutput && (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: "#050819",
                    padding: 10,
                    maxHeight: 260,
                    overflow: "auto",
                    color: "#f9fafb",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {materialOutput}
                </div>
              )}
            </div>
          </aside>

          {/* EDITOR COLUMN (RIGHT) */}
          <div
            style={{
              gridArea: "editor",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Project basics */}
            <div style={styles.glassCard}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 210,
                  }}
                >
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                    }}
                  >
                    Project title
                  </label>
                  <input
                    value={meta.title}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        title:
                          e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 180,
                  }}
                >
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                    }}
                  >
                    Author
                  </label>
                  <input
                    value={meta.author}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        author:
                          e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                </div>
                <div style={{ width: 80 }}>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                    }}
                  >
                    Year
                  </label>
                  <input
                    value={meta.year}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        year:
                          e.target.value,
                      }))
                    }
                    style={{
                      ...styles.input,
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Editor card */}
            <div style={styles.glassCard}>
              {/* Chapter controls */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 200,
                  }}
                >
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                    }}
                  >
                    Current chapter
                  </label>
                  <select
                    value={activeChapter?.id}
                    onChange={(e) =>
                      setActiveChapterId(
                        e.target.value
                      )
                    }
                    style={styles.input}
                  >
                    {chapters.map(
                      (c, idx) => (
                        <option
                          key={c.id}
                          value={c.id}
                        >
                          {idx + 1}. {c.title}
                          {c.included
                            ? ""
                            : " (excluded)"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {activeChapter && (
                  <Toggle
                    checked={
                      activeChapter.included
                    }
                    onChange={(v) =>
                      setChapters((prev) =>
                        prev.map((c) =>
                          c.id ===
                          activeChapter.id
                            ? {
                                ...c,
                                included: v,
                              }
                            : c
                        )
                      )
                    }
                    label={
                      activeChapter.included
                        ? "Included in manuscript"
                        : "Excluded"
                    }
                  />
                )}

                <button
                  style={{
                    ...styles.btnPrimary,
                    whiteSpace: "nowrap",
                  }}
                  onClick={addChapter}
                >
                  + Add Chapter
                </button>
              </div>

              {/* Toolbar */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexWrap: "wrap",
                  padding: "6px 10px",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  marginBottom: 12,
                  background: theme.white,
                  fontSize: 11,
                }}
              >
                <select
                  onChange={(e) =>
                    setFont(e.target.value)
                  }
                  defaultValue="Times New Roman"
                  aria-label="Font family"
                  style={{
                    ...(styles.input as any),
                    width: 140,
                    padding: "3px 5px",
                    fontSize: 10,
                    height: 24,
                  }}
                >
                  <option>
                    Times New Roman
                  </option>
                  <option>Georgia</option>
                  <option>Garamond</option>
                  <option>Palatino</option>
                  <option>Calibri</option>
                  <option>Arial</option>
                </select>

                <select
                  onChange={(e) =>
                    setFontSizePt(
                      parseInt(
                        e.target.value,
                        10
                      )
                    )
                  }
                  defaultValue="16"
                  aria-label="Font size (pt)"
                  style={{
                    ...(styles.input as any),
                    width: 45,
                    padding: "3px 4px",
                    fontSize: 10,
                    height: 24,
                  }}
                >
                  <option value="14">
                    14
                  </option>
                  <option value="16">
                    16
                  </option>
                  <option value="18">
                    18
                  </option>
                  <option value="20">
                    20
                  </option>
                  <option value="22">
                    22
                  </option>
                </select>

                <ToolbarDivider />

                <ToolbarButton
                  label="Bold"
                  onClick={() =>
                    exec("bold")
                  }
                >
                  B
                </ToolbarButton>
                <ToolbarButton
                  label="Italic"
                  onClick={() =>
                    exec("italic")
                  }
                >
                  <em>I</em>
                </ToolbarButton>
                <ToolbarButton
                  label="Underline"
                  onClick={() =>
                    exec("underline")
                  }
                >
                  <u>U</u>
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                  label="H1"
                  onClick={() =>
                    setBlock("H1")
                  }
                  small
                >
                  H1
                </ToolbarButton>
                <ToolbarButton
                  label="H2"
                  onClick={() =>
                    setBlock("H2")
                  }
                  small
                >
                  H2
                </ToolbarButton>
                <ToolbarButton
                  label="H3"
                  onClick={() =>
                    setBlock("H3")
                  }
                  small
                >
                  H3
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                  label="Bullet"
                  onClick={() =>
                    exec(
                      "insertUnorderedList"
                    )
                  }
                >
                  •
                </ToolbarButton>
                <ToolbarButton
                  label="Number"
                  onClick={() =>
                    exec(
                      "insertOrderedList"
                    )
                  }
                >
                  1.
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                  label="Left"
                  onClick={() =>
                    exec("justifyLeft")
                  }
                >
                  ⟸
                </ToolbarButton>
                <ToolbarButton
                  label="Center"
                  onClick={() =>
                    exec("justifyCenter")
                  }
                >
                  ⇔
                </ToolbarButton>
                <ToolbarButton
                  label="Right"
                  onClick={() =>
                    exec("justifyRight")
                  }
                >
                  ⟹
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                  label="Page Break"
                  onClick={insertPageBreak}
                >
                  ⤓
                </ToolbarButton>

                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      ...styles.btn,
                      padding:
                        "3px 8px",
                      fontSize: 9,
                      cursor: "pointer",
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    📄 Word
                    <input
                      type="file"
                      accept=".docx"
                      style={{
                        display: "none",
                      }}
                      onChange={(e) => {
                        const f =
                          e.target.files?.[0];
                        if (f)
                          importDocx(f, true);
                      }}
                    />
                  </label>

                  <label
                    style={{
                      ...styles.btn,
                      padding:
                        "3px 8px",
                      fontSize: 9,
                      cursor: "pointer",
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    🌐 HTML
                    <input
                      type="file"
                      accept=".html,.htm,.xhtml"
                      style={{
                        display: "none",
                      }}
                      onChange={(e) => {
                        const f =
                          e.target.files?.[0];
                        if (f)
                          importHTML(
                            f,
                            true
                          );
                      }}
                    />
                  </label>

                  <button
                    style={{
                      ...styles.btnPrimary,
                      padding:
                        "6px 12px",
                      fontSize: 12,
                      height: 28,
                    }}
                    onClick={
                      saveActiveChapterHTML
                    }
                  >
                    Save chapter
                  </button>
                </div>
              </div>

              {/* Editor surface */}
              <div
                style={{
                  padding: 16,
                  background:
                    "linear-gradient(180deg, " +
                    theme.bg +
                    ", #e6ebf2)",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  style={{
                    margin: "0 auto",
                    width: "100%",
                    maxWidth: pageWidthPx,
                    minHeight: 1040,
                    background: "#ffffff",
                    color: "#111",
                    border:
                      "1px solid #e5e7eb",
                    boxShadow:
                      "0 8px 30px rgba(2,20,40,0.10)",
                    borderRadius: 6,
                    padding: `48px ${Math.max(
                      32,
                      Math.min(
                        leftPaddingPx,
                        80
                      )
                    )}px 48px ${Math.max(
                      32,
                      Math.min(
                        rightPaddingPx,
                        80
                      )
                    )}px`,
                    lineHeight: ms.lineHeight,
                    fontFamily:
                      ms.fontFamily,
                    fontSize:
                      ms.fontSizePt *
                      (96 / 72),
                    outline: "none",
                    direction: "ltr",
                    unicodeBidi:
                      "plaintext",
                    whiteSpace: "pre-wrap",
                  }}
                ></div>
              </div>

              <div
                style={{
                  color: theme.subtext,
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: "right",
                }}
              >
                Tip: Use H1/H2/H3 for major
                sections so your contents page
                can build from headings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
