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
} as const;

// Optional Google palette (used only if you wire it later via CSS var overrides)
const GOOGLE_PALETTE = {
  primary: "#1a73e8", // Google Blue 600
  accent: "#34a853",  // Google Green 600
  highlight: "rgba(26,115,232,0.10)",
} as const;

/* ---------- Types ---------- */
// No more tabs - just the builder page

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
export default function Publishing(): JSX.Element {
  // Brand/Google toggle
  const [googleMode, setGoogleMode] = useState<boolean>(false);
  const navigate = useNavigate();

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

  /* ---------- Exports - Removed (now in Export page) ---------- */

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
        {/* Rose/Pink gradient header - BIGGER and MORE TRANSPARENT */}
        <div
          style={{
            background: `linear-gradient(135deg, rgba(236, 72, 153, 0.65), rgba(249, 168, 212, 0.65))`,
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
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={{
                ...styles.btn,
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: theme.white,
                padding: "10px 18px",
                fontSize: 15,
              }}
              aria-label="Go back"
            >
              ← Back
            </button>

            {/* Center title - EVEN BIGGER */}
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
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: 0.4 }}>
                Publishing Suite
              </h1>
            </div>
            <div style={{ width: 110 }} />
          </div>
        </div>

        {/* NEW LAYOUT: Main + Smaller Sidebar */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isWide ? "1fr 220px" : "1fr",
              gap: 24,
            }}
          >
            {/* MAIN */}
            <main>
              {/* Quick Access Navigation */}
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

              {/* Manuscript Builder */}
              <div style={{ ...styles.glassCard, marginBottom: 20, minHeight: 400 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isWide ? "240px 1fr" : "1fr",
                    gap: 16,
                  }}
                >
                  {/* Chapters rail */}
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

                  {/* Editor - Full width paper */}
                  {/* VERY THIN Toolbar Bar (compact + scrollable) */}
{/* VERY THIN Toolbar Bar (compact + scrollable) */}
<div
  role="toolbar"
  aria-label="Formatting toolbar"
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    marginBottom: 12,
    background: theme.white,
    fontSize: 11,
    /* prevent cutoff + allow horizontal scroll */
    flexWrap: "nowrap",
    overflowX: "auto",
    whiteSpace: "nowrap",
    scrollbarWidth: "thin",
    WebkitOverflowScrolling: "touch",
  }}
>
  {/* Font dropdown — compact */}
  <select
    onChange={(e) => setFont(e.target.value)}
    defaultValue="Times New Roman"
    style={{
      ...(styles.input as any),
      width: 150,
      padding: "4px 6px",
      fontSize: 11,
      height: 28,
      minWidth: 130,
      display: "inline-block",
    }}
  >
    <option>Times New Roman</option>
    <option>Georgia</option>
    <option>Garamond</option>
    <option>Palatino</option>
    <option>Calibri</option>
    <option>Arial</option>
  </select>

  {/* Size — compact */}
  <select
    onChange={(e) => setFontSizePt(parseInt(e.target.value, 10))}
    defaultValue="16"
    style={{
      ...(styles.input as any),
      width: 56,
      padding: "4px 6px",
      fontSize: 11,
      height: 28,
      minWidth: 52,
      display: "inline-block",
    }}
  >
    <option value="14">14</option>
    <option value="16">16</option>
    <option value="18">18</option>
    <option value="20">20</option>
    <option value="22">22</option>
  </select>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Basic styles */}
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 11, minWidth: 26, height: 28 }} onClick={() => exec("bold")} title="Bold">B</button>
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 11, minWidth: 26, height: 28 }} onClick={() => exec("italic")} title="Italic"><em>I</em></button>
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 11, minWidth: 26, height: 28 }} onClick={() => exec("underline")} title="Underline"><u>U</u></button>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Headings */}
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => setBlock("H1")} title="Heading 1">H1</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => setBlock("H2")} title="Heading 2">H2</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => setBlock("H3")} title="Heading 3">H3</button>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Lists */}
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("insertUnorderedList")} title="Bulleted list">•</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("insertOrderedList")} title="Numbered list">1.</button>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Align */}
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("justifyLeft")} title="Align left">⟸</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("justifyCenter")} title="Center">⇔</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("justifyRight")} title="Align right">⟹</button>
  <button style={{ ...styles.btn, padding: "4px 7px", fontSize: 10, minWidth: 26, height: 28 }} onClick={() => exec("justifyFull")} title="Justify">≋</button>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Undo/Redo */}
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 11, minWidth: 26, height: 28 }} onClick={() => exec("undo")} title="Undo">↶</button>
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 11, minWidth: 26, height: 28 }} onClick={() => exec("redo")} title="Redo">↷</button>

  <div style={{ width: 1, height: 16, background: theme.border, margin: "0 4px" }} />

  {/* Page break */}
  <button style={{ ...styles.btn, padding: "4px 8px", fontSize: 10, height: 28 }} onClick={insertPageBreak} title="Insert page break">⤓</button>

  {/* Right side — imports & save */}
  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
    <label style={{ ...styles.btn, padding: "4px 9px", fontSize: 10, cursor: "pointer", height: 28, display: "flex", alignItems: "center" }}>
      📄 Word
      <input type="file" accept=".docx" style={{ display: "none" }} onChange={(e) => e.target.files && importDocx(e.target.files[0], true)} />
    </label>
    <label style={{ ...styles.btn, padding: "4px 9px", fontSize: 10, cursor: "pointer", height: 28, display: "flex", alignItems: "center" }}>
      🌐 HTML
      <input type="file" accept=".html,.htm,.xhtml" style={{ display: "none" }} onChange={(e) => e.target.files && importHTML(e.target.files[0], true)} />
    </label>
    <button style={{ ...styles.btnPrimary, padding: "4px 10px", fontSize: 11, height: 28 }} onClick={saveActiveChapterHTML}>Save</button>
  </div>
</div>

               {/* Desk background (outer) */}
<div
  style={{
    padding: 14,                                      // slimmer than before
    background: `linear-gradient(180deg, var(--brand-bg), #eef2f7)`,
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    overflow: "auto",                                 // prevents toolbar/page cut-off
  }}
>
  {/* White page (editor) — compact, LTR, typeable */}
  <div
    ref={editorRef}
    contentEditable
    suppressContentEditableWarning
    dir="ltr"
    spellCheck={true}
    style={{
      margin: "0 auto",
      width: "min(760px, 92vw)",                      // narrower + responsive
      minHeight: 900,
      background: "#ffffff",
      color: "#111",
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
      borderRadius: 8,
      padding: "64px 64px",                           // tighter to show more white
      lineHeight: ms.lineHeight,
      fontFamily: ms.fontFamily,
      fontSize: Math.max(14, Math.round(ms.fontSizePt * (96 / 72))),
      outline: "none",
      direction: "ltr",                               // fix “backwards” typing
      unicodeBidi: "plaintext",
      textAlign: "left",
      caretColor: "#111",
      wordBreak: "break-word",
    }}
    onInput={saveActiveChapterHTML}
    dangerouslySetInnerHTML={{
      __html: chapters[activeIdx]?.textHTML || "<p></p>",
    }}
  />
</div>

              {/* Legacy Chapter cards (kept) */}
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
