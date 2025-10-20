// src/pages/Publishing.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import PublishingSidebar from "../components/publishing/PublishingSidebar.tsx";

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

const GOOGLE_PALETTE = {
  primary: "#1a73e8",
  accent: "#34a853",
  highlight: "rgba(26,115,232,0.10)",
} as const;

// --- AI API base (top-level/module scope) ---
const AI_API_BASE: string =
  (import.meta as any).env?.VITE_AI_API_BASE ?? "/proof.api";

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

type Meta = { title: string; author: string; year: string; authorLast?: string };

type ManuscriptPresetKey =
  | "Agents_Standard_12pt_TNR_Double"
  | "Nonfiction_Chicago_12pt_TNR_1p5"
  | "Screenplay_Basic_Courier_12pt"
  | "Poetry_Minimal_12pt_Serif";

type PlatformPresetKey =
  | "KDP_Ebook"
  | "KDP_Paperback_6x9"
  | "KDP_Paperback_5x8"
  | "KDP_Paperback_5_5x8_5"
  | "Print_8_5x11"
  | "Draft2Digital_Ebook"
  | "Generic_Manuscript_Submission";

// Added helper types
type NumFmt =
  | "bullet"
  | "decimal"
  | "lowerLetter"
  | "upperLetter"
  | "lowerRoman"
  | "upperRoman"
  | string;
type ChapterGroup = { title: string; content: string[] };

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
    fontFamily: "Georgia, 'Times New Roman', serif",
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
    margins: { top: number; right: number; bottom: number; left: number; gutter?: number };
    headers: boolean;
    footers: boolean;
    pageNumbers: boolean;
    showTOCInEbook: boolean;
  }
> = {
  KDP_Ebook: {
    label: "KDP eBook",
    trim: null,
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
    headers: false,
    footers: false,
    pageNumbers: false,
    showTOCInEbook: true,
  },
  KDP_Paperback_6x9: {
    label: "KDP Paperback (6×9)",
    trim: { widthInch: 6, heightInch: 9 },
    margins: { top: 1, right: 0.75, bottom: 1, left: 0.75, gutter: 0.5 },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_5x8: {
    label: "KDP Paperback (5×8)",
    trim: { widthInch: 5, heightInch: 8 },
    margins: { top: 1, right: 0.75, bottom: 1, left: 0.75, gutter: 0.5 },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  KDP_Paperback_5_5x8_5: {
    label: "KDP Paperback (5.5×8.5)",
    trim: { widthInch: 5.5, heightInch: 8.5 },
    margins: { top: 1, right: 0.75, bottom: 1, left: 0.75, gutter: 0.5 },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  Print_8_5x11: {
    label: "Print (8.5×11)",
    trim: { widthInch: 8.5, heightInch: 11 },
    margins: { top: 1, right: 1, bottom: 1, left: 1, gutter: 0.5 },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
  Draft2Digital_Ebook: {
    label: "Draft2Digital eBook",
    trim: null,
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
    headers: false,
    footers: false,
    pageNumbers: false,
    showTOCInEbook: true,
  },
  Generic_Manuscript_Submission: {
    label: "Generic Manuscript Submission (DOCX)",
    trim: null,
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
    headers: true,
    footers: true,
    pageNumbers: true,
    showTOCInEbook: false,
  },
};

/* ---------- Styles ---------- */
const styles = {
  outer: {
    maxWidth: 1200,
    margin: "32px auto",
    background: "var(--brand-white)",
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(2,20,40,.08)",
    overflow: "hidden",
  } as React.CSSProperties,
  inner: { padding: "20px 24px" } as React.CSSProperties,
  sectionShell: { maxWidth: 1120, margin: "0 auto" } as React.CSSProperties,
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  label: { fontSize: 12, color: theme.subtext } as React.CSSProperties,
  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    background: theme.white,
    color: theme.text,
  } as React.CSSProperties,
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: theme.accent,
    color: theme.white,
    cursor: "pointer",
  } as React.CSSProperties,
  btnDark: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: theme.primary,
    color: theme.white,
    cursor: "pointer",
  } as React.CSSProperties,
  preview: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 16,
    background: theme.bg,
    height: 360,
    overflow: "auto",
  } as React.CSSProperties,
} as const;

type AIKey = "grammar" | "style" | "assistant" | "readability";

const AI_ACTIONS: Array<{
  key: AIKey;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  { key: "grammar", icon: "✍️", title: "Grammar & Clarity", subtitle: "Check grammar, spelling" },
  { key: "style", icon: "🎭", title: "Style Suggestions", subtitle: "Improve flow, tone" },
  { key: "assistant", icon: "✨", title: "AI Writing Assistant", subtitle: "Generate, rewrite text" },
  { key: "readability", icon: "📊", title: "Readability Analysis", subtitle: "Grade level, metrics" },
];

