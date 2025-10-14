// src/pages/Publishing.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import AeroBanner from "../components/layout/AeroBanner.tsx";
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
} as const;

// Optional Google palette (used only if you wire it later via CSS var overrides)
const GOOGLE_PALETTE = {
  primary: "#1a73e8", // Google Blue 600
  accent: "#34a853",  // Google Green 600
  highlight: "rgba(26,115,232,0.10)",
} as const;

/* ---------- Types ---------- */
type StepKey = "builder" | "proof" | "format" | "export" | "prep";

/** Now supports HTML text for rich editing */
type Chapter = {
  id: string;
  title: string;
  included: boolean;
  text: string;        // legacy plain text
  textHTML?: string;   // new: rich HTML (preferred if present)
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
  tocFromHeadings?: boolean; // new: build TOC from <h1>-<h3>
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

/* ---------- Presets ---------- */
const MANUSCRIPT_PRESETS: Record<
  ManuscriptPresetKey,
  {
    label: string;
    fontFamily: string;
    fontSizePt: number;
    lineHeight: number; // 2.0 = double, 1.5 = single-ish
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

/* ---------- Small UI helpers (restored) ---------- */
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

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};
const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      <div style={{ color: theme.subtext, fontSize: 12 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        rows={label.length > 12 ? 3 : 2}
        placeholder={placeholder}
        style={{
          width: "100%",
          marginTop: 6,
          fontSize: 14,
          padding: 10,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          background: theme.white,
          color: theme.text,
        }}
      />
    </div>
  );
};

/* ---------- Tiny helpers ---------- */
const htmlEscape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/* ---------- Component ---------- */
const STEPS: { key: StepKey; label: string }[] = [
  { key: "builder", label: "Manuscript Builder" },
  { key: "proof", label: "Proof & Consistency" },
  { key: "format", label: "Format & Styles" },
  { key: "export", label: "Export" },
  { key: "prep", label: "Publishing Prep" },
];

export default function Publishing(): JSX.Element {
  // Brand/Google toggle
  const [googleMode, setGoogleMode] = useState<boolean>(false);
  const navigate = useNavigate();

  // nav tabs
  const [step, setStep] = useState<StepKey>("builder");
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  function onKeyDownTabs(e: React.KeyboardEvent<HTMLDivElement>) {
    const current = STEPS.findIndex((s) => s.key === step);
    if (current < 0) return;
    let next = current;
    if (e.key === "ArrowRight") next = (current + 1) % STEPS.length;
    if (e.key === "ArrowLeft") next = (current - 1 + STEPS.length) % STEPS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = STEPS.length - 1;
    if (next !== current) {
      e.preventDefault();
      setStep(STEPS[next].key);
      tabRefs.current[next]?.focus();
    }
  }
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].key);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)].key);

  // meta + content (SIDEBAR SECTIONS)
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

  // presets + overrides (SIDEBAR SECTION)
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

  // options for dropdowns (smaller to pass to sidebar)
  const manuscriptEntries = useMemo(
    () => Object.entries(MANUSCRIPT_PRESETS).map(([k, v]) => [k, v.label] as const),
    []
  );
  const platformEntries = useMemo(
    () => Object.entries(PLATFORM_PRESETS).map(([k, v]) => [k, v.label] as const),
    []
  );

  /* --------------------- Builder: Word-like Editor --------------------- */
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || "");
  const activeIdx = Math.max(0, chapters.findIndex((c) => c.id === activeChapterId));
  const editorRef = useRef<HTMLDivElement>(null);

  // Single breakpoint controlling sidebar visibility
  const [isWide, setIsWide] = useState<boolean>(window.innerWidth >= 1280);
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Ensure active chapter has editable HTML loaded
  useEffect(() => {
    const chap = chapters[activeIdx];
    if (!chap) return;
    if (!chap.textHTML) {
      const html = `<p>${htmlEscape(chap.text).replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br/>")}</p>`;
      setChapters((prev) => {
        const next = [...prev];
        next[activeIdx] = { ...chap, textHTML: html };
        return next;
      });
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
    async (file: File, asNewChapter = true) => {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (!docXml) {
        alert("Could not read Word document.xml");
        return;
      }
      const xml = new DOMParser().parseFromString(docXml, "text/xml");
      const paras = Array.from(xml.getElementsByTagName("*")).filter((n) => n.localName === "p");
      const out: string[] = [];
      for (const p of paras) {
        let styleVal = "";
        const pPr = Array.from(p.children).find((n) => n.localName === "pPr");
        if (pPr) {
          const pStyle = Array.from(pPr.children).find((n) => n.localName === "pStyle");
          if (pStyle) styleVal = pStyle.getAttribute("w:val") || pStyle.getAttribute("val") || "";
        }
        const runs = Array.from(p.getElementsByTagName("*")).filter((n) => n.localName === "t");
        const text = runs.map((r) => r.textContent || "").join("");
        if (!text.trim()) {
          out.push("<p><br/></p>");
          continue;
        }
        if (/Heading1/i.test(styleVal)) out.push(`<h1>${htmlEscape(text)}</h1>`);
        else if (/Heading2/i.test(styleVal)) out.push(`<h2>${htmlEscape(text)}</h2>`);
        else if (/Heading3/i.test(styleVal)) out.push(`<h3>${htmlEscape(text)}</h3>`);
        else out.push(`<p>${htmlEscape(text)}</p>`);
      }
      const html = out.join("\n");

      if (asNewChapter) {
        setChapters((prev) => {
          const id = genId();
          const ch: Chapter = {
            id,
            title: file.name.replace(/\.docx$/i, ""),
            included: true,
            text: "",
            textHTML: html,
          };
          setActiveChapterId(id);
          return [...prev, ch];
        });
      } else {
        setChapters((prev) => {
          const next = [...prev];
          const ch = next[activeIdx];
          if (ch)
            next[activeIdx] = {
              ...ch,
              textHTML: html,
              title: ch.title || file.name.replace(/\.docx$/i, ""),
            };
          return next;
        });
      }
    },
    [activeIdx]
  );

  const importHTML = useCallback(
    async (file: File, asNewChapter = true) => {
      const text = await file.text();
      const html = text;
      if (asNewChapter) {
        setChapters((prev) => {
          const id = genId();
          const ch: Chapter = {
            id,
            title: file.name.replace(/\.(html?|xhtml)$/i, ""),
            included: true,
            text: "",
            textHTML: html,
          };
          setActiveChapterId(id);
          return [...prev, ch];
        });
      } else {
        setChapters((prev) => {
          const next = [...prev];
          const ch = next[activeIdx];
          if (ch)
            next[activeIdx] = {
              ...ch,
              textHTML: html,
              title: ch.title || file.name.replace(/\.(html?|xhtml)$/i, ""),
            };
          return next;
        });
      }
    },
    [activeIdx]
  );

  /* ---------- Compile (Preview/Export) ---------- */

  // Build a TOC from headings if enabled
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

  // Plain-text compilation
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

  // Rich HTML preview
  const compiledHTML: string = useMemo(() => {
    const vars = (s: string) =>
      s.replaceAll("{title}", meta.title).replaceAll("{author}", meta.author).replaceAll("{year}", meta.year);

    const front = [
      vars(matter.titlePage),
      vars(matter.copyright),
      matter.dedication && `Dedication\n${matter.dedication}`,
      matter.epigraph && `Epigraph\n${matter.epigraph}`,
    ]
      .filter(Boolean)
      .map((s) => `<p>${htmlEscape(String(s)).replaceAll("\n", "<br/>")}</p>`)
      .join("\n");

    const toc = matter.toc
      ? `<h2 class="chapter" style="page-break-before: always">Contents</h2><p>${
          (matter.tocFromHeadings
            ? tocFromHeadings
            : chapters.filter((c) => c.included).map((c) => c.title)
          )
            .map((t, i) => `${i + 1}. ${htmlEscape(t)}`)
            .join("<br/>")
        }</p>`
      : "";

    const chapterized = chapters
      .filter((c) => c.included)
      .map((c) => {
        const title = c.title;
        const bodyHTML =
          c.textHTML ??
          `<p>${htmlEscape(c.text).replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br/>")}</p>`;
        return `<h2 class="chapter">${htmlEscape(title)}</h2>${bodyHTML}`;
      })
      .join("\n");

    const back = [
      matter.acknowledgments && `<h2 class="chapter">Acknowledgments</h2><p>${htmlEscape(matter.acknowledgments).replaceAll("\n", "<br/>")}</p>`,
      matter.aboutAuthor && `<h2 class="chapter">About the Author</h2><p>${htmlEscape(matter.aboutAuthor).replaceAll("\n", "<br/>")}</p>`,
      matter.notes && `<h2 class="chapter">Notes</h2><p>${htmlEscape(matter.notes).replaceAll("\n", "<br/>")}</p>`,
    ]
      .filter(Boolean)
      .join("\n");

    const css = `
      @page { margin: ${pf.margins.top}in ${pf.margins.right}in ${pf.margins.bottom}in ${pf.margins.left}in; }
      body { font-family: ${ms.fontFamily}; font-size: ${ms.fontSizePt}pt; margin: 0; line-height: ${ms.lineHeight}; color: #111; }
      p { orphans: 3; widows: 3; ${ms.align === "justify" ? "text-align: justify;" : ""} ${
      ms.firstLineIndentInches ? `text-indent: ${ms.firstLineIndentInches}in;` : ""
    } ${ms.paragraphSpacingPt ? `margin: 0 0 ${ms.paragraphSpacingPt}pt 0;` : ""} }
      h1, h2, h3 { margin: 0 0 0.6em 0; }
      h2.chapter { ${ms.chapterStartsOnNewPage ? "page-break-before: always;" : ""} text-align:center; margin: 0 0 1.2em 0; font-weight: bold; }
      hr { border: 0; border-top: 1px dashed #e5e7eb; margin: 1.2em 0; }
    `;

    const titleBlock = `
      <div style="text-align:center; font-size:${ms.fontSizePt + 4}pt; font-weight:bold; margin-bottom: 1.5em;">${htmlEscape(meta.title)}</div>
      <div style="text-align:center; margin-bottom: 2em;">by ${htmlEscape(meta.author)} • ${htmlEscape(meta.year)}</div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${htmlEscape(
      meta.title
    )}</title><style>${css}</style></head><body>${titleBlock}${front}${toc}${chapterized}${back}</body></html>`;
  }, [chapters, matter, meta, ms, pf, tocFromHeadings]);

  /* ---------- Proof helpers (unchanged) ---------- */
  const [proofResults, setProofResults] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  function runLocalChecks() {
    const issues: string[] = [];
    const compiled = compiledPlain;
    if (compiled.match(/ {2,}/)) issues.push("Multiple consecutive spaces found.");
    if (compiled.match(/[""]/) && !compiled.match(/['']/))
      issues.push("Smart quotes present; ensure consistency of curly quotes.");
    if (compiled.match(/--/)) issues.push("Double hyphen found; consider an em dash (—) or a period.");
    const longParas = compiled.split("\n\n").filter((p) => p.split(/\s+/).length > 250).length;
    if (longParas) issues.push(`${longParas} very long paragraph(s); consider breaking them up.`);
    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  async function runAIChecks() {
    setAiBusy(true);
    const compiled = compiledPlain;
    const suggestions: string[] = [];
    if (compiled.match(/\bi\b(?![a-zA-Z])/g)) suggestions.push("Pronoun 'I' should be capitalized.");
    if (compiled.match(/\s[,.!?;:]/g)) suggestions.push("Punctuation spacing: remove spaces before , . ! ? ; :");
    if (compiled.match(/\bvery\b/gi)) suggestions.push("Style: Consider replacing 'very' with stronger wording.");
    if (meta.title.length < 3) suggestions.push("Title seems short—consider something more descriptive.");
    runLocalChecks();
    setProofResults((prev) => [...prev, ...suggestions]);
    setAiBusy(false);
  }

  /* ---------- Exports ---------- */
  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(compiledHTML);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 200);
  };

  const exportDOCX = async () => {
    const { saveAs } = await import("file-saver");
    const docx = await import("docx");
    const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, convertInchesToTwip } = docx as any;

    const children: any[] = [
      new Paragraph({ text: meta.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `by ${meta.author}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `${meta.year}`, alignment: AlignmentType.CENTER }),
    ];

    compiledPlain.split("\n\n").forEach((block) => {
      children.push(new Paragraph({ text: "" }));
      block.split("\n").forEach((line) => {
        children.push(new Paragraph({ text: line }));
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(pf.margins.top),
                right: convertInchesToTwip(pf.margins.right),
                bottom: convertInchesToTwip(pf.margins.bottom),
                left: convertInchesToTwip((pf.margins.left || 1) + (pf.margins.gutter || 0)),
                gutter: convertInchesToTwip(pf.margins.gutter || 0),
              },
              size: pf.trim
                ? {
                    width: convertInchesToTwip(pf.trim.widthInch),
                    height: convertInchesToTwip(pf.trim.heightInch),
                  }
                : undefined,
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${safeFile(meta.title)}.docx`);
  };

  const exportEPUBXHTML = (): void => {
    const xhtml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">',
      "<head>",
      '  <meta charset="utf-8"/>',
      `  <title>${htmlEscape(meta.title)}</title>`,
      "  <style>body{font-family:serif;line-height:1.45;margin:1em;} p{margin:0 0 1em 0;}</style>",
      "</head>",
      "<body>",
      compiledPlain
        .split("\n\n")
        .map((b) => "<p>" + htmlEscape(b).replaceAll("\n", "<br/>") + "</p>")
        .join("\n"),
      "</body>",
      "</html>",
    ].join("\n");

    const blob = new Blob([xhtml], { type: "application/xhtml+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeFile(meta.title)}.xhtml`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportEPUB = async (): Promise<void> => {
    const JSZip = (await import("jszip")).default;
    const esc = htmlEscape;

    const body = compiledPlain
      .split("\n\n")
      .map((p) => "<p>" + esc(p).replaceAll("\n", "<br/>") + "</p>")
      .join("\n");

    const titleXhtml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">',
      "<head>",
      '  <meta charset="utf-8"/>',
      `  <title>${esc(meta.title)}</title>`,
      '  <link rel="stylesheet" type="text/css" href="styles.css"/>',
      "</head>",
      "<body>",
      `<h1 style="text-align:center">${esc(meta.title)}</h1>`,
      `<div style="text-align:center">by ${esc(meta.author)} • ${esc(meta.year)}</div>`,
      "<hr/>",
      body,
      "</body>",
      "</html>",
    ].join("\n");

    const navXhtml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">',
      "<head><meta charset=\"utf-8\"/><title>Table of Contents</title></head>",
      "<body>",
      '<nav epub:type="toc"><h1>Contents</h1><ol>',
      '  <li><a href="title.xhtml">Manuscript</a></li>',
      "</ol></nav>",
      "</body>",
      "</html>",
    ].join("\n");

    const css = "body{font-family:serif;line-height:1.45;margin:1em;} h1{text-align:center} p{margin:0 0 1em 0;}";
    const uid = "storylab-" + Date.now();

    const packageOpf = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">',
      '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">',
      `    <dc:identifier id="pub-id">urn:uuid:${uid}</dc:identifier>`,
      `    <dc:title>${esc(meta.title)}</dc:title>`,
      `    <dc:creator>${esc(meta.author)}</dc:creator>`,
      "    <dc:language>en</dc:language>",
      `    <meta property="dcterms:modified">${new Date().toISOString().replace(/\..*/, "")}Z</meta>`,
      "  </metadata>",
      "  <manifest>",
      '    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
      '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
      '    <item id="css" href="styles.css" media-type="text/css"/>',
      "  </manifest>",
      "  <spine>",
      '    <itemref idref="title"/>',
      "  </spine>",
      "</package>",
    ].join("\n");

    const containerXml = [
      '<?xml version="1.0"?>',
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">',
      "  <rootfiles>",
      '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>',
      "  </rootfiles>",
      "</container>",
    ].join("\n");

    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.folder("META-INF")!.file("container.xml", containerXml);

    const oebps = zip.folder("OEBPS")!;
    oebps.file("title.xhtml", titleXhtml);
    oebps.file("nav.xhtml", navXhtml);
    oebps.file("styles.css", css);
    oebps.file("content.opf", packageOpf);

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeFile(meta.title)}.epub`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
        {/* Rose/Pink gradient header */}
        <div
          style={{
            background: `linear-gradient(135deg, var(--brand-rose, #ec4899), var(--brand-pink, #f9a8d4))`,
            color: theme.white,
            padding: "10px 18px",
          }}
          aria-label="Publishing banner"
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
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={{
                ...styles.btn,
                border: "none",
                background: "rgba(255,255,255,0.14)",
                color: theme.white,
                padding: "6px 12px",
                fontSize: 13,
              }}
              aria-label="Go back"
            >
              ← Back
            </button>

            {/* Center title - smaller */}
            <div
              style={{
                textAlign: "center",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 2h9a3 3 0 0 1 3 3v12.5a1.5 1.5 0 0 1-1.5 1.5H7a3 3 0 0 0-3 3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v13.764A4.99 4.99 0 0 1 7 18h9V5a1 1 0 0 0-1-1H6z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>
                Publishing Suite
              </h1>
            </div>
            <div style={{ width: 80 }} />
          </div>
        </div>

        {/* NEW LAYOUT: Sidebar + Main */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isWide ? "1fr 280px" : "1fr",
              gap: 20,
            }}
          >
            {/* MAIN */}
            <main>
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Publishing steps"
                onKeyDown={onKeyDownTabs}
                style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}
              >
                {STEPS.map((s, i) => {
                  const isActive = s.key === step;
                  const id = `tab-${s.key}`;
                  const panelId = `panel-${s.key}`;
                  return (
                    <button
                      key={s.key}
                      id={id}
                      ref={(el) => {
                        if (el) tabRefs.current[i] = el;
                      }}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={panelId}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setStep(s.key)}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 12,
                        border: isActive ? `2px solid ${theme.accent}` : `2px solid ${theme.border}`,
                        background: isActive ? theme.highlight : theme.white,
                        color: isActive ? theme.primary : theme.subtext,
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontSize: 14,
                        outline: "none",
                        boxShadow: isActive ? "0 1px 0 rgba(0,0,0,0.04) inset" : "none",
                      }}
                    >
                      <span aria-hidden="true" style={{ marginRight: 8 }}>
                        {i + 1}
                      </span>
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Step body */}
              <div style={{ ...styles.glassCard, marginBottom: 20, minHeight: 400 }}>
                {step === "builder" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isWide ? "260px 1fr" : "1fr",
                      gap: 16,
                    }}
                  >
                    {/* Chapters rail (collapses on narrow) */}
                    {isWide && (
                      <aside
                        style={{
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          padding: 12,
                          background: theme.white,
                          maxHeight: 560,
                          overflow: "auto",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8, color: theme.text }}>Chapters</div>
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
                              }}
                              title={c.title}
                            >
                              {c.included ? "✅ " : "🚫 "} {c.title}
                            </button>
                          ))}
                          <button onClick={addChapter} style={{ ...styles.btnPrimary, marginTop: 6 }}>
                            + Add Chapter
                          </button>
                        </div>
                      </aside>
                    )}

                    {/* Editor */}
                    <section>
                      {/* Toolbar */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          padding: 10,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          marginBottom: 10,
                          background: `linear-gradient(180deg, ${theme.white}, ${theme.highlight})`,
                        }}
                      >
                        <select onChange={(e) => setFont(e.target.value)} defaultValue="Times New Roman" style={styles.input as any}>
                          <option>Times New Roman</option>
                          <option>Georgia</option>
                          <option>Garamond</option>
                          <option>Palatino Linotype</option>
                          <option>Calibri</option>
                          <option>Arial</option>
                          <option>Courier New</option>
                        </select>
                        <select
                          onChange={(e) => setFontSizePt(parseInt(e.target.value, 10))}
                          defaultValue="16"
                          style={{ ...(styles.input as any), width: 90 }}
                        >
                          <option value="14">14</option>
                          <option value="16">16</option>
                          <option value="18">18</option>
                          <option value="20">20</option>
                          <option value="22">22</option>
                        </select>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={() => exec("bold")} title="Bold">
                            B
                          </button>
                          <button style={styles.btn} onClick={() => exec("italic")} title="Italic">
                            <em>I</em>
                          </button>
                          <button style={styles.btn} onClick={() => exec("underline")} title="Underline">
                            <u>U</u>
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={() => setBlock("P")} title="Paragraph">
                            ¶
                          </button>
                          <button style={styles.btn} onClick={() => setBlock("H1")} title="Heading 1">
                            H1
                          </button>
                          <button style={styles.btn} onClick={() => setBlock("H2")} title="Heading 2">
                            H2
                          </button>
                          <button style={styles.btn} onClick={() => setBlock("H3")} title="Heading 3">
                            H3
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={() => exec("insertUnorderedList")} title="Bulleted List">
                            • List
                          </button>
                          <button style={styles.btn} onClick={() => exec("insertOrderedList")} title="Numbered List">
                            1. List
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={() => exec("justifyLeft")} title="Align Left">
                            ⟸
                          </button>
                          <button style={styles.btn} onClick={() => exec("justifyCenter")} title="Center">
                            ⇔
                          </button>
                          <button style={styles.btn} onClick={() => exec("justifyRight")} title="Align Right">
                            ⟹
                          </button>
                          <button style={styles.btn} onClick={() => exec("justifyFull")} title="Justify">
                            ≋
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={() => exec("undo")} title="Undo">
                            ↶
                          </button>
                          <button style={styles.btn} onClick={() => exec("redo")} title="Redo">
                            ↷
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={styles.btn} onClick={insertPageBreak} title="Insert Page Break">
                            ⤓ Break
                          </button>
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          <label style={{ ...styles.btn, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            Import Word (.docx)
                            <input
                              type="file"
                              accept=".docx"
                              style={{ display: "none" }}
                              onChange={(e) => e.target.files && importDocx(e.target.files[0], true)}
                            />
                          </label>
                          <label style={{ ...styles.btn, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            Import HTML (.html)
                            <input
                              type="file"
                              accept=".html,.htm,.xhtml"
                              style={{ display: "none" }}
                              onChange={(e) => e.target.files && importHTML(e.target.files[0], true)}
                            />
                          </label>
                          <button style={styles.btnPrimary} onClick={saveActiveChapterHTML}>
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Desk background + White page */}
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
                            width: 800,
                            minHeight: 1040,
                            background: "#ffffff",
                            color: "#111",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
                            borderRadius: 6,
                            padding: "96px 80px",
                            lineHeight: ms.lineHeight,
                            fontFamily: ms.fontFamily,
                            fontSize: ms.fontSizePt * (96 / 72),
                            outline: "none",
                          }}
                          onInput={saveActiveChapterHTML}
                          dangerouslySetInnerHTML={{ __html: chapters[activeIdx]?.textHTML || "<p></p>" }}
                        />
                      </div>
                      <div style={{ color: theme.subtext, fontSize: 12, marginTop: 6 }}>
                        Tip: Use H1/H2/H3 for sections — if "Build Contents from Headings" is on, your TOC will include them.
                      </div>
                    </section>
                  </div>
                )}

                {step === "proof" && (
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>Proof & Consistency</h3>
                    <p style={{ color: theme.subtext, fontSize: 14, marginTop: 0 }}>
                      Local quick checks now. You can wire these buttons to your server-side AI later.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                      <button style={styles.btn} onClick={runLocalChecks}>Grammar Check (Local)</button>
                      <button style={styles.btn} onClick={runLocalChecks}>Style Analysis (Local)</button>
                      <button style={styles.btn} onClick={runLocalChecks}>Character Consistency (Local)</button>
                      <button style={styles.btn} onClick={runLocalChecks}>Timeline Validation (Local)</button>
                      <button style={styles.btnPrimary} onClick={runAIChecks} disabled={aiBusy}>
                        {aiBusy ? "AI Proof… " : "AI Proof (Local Suggestions)"}
                      </button>
                    </div>
                    {!!proofResults.length && (
                      <div style={{ marginTop: 16, ...styles.glassCard }}>
                        <ul style={{ margin: 0, paddingLeft: 18, color: theme.text }}>
                          {proofResults.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {step === "format" && (
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Format Preview</h3>
                    <div style={styles.preview}>
                      <iframe title="format-preview" style={{ width: "100%", height: 328, border: 0 }} srcDoc={compiledHTML} />
                    </div>
                    <p style={{ color: theme.subtext, fontSize: 12, marginTop: 8 }}>
                      * For true headers/footers + page numbers, export DOCX and finalize in Word/LibreOffice (then save as PDF).
                    </p>
                  </div>
                )}

                {step === "export" && (
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Export</h3>
                    <p style={{ color: theme.subtext, fontSize: 14 }}>
                      DOCX includes page margins; EPUB is packaged, and XHTML is a simple ePub-friendly HTML.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                      <button style={styles.btn} onClick={exportPDF}>📄 Export PDF (Print dialog)</button>
                      <button style={styles.btn} onClick={exportDOCX}>📝 Export DOCX</button>
                      <button style={styles.btnPrimary} onClick={exportEPUB}>📖 Export EPUB (.epub)</button>
                      <button style={styles.btnDark} onClick={exportEPUBXHTML}>📑 Export EPUB XHTML</button>
                    </div>
                  </div>
                )}

                {step === "prep" && (
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Publishing Preparation</h3>
                    <p style={{ color: theme.subtext, fontSize: 14 }}>Get your submission assets ready.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                      <button style={styles.btn}>📝 Synopsis Generator</button>
                      <button style={styles.btn}>✉️ Query Letter Builder</button>
                      <button style={styles.btn}>✅ Self-Publishing Checklist</button>
                      <button style={styles.btn}>📊 Marketing Kit</button>
                      <button style={styles.btn}>🏷️ Genre Guidelines</button>
                      <button style={styles.btn}>💰 Pricing Calculator</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Legacy Chapter cards */}
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
                        <button className="small" style={styles.btn} onClick={() => setActiveChapterId(c.id)}>Open</button>
                        <label style={{ ...styles.btn, cursor: "pointer" }}>
                          Replace with .docx
                          <input type="file" accept=".docx" style={{ display: "none" }}
                                 onChange={(e) => e.target.files && importDocx(e.target.files[0], false)} />
                        </label>
                        <label style={{ ...styles.btn, cursor: "pointer" }}>
                          Replace with .html
                          <input type="file" accept=".html,.htm,.xhtml" style={{ display: "none" }}
                                 onChange={(e) => e.target.files && importHTML(e.target.files[0], false)} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer nav */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button style={styles.btn} onClick={goBack} disabled={stepIndex === 0}>← Back</button>
                <button style={styles.btnPrimary} onClick={goNext} disabled={stepIndex === STEPS.length - 1}>Next →</button>
              </div>
            </main>

            {/* Sidebar (sticky on wide screens) */}
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

/* ---------- utilities ---------- */
function safeFile(name: string): string {
  return (name || "manuscript").replace(/[^\w\-]+/g, "_");
}
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}