function AIActionButton({
  icon,
  title,
  subtitle,
  onClick,
  busy,
  theme,
  styles,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  busy?: boolean;
  theme: any;
  styles: any;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      disabled={busy}
      onClick={onClick}
      data-testid={`ai-btn-${title.replace(/\s+/g, "-").toLowerCase()}`}
      style={{
        ...styles.btn,
        padding: "10px 14px",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: busy ? 0.7 : 1,
        cursor: busy ? "progress" : "pointer",
        outline: "none",
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !busy) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: theme.subtext, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
          {subtitle}
        </div>
      </div>
      {busy && <span aria-hidden style={{ fontSize: 12, color: theme.subtext }}>Working…</span>}
    </button>
  );
}

/* ---------- Tiny helpers ---------- */
const htmlEscape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/* ---------- Component ---------- */
export default function Publishing(): JSX.Element {
  const [googleMode, setGoogleMode] = useState<boolean>(false);
  const [working, setWorking] = useState<AIKey | null>(null);
  const navigate = useNavigate();

  const [meta, setMeta] = useState<Meta>({
    title: "Working Title",
    author: "Your Name",
    year: new Date().getFullYear().toString(),
    authorLast: "YourLastName",
  });

  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: "c1",
      title: "Chapter 1 – Beginnings",
      included: true,
      text: "The morning held the kind of quiet that asks for a first sentence...",
    },
    {
      id: "c2",
      title: "Chapter 2 – Turning",
      included: true,
      text: "Change arrived softly, a hinge on a well-oiled door...",
    },
    {
      id: "c3",
      title: "Chapter 3 – Night Watch",
      included: false,
      text: "They counted the hours by the cooling of the tea...",
    },
  ]);

  const [matter, setMatter] = useState<Matter>({
    titlePage: "{title}\nby {author}",
    copyright: "© {year} {author}. All rights reserved.",
    dedication: "For those who kept the light on.",
    epigraph: '"We live by stories."',
    toc: true,
    acknowledgments: "Thank you to every early reader.",
    aboutAuthor: "{author} writes stories about family, faith, and becoming.",
    notes: "",
    tocFromHeadings: true,
  });

  const [manuscriptPreset, setManuscriptPreset] =
    useState<ManuscriptPresetKey>("Agents_Standard_12pt_TNR_Double");
  const [platformPreset, setPlatformPreset] =
    useState<PlatformPresetKey>("Generic_Manuscript_Submission");
  const [msOverrides, setMsOverrides] = useState<
    Partial<(typeof MANUSCRIPT_PRESETS)[ManuscriptPresetKey]>
  >({});

  useEffect(() => {
    setMsOverrides((prev) => ({
      ...prev,
      lineHeight: MANUSCRIPT_PRESETS[manuscriptPreset].lineHeight,
    }));
  }, [manuscriptPreset]);

  const ms = { ...MANUSCRIPT_PRESETS[manuscriptPreset], ...msOverrides };
  const pf = PLATFORM_PRESETS[platformPreset];
  const includeHeadersFooters = pf.headers || pf.footers;

  const manuscriptEntries = useMemo(
    () => Object.entries(MANUSCRIPT_PRESETS).map(([k, v]) => [k, v.label] as const),
    []
  );
  const platformEntries = useMemo(
    () => Object.entries(PLATFORM_PRESETS).map(([k, v]) => [k, v.label] as const),
    []
  );

  const platformEntries = useMemo(
    () => Object.entries(PLATFORM_PRESETS).map(([k, v]) => [k, v.label] as const),
    []
  );

  // ↓↓↓ ADD THIS HERE ↓↓↓
  async function runAI<T = any>(path: string, payload: any): Promise<T> {
    const base = AI_API_BASE?.trim();
    if (!base) {
      alert("AI API base is not configured. Set VITE_AI_API_BASE.");
      throw new Error("Missing VITE_AI_API_BASE");
    }
    const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`AI error ${resp.status}: ${text || resp.statusText}`);
    }
    return resp.json();
  }
  // ↑↑↑ ADD THIS HERE ↑↑↑

  
  /* --------------------- Builder: Word-like Editor --------------------- */
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || "");
  const activeIdx = Math.max(0, chapters.findIndex((c) => c.id === activeChapterId));
  const editorRef = useRef<HTMLDivElement>(null);

  const [isWide, setIsWide] = useState<boolean>(window.innerWidth >= 1280);
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load the chapter HTML into the contentEditable when the active chapter changes
  useEffect(() => {
    const chap = chapters[activeIdx];
    const el = editorRef.current;
    if (!chap || !el) return;

    if (!chap.textHTML) {
      const html = `<p>${htmlEscape(chap.text)
        .replaceAll("\n\n", "</p><p>")
        .replaceAll("\n", "<br/>")}</p>`;

      setChapters((prev) => {
        const next = [...prev];
        next[activeIdx] = { ...chap, textHTML: html };
        return next;
      });

      el.innerHTML = html;
    } else {
      el.innerHTML = chap.textHTML;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const setBlock = (tag: "P" | "H1" | "H2" | "H3") => exec("formatBlock", tag);
  const setFont = (family: string) => exec("fontName", family);
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
    if (!editorRef.current) return;
    setChapters((prev) => {
      const next = [...prev];
      const ch = next[activeIdx];
      if (ch) next[activeIdx] = { ...ch, textHTML: editorRef.current!.innerHTML };
      return next;
    });
  };

  const genId = () =>
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as any).randomUUID()
      : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const addChapter = () => {
    setChapters((prev) => {
      const id = genId();
      const ch: Chapter = {
        id,
        title: `Chapter ${prev.length + 1} – Untitled`,
        included: true,
        text: "",
        textHTML: `<h1>Chapter ${prev.length + 1} – Untitled</h1><p>New chapter text…</p>`,
      };
      return [...prev, ch];
    });
  };

  /* ----- Import: DOCX (.docx) and HTML (.html) ----- */
  const importDocx = useCallback(
  async (file: File, asNewChapter: boolean = true) => {
    try {
      if (!file.name.toLowerCase().endsWith(".docx")) {
        alert("Please select a .docx (Word) file.");
        return;
      }

      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);

      // -------- Load main document --------
      let docEntry = zip.file("word/document.xml");
      if (!docEntry) {
        const altKey = Object.keys(zip.files).find((k) =>
          /(^|\/)word\/document\.xml$/i.test(k)
        );
        docEntry = altKey ? zip.file(altKey)! : null;
      }
      if (!docEntry) {
        alert("Could not find word/document.xml inside the file.");
        return;
      }
      const docXml = await docEntry.async("string");
      const xml = new DOMParser().parseFromString(docXml, "application/xml");

      // -------- Relationships (for images) --------
      let relsEntry = zip.file("word/_rels/document.xml.rels");
      if (!relsEntry) {
        const altRel = Object.keys(zip.files).find((k) =>
          /(^|\/)word\/_rels\/document\.xml\.rels$/i.test(k)
        );
        relsEntry = altRel ? zip.file(altRel)! : null;
      }
      const relsXmlStr = relsEntry ? await relsEntry.async("string") : "";
      const relsXml = relsXmlStr
        ? new DOMParser().parseFromString(relsXmlStr, "application/xml")
        : null;
      const relMap = new Map<string, string>();
      if (relsXml) {
        Array.from(relsXml.getElementsByTagName("*"))
          .filter((n) => n.localName === "Relationship")
          .forEach((rel) => {
            const id = rel.getAttribute("Id") || rel.getAttribute("r:id") || "";
            let target = rel.getAttribute("Target") || "";
            if (!id || !target) return;
            if (!/^([a-z]+:)?\/\//i.test(target)) {
              if (!target.startsWith("word/")) target = `word/${target.replace(/^\.?\//, "")}`;
            }
            relMap.set(id, target);
          });
      }

      // -------- Numbering (lists) --------
      let numberingEntry = zip.file("word/numbering.xml");
      if (!numberingEntry) {
        const altNum = Object.keys(zip.files).find((k) =>
          /(^|\/)word\/numbering\.xml$/i.test(k)
        );
        numberingEntry = altNum ? zip.file(altNum)! : null;
      }
      const numberingXmlStr = numberingEntry ? await numberingEntry.async("string") : "";
      const numberingXml = numberingXmlStr
        ? new DOMParser().parseFromString(numberingXmlStr, "application/xml")
        : null;

      const numIdToAbstract = new Map<string, string>();
      const abstractToFmt = new Map<string, NumFmt>();
      if (numberingXml) {
        const nums = Array.from(numberingXml.getElementsByTagName("*")).filter(
          (n) => n.localName === "num"
        );
        for (const num of nums) {
          const numId = num.getAttribute("w:numId") || num.getAttribute("numId") || "";
          const abs = Array.from(num.children).find((c) => c.localName === "abstractNumId");
          const absId = abs?.getAttribute("w:val") || abs?.getAttribute("val") || "";
          if (numId && absId) numIdToAbstract.set(numId, absId);
        }
        const abNums = Array.from(numberingXml.getElementsByTagName("*")).filter(
          (n) => n.localName === "abstractNum"
        );
        for (const a of abNums) {
          const absId = a.getAttribute("w:abstractNumId") || a.getAttribute("abstractNumId") || "";
          const lvl = Array.from(a.getElementsByTagName("*")).find((x) => x.localName === "lvl");
          const fmtNode = lvl
            ? Array.from(lvl!.children).find((x) => x.localName === "numFmt")
            : null;
          const fmt = fmtNode?.getAttribute("w:val") || fmtNode?.getAttribute("val") || "";
          if (absId && fmt) abstractToFmt.set(absId, fmt as NumFmt);
        }
      }

      async function imageDataUrlFromRid(rId: string): Promise<string | null> {
        const path = relMap.get(rId);
        if (!path) return null;
        const f = zip.file(path);
        if (!f) return null;
        const ext = path.toLowerCase().split(".").pop() || "";
        const mime =
          ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "gif"
            ? "image/gif"
            : ext === "bmp"
            ? "image/bmp"
            : ext === "webp"
            ? "image/webp"
            : "application/octet-stream";
        const base64 = await f.async("base64");
        return `data:${mime};base64,${base64}`;
      }

      async function renderParagraphInner(p: Element): Promise<string> {
        const parts: string[] = [];
        const imagePromises: Promise<void>[] = [];

        const walk = (node: Element) => {
          if (node.localName === "t") {
            parts.push(htmlEscape(node.textContent || ""));
          } else if (node.localName === "br") {
            parts.push("<br/>");
          } else if (node.localName === "drawing") {
            const blips = Array.from(node.getElementsByTagName("*")).filter(
              (n) => n.localName === "blip"
            );
            imagePromises.push(
              (async () => {
                for (const b of blips) {
                  const rid = b.getAttribute("r:embed") || b.getAttribute("embed");
                  if (!rid) continue;
                  const url = await imageDataUrlFromRid(rid);
                  if (url) parts.push(`<img src="${url}" alt="image"/>`);
                }
              })()
            );
          } else {
            for (const c of Array.from(node.children)) walk(c);
          }
        };

        for (const c of Array.from(p.children)) walk(c);
        if (imagePromises.length) await Promise.all(imagePromises);

        const html = parts.join("");
        return html || "<br/>";
      }

      // -------- Parse paragraphs into chapters (by Heading 1) --------
      const paras = Array.from(xml.getElementsByTagName("*")).filter((n) => n.localName === "p");

      let listOpenType: "ul" | "ol" | null = null;
      let listBuffer: string[] = [];
      function flushListIfOpen(target: string[]) {
        if (listOpenType && listBuffer.length) {
          target.push(
            listOpenType === "ul"
              ? `<ul>${listBuffer.join("")}</ul>`
              : `<ol>${listBuffer.join("")}</ol>`
          );
        }
        listOpenType = null;
        listBuffer = [];
      }

      const chapterGroups: ChapterGroup[] = [];
      let currentChapter: ChapterGroup | null = null;

      for (const p of paras) {
        let styleVal = "";
        let numId = "";
        const pPr = Array.from(p.children).find((n) => n.localName === "pPr");
        if (pPr) {
          const pStyle = Array.from(pPr.children).find((n) => n.localName === "pStyle");
          if (pStyle) styleVal = pStyle.getAttribute("w:val") || pStyle.getAttribute("val") || "";
          const numPr = Array.from(pPr.children).find((n) => n.localName === "numPr");
          if (numPr) {
            const numIdNode = Array.from(numPr.children).find((n) => n.localName === "numId");
            if (numIdNode)
              numId = numIdNode.getAttribute("w:val") || numIdNode.getAttribute("val") || "";
          }
        }

        const runs = Array.from(p.getElementsByTagName("*")).filter((n) => n.localName === "t");
        const plainText = runs.map((r) => r.textContent || "").join("");
        const isBlank = !plainText.trim();

        const isH1 = /heading\s*1/i.test(styleVal);
        const isH2 = /heading\s*2/i.test(styleVal);
        const isH3 = /heading\s*3/i.test(styleVal);

        let isListItem = false;
        let listType: "ul" | "ol" | null = null;
        if (numId) {
          isListItem = true;
          const abs = numIdToAbstract.get(numId) || "";
          const fmt = (abs && abstractToFmt.get(abs)) || "";
          listType = /^bullet$/i.test(fmt) ? "ul" : "ol";
        } else if (/listparagraph/i.test(styleVal)) {
          isListItem = true;
          listType = "ul";
        }

        if (isH1) {
          if (currentChapter) flushListIfOpen(currentChapter.content);
          if (currentChapter) chapterGroups.push(currentChapter);
          currentChapter = { title: plainText || "Untitled", content: [] };
          currentChapter.content.push(`<h1>${htmlEscape(plainText || "Untitled")}</h1>`);
          continue;
        }

        if (!currentChapter) currentChapter = { title: "Imported Content", content: [] };

        if (isBlank) {
          flushListIfOpen(currentChapter.content);
          currentChapter.content.push("<p><br/></p>");
          continue;
        }

        const innerHtml = await renderParagraphInner(p);

        if (isListItem && listType) {
          if (listOpenType !== listType) {
            flushListIfOpen(currentChapter.content);
            listOpenType = listType;
          }
          listBuffer.push(`<li>${innerHtml}</li>`);
        } else {
          flushListIfOpen(currentChapter.content);
          if (isH2) currentChapter.content.push(`<h2>${htmlEscape(plainText)}</h2>`);
          else if (isH3) currentChapter.content.push(`<h3>${htmlEscape(plainText)}</h3>`);
          else currentChapter.content.push(`<p>${innerHtml}</p>`);
        }
      }

      if (currentChapter) {
        flushListIfOpen(currentChapter.content);
        chapterGroups.push(currentChapter);
      }

      const fallbackHtml =
        chapterGroups.length === 1 &&
        chapterGroups[0].title === "Imported Content" &&
        !(chapterGroups[0].content[0] || "").startsWith("<h1")
          ? chapterGroups[0].content.join("\n")
          : null;

      if (!chapterGroups.length && !fallbackHtml) {
        alert("No content found in document.");
        return;
      }

      // -------- Insert into app state --------
      if (asNewChapter) {
        if (fallbackHtml) {
          // One chapter
          const id = genId();
          const ch: Chapter = {
            id,
            title: file.name.replace(/\.docx$/i, "") || "Imported DOCX",
            included: true,
            text: "",
            textHTML: fallbackHtml,
          };
          setChapters((prev) => [...prev, ch]);
          setActiveChapterId(id);
          navigate("/format"); // ← jump to Manuscript page
        } else {
          // Multiple chapters grouped by H1
          const newChapters = chapterGroups.map((g) => ({
            id: genId(),
            title: g.title,
            included: true,
            text: "",
            textHTML: g.content.join("\n"),
          }));
          setChapters((prev) => [...prev, ...newChapters]);
          setActiveChapterId(newChapters[0].id);
          navigate("/format"); // ← jump to Manuscript page
        }
      } else {
        // Replace current chapter
        const htmlToUse =
          fallbackHtml ?? chapterGroups.map((g) => g.content.join("\n")).join("\n");
        setChapters((prev) => {
          const next = [...prev];
          const ch = next[activeIdx];
          if (ch) {
            next[activeIdx] = {
              ...ch,
              textHTML: htmlToUse,
              title: ch.title || file.name.replace(/\.docx$/i, "") || "Imported DOCX",
            };
          }
          return next;
        });
        navigate("/format"); // ← jump to Manuscript page
      }
    } catch (err) {
      console.error(err);
      alert("Sorry—import failed. The file may be malformed or not a valid .docx.");
    }
  },
  [activeIdx, navigate, setChapters, setActiveChapterId]
);

  // ---- HTML import ----
  const importHTML = useCallback(
    async (file: File, asNewChapter: boolean = true) => {
      try {
        const html = await file.text();

        if (asNewChapter) {
          const id = genId();
          const ch: Chapter = {
            id,
            title: file.name.replace(/\.(html?|xhtml)$/i, "") || "Imported HTML",
            included: true,
            text: "",
            textHTML: html,
          };
          setChapters((prev) => [...prev, ch]);
          setActiveChapterId(id);
        } else {
          setChapters((prev) => {
            const next = [...prev];
            const cur = next[activeIdx];
            if (cur) {
              next[activeIdx] = {
                ...cur,
                textHTML: html,
                title: cur.title || file.name.replace(/\.(html?|xhtml)$/i, "") || "Imported HTML",
              };
            }
            return next;
          });
        }
      } catch (err) {
        console.error(err);
        alert("Sorry—import failed. The file may be malformed or unreadable.");
      }
    },
    [activeIdx, setChapters, setActiveChapterId]
  );

  /* ---------- Compile (Preview/Export) ---------- */
  const tocFromHeadings: string[] = useMemo(() => {
    if (!matter.tocFromHeadings) return [];
    const items: string[] = [];
    chapters.forEach((c) => {
      if (!c.included) return;
      const html = c.textHTML || `<p>${htmlEscape(c.text)}</p>`;
      const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
      const hs = Array.from(dom.querySelectorAll("h1, h2, h3"));
      if (hs.length === 0) {
        items.push(c.title);
      } else {
        hs.forEach((h) => items.push(h.textContent || ""));
      }
    });
    return items.filter(Boolean);
  }, [chapters, matter.tocFromHeadings]);

  const compiledPlain: string = useMemo(() => {
    const parts: string[] = [];
    const vars = (s: string) =>
      s.replaceAll("{title}", meta.title).replaceAll("{author}", meta.author).replaceAll("{year}", meta.year);

    parts.push(vars(matter.titlePage));
    parts.push("\n\n" + vars(matter.copyright));
    if (matter.dedication) parts.push("\n\nDedication\n" + matter.dedication);
    if (matter.epigraph) parts.push("\n\nEpigraph\n" + matter.epigraph);
    if (matter.toc) {
      const tocList = matter.tocFromHeadings
        ? tocFromHeadings
        : chapters.filter((c) => c.included).map((c) => c.title);
      parts.push("\n\nContents\n" + tocList.map((t, i) => `${i + 1}. ${t}`).join("\n"));
    }

    chapters.forEach((c) => {
      if (!c.included) return;
      const textNoTags = c.textHTML ? stripHtml(c.textHTML) : c.text;
      parts.push("\n\n" + c.title + "\n" + textNoTags);
    });

    if (matter.acknowledgments) parts.push("\n\nAcknowledgments\n" + matter.acknowledgments);
    if (matter.aboutAuthor) parts.push("\n\nAbout the Author\n" + vars(matter.aboutAuthor));
    if (matter.notes) parts.push("\n\nNotes\n" + matter.notes);

    return parts.join("\n").trim();
  }, [chapters, matter, meta, tocFromHeadings]);

  const wordCount = useMemo(() => compiledPlain.split(/\s+/).filter(Boolean).length, [compiledPlain]);

  /* ---------- UI ---------- */
  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
        ...(googleMode
          ? ({
              ["--brand-primary" as any]: GOOGLE_PALETTE.primary,
              ["--brand-accent" as any]: GOOGLE_PALETTE.accent,
              ["--brand-highlight" as any]: GOOGLE_PALETTE.highlight,
            } as React.CSSProperties)
          : {}),
      }}
    >
      <div style={styles.outer}>
        <div
          style={{
            background: "rgba(202, 177, 214, 0.4)",
            backdropFilter: "blur(12px)",
            color: theme.white,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate(-1)}
              style={{
                ...styles.btn,
                border: "none",
                background: theme.gold,
                color: theme.white,
                padding: "10px 18px",
                fontSize: 15,
                fontWeight: 600,
              }}
              aria-label="Go back"
            >
              ← Back
            </button>

            <div
              style={{
                textAlign: "center",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 2h9a3 3 0 0 1 3 3v12.5a1.5 1.5 0 0 1-1.5 1.5H7a3 3 0 0 0-3 3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v13.764A4.99 4.99 0 0 1 7 18h9V5a1 1 0 0 0-1-1H6z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: 0.4, fontFamily: "Garamond, Georgia, serif" }}>
                Publishing Suite
              </h1>
            </div>
            <div style={{ width: 110 }} />
          </div>
        </div>

        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isWide ? "1fr 220px" : "1fr",
              gap: 24,
            }}
          >
            <main>
              <div style={{ ...styles.glassCard, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: theme.text, fontWeight: 600 }}>
                  📚 Publishing Tools
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  <button
                    style={{
                      ...styles.btn,
                      padding: "10px 14px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onClick={() => navigate("/proof")}
                  >
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Proof & Consistency</div>
                      <div style={{ fontSize: 11, color: theme.subtext }}>Grammar, style, timeline</div>
                    </div>
                  </button>

                  <button
                    style={{
                      ...styles.btn,
                      padding: "10px 14px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onClick={() => navigate("/format")}
                  >
                    <span style={{ fontSize: 20 }}>🎨</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Format & Styles</div>
                      <div style={{ fontSize: 11, color: theme.subtext }}>Fonts, spacing, margins</div>
                    </div>
                  </button>

                  <button
                    style={{
                      ...styles.btn,
                      padding: "10px 14px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onClick={() => navigate("/export")}
                  >
                    <span style={{ fontSize: 20 }}>📦</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Export</div>
                      <div style={{ fontSize: 11, color: theme.subtext }}>PDF, DOCX, EPUB</div>
                    </div>
                  </button>

                  <button
                    style={{
                      ...styles.btn,
                      padding: "10px 14px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onClick={() => navigate("/publishing-prep")}
                  >
                    <span style={{ fontSize: 20 }}>🚀</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Publishing Prep</div>
                      <div style={{ fontSize: 11, color: theme.subtext }}>Query, synopsis, marketing</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 🤖 AI Tools */}
              <div style={{ ...styles.glassCard, marginBottom: 16 }}>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 16,
                    color: theme.text,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                 <h3>
  <span aria-hidden>🤖</span> AI Tools
</h3>

<div
  role="group"
  aria-label="AI tools"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  }}
>
  {AI_ACTIONS.map((a) => (
    <AIActionButton
      key={a.key}
      icon={a.icon}
      title={a.title}
      subtitle={a.subtitle}
      busy={working === a.key}
      theme={theme}
      styles={styles}
      onClick={async () => {
        if (working) return;
        setWorking(a.key);
        try {
          const currentHtml = editorRef.current?.innerHTML ?? "";
          const res = await runAI<{ html?: string }>(a.key, {
            chapterId: chapters[activeIdx]?.id,
            title: chapters[activeIdx]?.title,
            html: currentHtml,
            meta,
          });
          const improved = res?.html ?? currentHtml;
          if (editorRef.current) editorRef.current.innerHTML = improved;
          setChapters((prev) => {
            const next = [...prev];
            const ch = next[activeIdx];
            if (ch) next[activeIdx] = { ...ch, textHTML: improved };
            return next;
          });
        } catch (e: any) {
          alert(e?.message || "Sorry—something went wrong running that AI tool.");
        } finally {
          setWorking(null);
        }
      }}
    />
  ))}
</div>  {/* ← end of grid */}

/* ↓↓↓ INSERT THIS RIGHT HERE ↓↓↓ */
<div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
  <button
    style={{ ...styles.btnDark }}
    disabled={working !== null}
    onClick={async () => {
      if (working) return;
      setWorking("assistant");
      try {
        const chaptersPlain = chapters
          .filter((c) => c.included)
          .map((c) => ({
            id: c.id,
            title: c.title,
            text: c.textHTML ? stripHtml(c.textHTML) : c.text,
          }));

        const res = await runAI<{ prep?: any }>("publishing-prep", {
          meta,
          matter,
          chapters: chaptersPlain,
          options: { tone: "professional/warm", audience: "agents_and_publishers" },
        });
        if (!res?.prep) throw new Error("No prep content returned from AI.");
        navigate("/publishing-prep", { state: { generated: res.prep } });
      } catch (e: any) {
        alert(e?.message || "Couldn’t generate publishing prep.");
      } finally {
        setWorking(null);
      }
    }}
  >
    ✨ Generate Publishing Prep
  </button>
</div>
/* ↑↑↑ END INSERT ↑↑↑ */


                          if (!resp.ok) {
                            const errText = await resp.text();
                            throw new Error(`AI endpoint error (${resp.status}): ${errText}`);
                          }

                          const data: { html?: string } = await resp.json();
                          const improved = data?.html ?? currentHtml;

                          if (editorRef.current) {
                            editorRef.current.innerHTML = improved;
                          }

                          setChapters((prev) => {
                            const next = [...prev];
                            const ch = next[activeIdx];
                            if (ch) next[activeIdx] = { ...ch, textHTML: improved };
                            return next;
                          });
                        } catch (e) {
                          console.error(e);
                          alert("Sorry—something went wrong running that AI tool.");
                        } finally {
                          setWorking(null);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Editor + Chapters */}
              <div style={{ ...styles.glassCard, marginBottom: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: isWide ? "220px 1fr" : "1fr",
                  }}
                >
                  {isWide && (
                    <aside>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: theme.text, fontSize: 13 }}>Chapters</div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {chapters.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setActiveChapterId(c.id)}
                            style={{
                              textAlign: "left",
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: `1px solid ${c.id === activeChapterId ? theme.accent : theme.border}`,
                              background: c.id === activeChapterId ? theme.highlight : theme.white,
                              color: theme.text,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                            title={c.title}
                          >
                            {c.included ? "✅ " : "🚫 "} {c.title}
                          </button>
                        ))}
                        <button onClick={addChapter} style={{ ...styles.btnPrimary, marginTop: 6, fontSize: 12 }}>
                          + Add Chapter
                        </button>
                      </div>
                    </aside>
                  )}

                  <<section>
                    {/* Toolbar (sticky) */}
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
                        onChange={(e) => setFont(e.target.value)}
                        defaultValue="Times New Roman"
                        style={{ ...(styles.input as any), width: 120, padding: "3px 5px", fontSize: 10, height: 24 }}
                      >
                        <option>Times New Roman</option>
                        <option>Georgia</option>
                        <option>Garamond</option>
                        <option>Palatino</option>
                        <option>Calibri</option>
                        <option>Arial</option>
                      </select>
                  
                      <select
                        onChange={(e) => setFontSizePt(parseInt(e.target.value, 10))}
                        defaultValue="16"
                        style={{ ...(styles.input as any), width: 45, padding: "3px 4px", fontSize: 10, height: 24 }}
                      >
                        <option value="14">14</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                        <option value="20">20</option>
                        <option value="22">22</option>
                      </select>
                  
                      <div style={{ width: 1, height: 16, background: theme.border, margin: "0 2px" }} />
                  
                      <button
                        style={{ ...styles.btn, padding: "3px 6px", fontSize: 10, fontWeight: 700, minWidth: 24, height: 24 }}
                        onClick={() => exec("bold")}
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 6px", fontSize: 10, minWidth: 24, height: 24 }}
                        onClick={() => exec("italic")}
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 6px", fontSize: 10, minWidth: 24, height: 24 }}
                        onClick={() => exec("underline")}
                        title="Underline"
                      >
                        <u>U</u>
                      </button>
                  
                      <div style={{ width: 1, height: 16, background: theme.border, margin: "0 2px" }} />
                  
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => setBlock("H1")}
                        title="H1"
                      >
                        H1
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => setBlock("H2")}
                        title="H2"
                      >
                        H2
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => setBlock("H3")}
                        title="H3"
                      >
                        H3
                      </button>
                  
                      <div style={{ width: 1, height: 16, background: theme.border, margin: "0 2px" }} />
                  
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => exec("insertUnorderedList")}
                        title="Bullet"
                      >
                        •
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => exec("insertOrderedList")}
                        title="Number"
                      >
                        1.
                      </button>
                  
                      <div style={{ width: 1, height: 16, background: theme.border, margin: "0 2px" }} />
                  
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => exec("justifyLeft")}
                        title="Left"
                      >
                        ⟸
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => exec("justifyCenter")}
                        title="Center"
                      >
                        ⇔
                      </button>
                      <button
                        style={{ ...styles.btn, padding: "3px 5px", fontSize: 9, minWidth: 24, height: 24 }}
                        onClick={() => exec("justifyRight")}
                        title="Right"
                      >
                        ⟹
                      </button>
                  
                      <div style={{ width: 1, height: 16, background: theme.border, margin: "0 2px" }} />
                  
                      <button
                        style={{ ...styles.btn, padding: "3px 7px", fontSize: 9, height: 24 }}
                        onClick={insertPageBreak}
                        title="Page Break"
                      >
                        ⤓
                      </button>
                  
                      {/* Right-side: uploads + Save */}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <label
                          style={{ ...styles.btn, padding: "3px 8px", fontSize: 9, cursor: "pointer", height: 24, display: "flex", alignItems: "center" }}
                        >
                          📄 Word
                          <input
                            type="file"
                            accept=".docx"
                            style={{ display: "none" }}
                            onChange={(e) => e.target.files && importDocx(e.target.files[0], true)}
                          />
                        </label>
                  
                        <label
                          style={{ ...styles.btn, padding: "3px 8px", fontSize: 9, cursor: "pointer", height: 24, display: "flex", alignItems: "center" }}
                        >
                          🌐 HTML
                          <input
                            type="file"
                            accept=".html,.htm,.xhtml"
                            style={{ display: "none" }}
                            onChange={(e) => e.target.files && importHTML(e.target.files[0], true)}
                          />
                        </label>
                  
                        <button
                          style={{ ...styles.btnPrimary, padding: "6px 12px", fontSize: 12, height: 28 }}
                          onClick={saveActiveChapterHTML}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  
                    {/* Editor canvas wrapper */}
                    <div
                      style={{
                        padding: 16,
                        background: `linear-gradient(180deg, ${theme.bg}, #e6ebf2)`,
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
                          maxWidth: 800,
                          minHeight: 1040,
                          background: "#ffffff",
                          color: "#111",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
                          borderRadius: 6,
                          padding: "48px 48px",
                          lineHeight: ms.lineHeight,
                          fontFamily: ms.fontFamily,
                          fontSize: ms.fontSizePt * (96 / 72),
                          outline: "none",
                          direction: "ltr",
                          unicodeBidi: "plaintext",
                          whiteSpace: "pre-wrap",
                        }}
                      />
                    </div>
                  
                    <div style={{ color: theme.subtext, fontSize: 12, marginTop: 6 }}>
                      Tip: Use H1/H2/H3 for sections — if "Build Contents from Headings" is on, your TOC will include them.
                    </div>
                  </section>

              <div style={styles.glassCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: theme.text }}>Chapter Management</h3>
                  <button style={styles.btnPrimary} onClick={addChapter}>+ Add Chapter</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {chapters.map((c, i) => (
                    <div key={c.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14, background: c.included ? theme.white : "#F9FBFD" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{c.title}</div>
                          <div style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>
                            {(c.textHTML ? stripHtml(c.textHTML) : c.text).slice(0, 100)}…
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <button
                              style={{ ...styles.btn, padding: "6px 8px" }}
                              onClick={() =>
                                setChapters((prev) => {
                                  const next = [...prev];
                                  const to = Math.max(0, Math.min(next.length - 1, i - 1));
                                  const [item] = next.splice(i, 1);
                                  next.splice(to, 0, item);
                                  return next;
                                })
                              }
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              style={{ ...styles.btn, padding: "6px 8px" }}
                              onClick={() =>
                                setChapters((prev) => {
                                  const next = [...prev];
                                  const to = Math.max(0, Math.min(next.length - 1, i + 1));
                                  const [item] = next.splice(i, 1);
                                  next.splice(to, 0, item);
                                  return next;
                                })
                              }
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          <Toggle
                            checked={c.included}
                            onChange={(v) => setChapters((prev) => prev.map((x) => (x.id === c.id ? { ...x, included: v } : x)))}
                            label={c.included ? "Included" : "Excluded"}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button style={styles.btn} onClick={() => setActiveChapterId(c.id)}>Open</button>
                        <label style={{ ...styles.btn, cursor: "pointer" }}>
                          Replace with .docx
                          <input
                            type="file"
                            accept=".docx"
                            style={{ display: "none" }}
                            onChange={(e) => e.target.files && importDocx(e.target.files[0], false)}
                          />
                        </label>
                        <label style={{ ...styles.btn, cursor: "pointer" }}>
                          Replace with .html
                          <input
                            type="file"
                            accept=".html,.htm,.xhtml"
                            style={{ display: "none" }}
                            onChange={(e) => e.target.files && importHTML(e.target.files[0], false)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {isWide && (
              <PublishingSidebar
                meta={meta}
                setMeta={setMeta}
                matter={matter}
                setMatter={setMatter}
                manuscriptPreset={manuscriptPreset}
                setManuscriptPreset={setManuscriptPreset}
                platformPreset={platformPreset}
                setPlatformPreset={setPlatformPreset}
                includeHeadersFooters={includeHeadersFooters}
                wordCount={wordCount}
                ms={ms}
                setMsOverrides={setMsOverrides}
                manuscriptEntries={Object.entries(MANUSCRIPT_PRESETS).map(([k, v]) => [k, v.label] as const)}
                platformEntries={Object.entries(PLATFORM_PRESETS).map(([k, v]) => [k, v.label] as const)}
                googleMode={googleMode}
                setGoogleMode={setGoogleMode}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ---------- Small UI helpers (kept at bottom for clarity) ---------- */
type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: checked ? theme.highlight : theme.white,
        color: theme.text,
        cursor: "pointer",
      }}
      aria-pressed={checked}
      title={label}
      type="button"
    >
      <span
        style={{
          width: 36,
          height: 20,
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
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: theme.white,
            transition: "left .15s ease",
          }}
        />
      </span>
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
    </button>
  );
};

/* ---------- utilities ---------- */
function safeFile(name: string): string {
  return (name || "manuscript").replace(/[^\w\-]+/g, "_");
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}
