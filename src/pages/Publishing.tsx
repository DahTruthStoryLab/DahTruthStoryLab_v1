/// src/pages/Publishing.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../components/layout/PageShell";

/**
 * Publishing Suite (StoryLab)
 * - Live HTML preview with chapter page breaks
 * - DOCX export with headers/footers + page numbers
 * - EPUB and XHTML exports
 * - Basic “AI-ish” proof checks (local heuristics)
 * - Presets for manuscript & platform
 */

// ---- Types ----
type StepKey = "builder" | "proof" | "format" | "export" | "prep";

type Chapter = { id: string; title: string; included: boolean; text: string };

type Matter = {
  titlePage: string;
  copyright: string;
  dedication: string;
  epigraph: string;
  toc: boolean;
  acknowledgments: string;
  aboutAuthor: string;
  notes: string;
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

// ---- Theme (neutral; you can swap these to match your brand) ----
const theme = {
  bg: "#0b1220",             // deep page background
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  text: "#E6EDF7",
  subtext: "#9FB0C3",
  accent: "#94A3B8",
  highlight: "rgba(148,163,184,0.18)",
  primary: "#E6EDF7",
  white: "#FFFFFF",
};

// ---- UI bits ----
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 24,
        borderRadius: 999,
        background: checked ? theme.accent : "#233044",
        border: `1px solid ${theme.border}`,
        position: "relative",
        cursor: "pointer",
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 26 : 2,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: theme.white,
          transition: "left .15s ease",
        }}
      />
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div style={{ color: theme.subtext, fontSize: 12 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={label.length > 12 ? 3 : 2}
        placeholder={placeholder}
        style={{
          width: "100%",
          marginTop: 6,
          fontSize: 14,
          padding: 10,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          background: "rgba(10,16,28,0.6)",
          color: theme.text,
        }}
      />
    </div>
  );
}

// ---- Helpers ----
function safeFile(name: string): string {
  return (name || "manuscript").replace(/[^\w\-]+/g, "_");
}
function escapeXML(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
function compiledHTMLBody(plain: string): string {
  const esc = (t: string) =>
    t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return plain
    .split("\n\n")
    .map((b) => `<p>${esc(b).replaceAll("\n", "<br/>")}</p>`)
    .join("\n");
}

// ---- Manuscript presets ----
const MANUSCRIPT_PRESETS: Record<
  ManuscriptPresetKey,
  {
    label: string;
    fontFamily: string;
    fontSizePt: number;
    lineHeight: number; // default for preset (we can override)
    firstLineIndentInches: number;
    paragraphSpacingPt: number;
    align: "left" | "justify";
    chapterTitleCase: "UPPER" | "Capitalize" | "AsIs";
    chapterStartsOnNewPage: boolean;
  }
> = {
  Agents_Standard_12pt_TNR_Double: {
    label: "Agents: Standard (TNR 12, double)",
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
    label: "Screenplay (basic Courier)",
    fontFamily: "Courier New",
    fontSizePt: 12,
    lineHeight: 1.0,
    firstLineIndentInches: 0.0,
    paragraphSpacingPt: 0,
    align: "left",
    chapterTitleCase: "AsIs",
    chapterStartsOnNewPage: true,
  },
  Poetry_Minimal_12pt_Serif: {
    label: "Poetry (minimal serif)",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSizePt: 12,
    lineHeight: 1.5,
    firstLineIndentInches: 0.0,
    paragraphSpacingPt: 0,
    align: "left",
    chapterTitleCase: "AsIs",
    chapterStartsOnNewPage: true,
  },
};

// ---- Platform presets ----
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

// ---- Styles ----
type CSS = React.CSSProperties;
const styles = {
  page: { background: theme.bg, minHeight: "100vh" } as CSS,

  sectionShell: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "20px 24px",
  } as CSS,

  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 30px rgba(2,20,40,.25)",
    backdropFilter: "blur(8px)",
  } as CSS,

  label: { fontSize: 12, color: theme.subtext } as CSS,

  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    background: "rgba(10,16,28,0.6)",
    color: theme.text,
  } as CSS,

  lightBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: "rgba(17,24,39,0.6)",
    color: theme.text,
    cursor: "pointer",
  } as CSS,

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "#3B82F6",
    color: theme.white,
    cursor: "pointer",
  } as CSS,

  darkBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: theme.white,
    cursor: "pointer",
  } as CSS,

  preview: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 16,
    background: "rgba(8,12,22,0.5)",
    height: 360,
    overflow: "auto",
  } as CSS,
};

// ---- Steps ----
const STEPS: { key: StepKey; label: string }[] = [
  { key: "builder", label: "Manuscript Builder" },
  { key: "proof", label: "Proof & Consistency" },
  { key: "format", label: "Format & Styles" },
  { key: "export", label: "Export" },
  { key: "prep", label: "Publishing Prep" },
];

export default function Publishing(): JSX.Element {
  const [step, setStep] = useState<StepKey>("builder");
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].key);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)].key);

  // a11y tabs
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

  // Meta + sample content
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
  });

  // Presets state
  const [manuscriptPreset, setManuscriptPreset] =
    useState<ManuscriptPresetKey>("Agents_Standard_12pt_TNR_Double");
  const [platformPreset, setPlatformPreset] =
    useState<PlatformPresetKey>("Generic_Manuscript_Submission");

  // Derived preset objects + line-height override that actually re-renders
  const ms = MANUSCRIPT_PRESETS[manuscriptPreset];
  const pf = PLATFORM_PRESETS[platformPreset];
  const [lineHeight, setLineHeight] = useState<number>(ms.lineHeight);
  useEffect(() => setLineHeight(ms.lineHeight), [manuscriptPreset]); // reset when preset changes

  const includeHeadersFooters = pf.headers || pf.footers;

  // Compile plain text
  const compiled: string = useMemo(() => {
    const vars = (s: string) =>
      s
        .replaceAll("{title}", meta.title)
        .replaceAll("{author}", meta.author)
        .replaceAll("{year}", meta.year);

    const parts: string[] = [];
    // Front matter
    parts.push(vars(matter.titlePage));
    parts.push("\n\n" + vars(matter.copyright));
    if (matter.dedication) parts.push("\n\nDedication\n" + matter.dedication);
    if (matter.epigraph) parts.push("\n\nEpigraph\n" + matter.epigraph);
    if (matter.toc) {
      parts.push(
        "\n\nContents\n" +
          chapters
            .filter((c) => c.included)
            .map((c, i) => `${i + 1}. ${c.title}`)
            .join("\n")
      );
    }

    // Chapters
    chapters.forEach((c) => {
      if (!c.included) return;
      const txt = lineHeight >= 2 ? c.text.replaceAll(" ", "  ") : c.text;
      parts.push("\n\n" + c.title + "\n" + txt);
    });

    // Back matter
    if (matter.acknowledgments)
      parts.push("\n\nAcknowledgments\n" + matter.acknowledgments);
    if (matter.aboutAuthor)
      parts.push("\n\nAbout the Author\n" + vars(matter.aboutAuthor));
    if (matter.notes) parts.push("\n\nNotes\n" + matter.notes);

    return parts.join("\n").trim();
  }, [chapters, matter, meta, lineHeight]);

  const wordCount = useMemo(
    () => compiled.split(/\s+/).filter(Boolean).length,
    [compiled]
  );

  // ---- HTML Preview / Print CSS ----
  const compiledHTML: string = useMemo(() => {
    const escape = (s: string) =>
      s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    // Front matter blocks
    const front = [
      matter.titlePage,
      matter.copyright,
      matter.dedication && `Dedication\n${matter.dedication}`,
      matter.epigraph && `Epigraph\n${matter.epigraph}`,
    ]
      .filter(Boolean)
      .map((s) => `<p>${escape(String(s)).replaceAll("\n", "<br/>")}</p>`)
      .join("\n");

    // TOC
    const toc = matter.toc
      ? `<h2 class="chapter" style="page-break-before: always">Contents</h2><p>${chapters
          .filter((c) => c.included)
          .map((c, i) => `${i + 1}. ${escape(c.title)}`)
          .join("<br/>")}</p>`
      : "";

    // Chapter bodies with page breaks
    const chapterized = chapters
      .filter((c) => c.included)
      .map((c) => {
        const t =
          ms.chapterTitleCase === "UPPER"
            ? c.title.toUpperCase()
            : ms.chapterTitleCase === "Capitalize"
            ? c.title.replace(/\b(\w)/g, (m) => m.toUpperCase())
            : c.title;
        const body = escape(c.text)
          .replaceAll("\n\n", "</p><p>")
          .replaceAll("\n", "<br/>");
        return `<h2 class="chapter">${t}</h2><p>${body}</p>`;
      })
      .join("\n");

    const back = [
      matter.acknowledgments && `Acknowledgments\n${matter.acknowledgments}`,
      matter.aboutAuthor && `About the Author\n${matter.aboutAuthor}`,
      matter.notes && `Notes\n${matter.notes}`,
    ]
      .filter(Boolean)
      .map((s) => {
        const lines = String(s).split("\n");
        return `<h2 class="chapter">${lines[0]}</h2><p>${escape(
          lines.slice(1).join("\n")
        ).replaceAll("\n", "<br/>")}</p>`;
      })
      .join("\n");

    const css = `
      @page { margin: ${pf.margins.top}in ${pf.margins.right}in ${pf.margins.bottom}in ${pf.margins.left}in; }
      body { font-family: ${ms.fontFamily}; font-size: ${ms.fontSizePt}pt; margin: 0; line-height: ${lineHeight}; color: #E5E7EB; background:#0b1220;}
      p { orphans: 3; widows: 3; ${ms.align === "justify" ? "text-align: justify;" : ""} ${
      ms.firstLineIndentInches ? `text-indent: ${ms.firstLineIndentInches}in;` : ""
    } ${ms.paragraphSpacingPt ? `margin: 0 0 ${ms.paragraphSpacingPt}pt 0;` : ""} }
      h2.chapter { ${ms.chapterStartsOnNewPage ? "page-break-before: always;" : ""} text-align:center; margin: 0 0 1em 0; font-weight: bold; color:#fff; }
    `;

    const titleBlock = `
      <div style="text-align:center; font-size:${ms.fontSizePt + 4}pt; font-weight:bold; margin-bottom: 1.5em; color:#fff;">${meta.title}</div>
      <div style="text-align:center; margin-bottom: 2em; color:#CBD5E1;">by ${meta.author} • ${meta.year}</div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${meta.title}</title><style>${css}</style></head><body>${titleBlock}${front}${toc}${chapterized}${back}</body></html>`;
  }, [chapters, matter, meta, ms, pf, lineHeight]);

  // ---- Proof (basic heuristics) ----
  const [proofResults, setProofResults] = useState<string[]>([]);
  function runGrammarChecks() {
    const issues: string[] = [];
    if (compiled.match(/ {2,}/)) issues.push("Multiple consecutive spaces found.");
    if (compiled.match(/[“”]/) && !compiled.match(/[‘’]/))
      issues.push("Smart quotes present; ensure consistency.");
    if (compiled.match(/--/))
      issues.push("Double hyphen found; consider an em dash or period.");
    const longParas = compiled
      .split("\n\n")
      .filter((p) => p.split(/\s+/).length > 250).length;
    if (longParas)
      issues.push(`${longParas} very long paragraph(s); consider breaking up.`);
    // “AI-ish” extra checks
    const repeated = (compiled.match(/\b(\w+)\b(?=.*\b\1\b)/gi) || [])
      .map((w) => w.toLowerCase());
    if (new Set(repeated).size > 20) issues.push("Many repeated words; review variety.");
    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  // ---- Exports ----
  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(compiledHTML);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 250);
  };

  // XHTML (EPUB-readable) export
  const exportEPUBXHTML = (): void => {
    const xhtmlParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">',
      "<head>",
      '  <meta charset="utf-8"/>',
      "  <title>" + escapeXML(meta.title) + "</title>",
      '  <meta name="author" content="' + escapeXML(meta.author) + '"/>',
      "  <style>",
      "    body { font-family: serif; margin:1em; line-height:" + (lineHeight || 1.45) + "; }",
      "    p { margin: 0 0 1em 0; }",
      "  </style>",
      "</head>",
      "<body>",
      compiledHTMLBody(compiled),
      "</body>",
      "</html>",
    ];

    const xhtml = xhtmlParts.join("\n");
    const blob = new Blob([xhtml], {
      type: "application/xhtml+xml;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeFile(meta.title)}.xhtml`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // True .epub packager (requires jszip in deps)
  async function exportEPUB(): Promise<void> {
    const JSZip = (await import("jszip")).default;

    const included = chapters.filter((c) => c.included);

    const esc = (s: string) =>
      s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const para = (t: string) =>
      "<p>" +
      esc(t).replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br/>") +
      "</p>";

    const makeXhtml = (title: string, body: string) =>
      [
        '<?xml version="1.0" encoding="utf-8"?>',
        "<!DOCTYPE html>",
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">',
        "<head>",
        '  <meta charset="utf-8"/>',
        "  <title>" + escapeXML(title) + "</title>",
        '  <link rel="stylesheet" type="text/css" href="styles.css"/>',
        "</head>",
        "<body>",
        body,
        "</body>",
        "</html>",
      ].join("\n");

    // Title page
    const titleXhtml = makeXhtml(
      meta.title,
      '<h1 style="text-align:center">' +
        esc(meta.title) +
        '</h1><div style="text-align:center">' +
        esc(meta.author) +
        " • " +
        esc(meta.year) +
        "</div>"
    );

    // Front matter
    const frontBits: string[] = [];
    frontBits.push(
      para(
        matter.titlePage
          .replaceAll("{title}", meta.title)
          .replaceAll("{author}", meta.author)
      )
    );
    frontBits.push(
      para(
        matter.copyright
          .replaceAll("{year}", meta.year)
          .replaceAll("{author}", meta.author)
      )
    );
    if (matter.dedication)
      frontBits.push("<h2>Dedication</h2>" + para(matter.dedication));
    if (matter.epigraph)
      frontBits.push("<h2>Epigraph</h2>" + para(matter.epigraph));
    const frontXhtml = makeXhtml("Front Matter", frontBits.join("\n"));

    // Chapters
    const chapterFiles = included.map((c, i) => {
      const id = "chap" + (i + 1);
      const href = "chap" + (i + 1) + ".xhtml";
      const content = makeXhtml(
        c.title,
        '<h2 style="text-align:center">' + esc(c.title) + "</h2>" + para(c.text)
      );
      return { id, href, title: c.title, content };
    });

    // Back matter
    const backBits: string[] = [];
    if (matter.acknowledgments)
      backBits.push("<h2>Acknowledgments</h2>" + para(matter.acknowledgments));
    if (matter.aboutAuthor)
      backBits.push(
        "<h2>About the Author</h2>" +
          para(matter.aboutAuthor.replaceAll("{author}", meta.author))
      );
    if (matter.notes) backBits.push("<h2>Notes</h2>" + para(matter.notes));
    const backXhtml = makeXhtml("Back Matter", backBits.join("\n"));

    // nav.xhtml
    const navXhtml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">',
      '<head><meta charset="utf-8"/><title>Table of Contents</title></head>',
      "<body>",
      '<nav epub:type="toc"><h1>Contents</h1><ol>',
      '  <li><a href="title.xhtml">Title</a></li>',
      '  <li><a href="front.xhtml">Front Matter</a></li>',
      chapterFiles
        .map((cf) => '  <li><a href="' + cf.href + '">' + esc(cf.title) + "</a></li>")
        .join("\n"),
      '  <li><a href="back.xhtml">Back Matter</a></li>',
      "</ol></nav>",
      "</body>",
      "</html>",
    ].join("\n");

    // OPF
    const manifestItems = [
      { id: "title", href: "title.xhtml", mediaType: "application/xhtml+xml" },
      { id: "front", href: "front.xhtml", mediaType: "application/xhtml+xml" },
      ...chapterFiles.map((cf) => ({
        id: cf.id,
        href: cf.href,
        mediaType: "application/xhtml+xml",
      })),
      { id: "back", href: "back.xhtml", mediaType: "application/xhtml+xml" },
      {
        id: "nav",
        href: "nav.xhtml",
        mediaType: "application/xhtml+xml",
        properties: "nav",
      },
      { id: "css", href: "styles.css", mediaType: "text/css" },
    ];

    const spineItems = ["title", "front", ...chapterFiles.map((cf) => cf.id), "back"];

    const css =
      "body{font-family:serif;line-height:" +
      (lineHeight || 1.45) +
      ";margin:1em;} h1,h2{text-align:center} p{margin:0 0 1em 0;}";

    const uid =
      typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : "storylab-" + Date.now();

    const packageOpf = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">',
      '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">',
      '    <dc:identifier id="pub-id">urn:uuid:' + uid + "</dc:identifier>",
      "    <dc:title>" + escapeXML(meta.title) + "</dc:title>",
      "    <dc:creator>" + escapeXML(meta.author) + "</dc:creator>",
      "    <dc:language>en</dc:language>",
      '    <meta property="dcterms:modified">' +
        new Date().toISOString().replace(/\..*/, "") +
        "Z</meta>",
      "  </metadata>",
      "  <manifest>",
      manifestItems
        .map((mi: any) => {
          return (
            '<item id="' +
            mi.id +
            '" href="' +
            mi.href +
            '" media-type="' +
            mi.mediaType +
            '"' +
            (mi.properties ? ' properties="' + mi.properties + '"/>' : '"/>')
          );
        })
        .join("\n    "),
      "  </manifest>",
      "  <spine>",
      spineItems.map((id) => '<itemref idref="' + id + '"/>').join("\n    "),
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

    // Build EPUB zip
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.folder("META-INF")!.file("container.xml", containerXml);

    const oebps = zip.folder("OEBPS")!;
    oebps.file("title.xhtml", titleXhtml);
    oebps.file("front.xhtml", frontXhtml);
    chapterFiles.forEach((cf) => oebps.file(cf.href, cf.content));
    oebps.file("back.xhtml", backXhtml);
    oebps.file("nav.xhtml", navXhtml);
    oebps.file("styles.css", css);
    oebps.file("content.opf", packageOpf);

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/epub+zip",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeFile(meta.title)}.epub`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // DOCX with headers/footers & page numbers (requires docx + file-saver)
  async function exportDOCX() {
    const { saveAs } = await import("file-saver");
    const docx = await import("docx");
    const {
      Document,
      Packer,
      Paragraph,
      HeadingLevel,
      TextRun,
      AlignmentType,
      PageNumber,
      Header,
      Footer,
      SectionType,
      convertInchesToTwip,
    } = docx as any;

    const sectionProps: any = {
      properties: {
        type: SectionType.CONTINUOUS,
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
    };

    const header = pf.headers
      ? new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: `${meta.authorLast || meta.author} — ${meta.title}`,
                  italics: true,
                }),
              ],
            }),
          ],
        })
      : undefined;

    const footer = pf.footers
      ? new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT] })],
            }),
          ],
        })
      : undefined;

    const doc = new Document({
      sections: [
        {
          ...sectionProps,
          headers: header ? { default: header } : undefined,
          footers: footer ? { default: footer } : undefined,
          children: [],
        },
      ],
      styles: {
        default: {
          document: {
            run: { font: ms.fontFamily, size: ms.fontSizePt * 2 },
            paragraph: { spacing: { line: Math.round(lineHeight * 240) } },
          },
        },
      },
    });

    const sectionChildren: any[] = [];

    // Title page
    sectionChildren.push(
      new Paragraph({
        text: meta.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );
    sectionChildren.push(
      new Paragraph({ text: `by ${meta.author}`, alignment: AlignmentType.CENTER })
    );
    sectionChildren.push(
      new Paragraph({ text: `${meta.year}`, alignment: AlignmentType.CENTER })
    );

    // Front matter simple blocks
    const fmBlocks = [
      `© ${meta.year} ${meta.author}. All rights reserved.`,
      matter.dedication && `Dedication\n${matter.dedication}`,
      matter.epigraph && `Epigraph\n${matter.epigraph}`,
    ].filter(Boolean) as string[];

    fmBlocks.forEach((b) => {
      sectionChildren.push(new Paragraph({ text: "" }));
      String(b)
        .split("\n")
        .forEach((line) => {
          sectionChildren.push(new Paragraph({ text: line }));
        });
    });

    // TOC (plain text for docx)
    if (matter.toc && pf.showTOCInEbook) {
      sectionChildren.push(new Paragraph({ text: "" }));
      sectionChildren.push(
        new Paragraph({
          text: "Contents",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        })
      );
      chapters
        .filter((c) => c.included)
        .forEach((c, i) => {
          sectionChildren.push(new Paragraph({ text: `${i + 1}. ${c.title}` }));
        });
    }

    function chapterTitleText(t: string): string {
      if (ms.chapterTitleCase === "UPPER") return t.toUpperCase();
      if (ms.chapterTitleCase === "Capitalize")
        return t.replace(/\b(\w)/g, (m) => m.toUpperCase());
      return t;
    }

    // Chapters with page breaks
    chapters
      .filter((c) => c.included)
      .forEach((c, idx) => {
        if (ms.chapterStartsOnNewPage || idx === 0) {
          sectionChildren.push(new Paragraph({}));
          if (idx > 0)
            sectionChildren.push(new Paragraph({ children: [], pageBreakBefore: true }));
        }
        sectionChildren.push(
          new Paragraph({
            text: chapterTitleText(c.title),
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          })
        );

        c.text.split("\n\n").forEach((par) => {
          const runs = par
            .split("\n")
            .map((line, i) => new TextRun({ text: (i ? "\n" : "") + line }));
          sectionChildren.push(
            new Paragraph({
              children: runs,
              indent: {
                firstLine: ms.firstLineIndentInches
                  ? convertInchesToTwip(ms.firstLineIndentInches)
                  : 0,
              },
              spacing: { after: MANUSCRIPT_PRESETS[manuscriptPreset].paragraphSpacingPt * 20 },
            })
          );
        });
      });

    // Back matter
    const bmBlocks = [
      matter.acknowledgments && `Acknowledgments\n${matter.acknowledgments}`,
      matter.aboutAuthor && `About the Author\n${matter.aboutAuthor}`,
      matter.notes && `Notes\n${matter.notes}`,
    ].filter(Boolean) as string[];

    bmBlocks.forEach((b) => {
      sectionChildren.push(new Paragraph({ children: [], pageBreakBefore: true }));
      const [head, ...rest] = String(b).split("\n");
      sectionChildren.push(
        new Paragraph({
          text: head,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        })
      );
      rest.forEach((line) => sectionChildren.push(new Paragraph({ text: line })));
    });

    (doc as any).Sections[0].Properties = (doc as any).Sections[0].Properties;
    (doc as any).Sections[0].Children = sectionChildren;

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${safeFile(meta.title)}.docx`);
  }

  // ---- UI ----
  return (
    <PageShell style={styles.page}>
      {/* Header bar (gradient + logo + back + title + book icon) */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(15,23,42,0.9) 60%, rgba(2,6,23,0.9) 100%)",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            ...styles.sectionShell,
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {/* Back */}
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/"))}
            style={{ ...styles.lightBtn, padding: "8px 10px" }}
            aria-label="Go back"
            title="Go back"
          >
            ◀ Back
          </button>

          {/* Icon (tries favicon, falls back to emoji) */}
          <img
            src="/favicon.ico"
            alt="site icon"
            width={24}
            height={24}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            style={{ borderRadius: 6 }}
          />
          <div aria-hidden style={{ fontSize: 20, marginLeft: -8 }}>📚</div>

          {/* Title */}
          <div style={{ flex: 1 }}>
            <div style={{ color: theme.text, fontSize: 18, fontWeight: 700 }}>
              Publishing Suite
            </div>
            <div style={{ color: theme.subtext, fontSize: 13 }}>
              Presets • Page Breaks • Headers & Footers
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.sectionShell }}>
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Publishing steps"
          onKeyDown={onKeyDownTabs}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 2,
          }}
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
                  border: isActive
                    ? `2px solid ${theme.accent}`
                    : `2px solid ${theme.border}`,
                  background: isActive ? theme.highlight : "rgba(14,21,34,0.6)",
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

        {/* Panel wrapper */}
        <div
          role="tabpanel"
          id={`panel-${step}`}
          aria-labelledby={`tab-${step}`}
          style={{ outline: "none" }}
        >
          {/* Meta */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
              Manuscript Details
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>
                  Title
                </label>
                <input
                  style={styles.input}
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  placeholder="Enter your book title"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>
                  Author
                </label>
                <input
                  style={styles.input}
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>
                  Publication Year
                </label>
                <input
                  style={styles.input}
                  value={meta.year}
                  onChange={(e) => setMeta({ ...meta, year: e.target.value })}
                  placeholder="YYYY"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>
                  Author Last Name (header)
                </label>
                <input
                  style={styles.input}
                  value={meta.authorLast || ""}
                  onChange={(e) => setMeta({ ...meta, authorLast: e.target.value })}
                  placeholder="For running header"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: 16,
                  color: theme.subtext,
                  fontSize: 14,
                }}
              >
                <div>
                  Words: <strong>{wordCount.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Format & Presets */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
              Format & Presets
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <div style={{ minWidth: 260 }}>
                <div style={styles.label}>Manuscript Preset</div>
                <select
                  value={manuscriptPreset}
                  onChange={(e) =>
                    setManuscriptPreset(e.target.value as ManuscriptPresetKey)
                  }
                  style={{ ...styles.input, height: 40 }}
                >
                  {Object.entries(MANUSCRIPT_PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 260 }}>
                <div style={styles.label}>Platform Preset</div>
                <select
                  value={platformPreset}
                  onChange={(e) => setPlatformPreset(e.target.value as PlatformPresetKey)}
                  style={{ ...styles.input, height: 40 }}
                >
                  {Object.entries(PLATFORM_PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <div style={{ color: theme.subtext, fontSize: 12, marginTop: 6 }}>
                  {includeHeadersFooters
                    ? "DOCX export will include headers/footers + page numbers."
                    : "Headers/footers disabled for this platform (typical for eBooks)."}
                </div>
              </div>

              {/* Line spacing buttons (works!) */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={styles.label}>Line Spacing</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      ...styles.lightBtn,
                      padding: "8px 10px",
                      border:
                        lineHeight < 2
                          ? "2px solid #3B82F6"
                          : `1px solid ${theme.border}`,
                    }}
                    onClick={() => setLineHeight(1.5)}
                    aria-pressed={lineHeight < 2}
                  >
                    Single (1.5)
                  </button>
                  <button
                    style={{
                      ...styles.lightBtn,
                      padding: "8px 10px",
                      border:
                        lineHeight >= 2
                          ? "2px solid #3B82F6"
                          : `1px solid ${theme.border}`,
                    }}
                    onClick={() => setLineHeight(2.0)}
                    aria-pressed={lineHeight >= 2}
                  >
                    Double (2.0)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step body */}
          <div style={{ ...styles.glassCard, marginBottom: 20, minHeight: 400 }}>
            {step === "builder" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                    Live Preview
                  </h3>
                  <div style={styles.preview}>
                    <iframe
                      title="preview"
                      style={{ width: "100%", height: 328, border: 0 }}
                      srcDoc={compiledHTML}
                    />
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                    Front & Back Matter
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    <Field
                      label="Title Page"
                      value={matter.titlePage}
                      onChange={(v) => setMatter({ ...matter, titlePage: v })}
                    />
                    <Field
                      label="Copyright"
                      value={matter.copyright}
                      onChange={(v) => setMatter({ ...matter, copyright: v })}
                    />
                    <Field
                      label="Dedication"
                      value={matter.dedication}
                      onChange={(v) => setMatter({ ...matter, dedication: v })}
                    />
                    <Field
                      label="Epigraph"
                      value={matter.epigraph}
                      onChange={(v) => setMatter({ ...matter, epigraph: v })}
                    />
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={matter.toc}
                        onChange={(e) =>
                          setMatter({ ...matter, toc: e.target.checked })
                        }
                      />{" "}
                      Include Table of Contents
                    </label>
                    <div
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                        margin: "8px 0",
                      }}
                    />
                    <Field
                      label="Acknowledgments"
                      value={matter.acknowledgments}
                      onChange={(v) =>
                        setMatter({ ...matter, acknowledgments: v })
                      }
                    />
                    <Field
                      label="About the Author"
                      value={matter.aboutAuthor}
                      onChange={(v) =>
                        setMatter({ ...matter, aboutAuthor: v })
                      }
                    />
                    <Field
                      label="Author Notes"
                      value={matter.notes}
                      onChange={(v) => setMatter({ ...matter, notes: v })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "proof" && (
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                  Proof & Consistency
                </h3>
                <p style={{ color: theme.subtext, fontSize: 14 }}>
                  Local quick checks; deeper AI checks can be wired later.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button style={styles.lightBtn} onClick={runGrammarChecks}>
                    Grammar Check
                  </button>
                  <button style={styles.lightBtn} onClick={runGrammarChecks}>
                    Style Analysis (beta)
                  </button>
                  <button style={styles.lightBtn} onClick={runGrammarChecks}>
                    Character Consistency (beta)
                  </button>
                  <button style={styles.lightBtn} onClick={runGrammarChecks}>
                    Timeline Validation (beta)
                  </button>
                  <button style={styles.primaryBtn} onClick={runGrammarChecks}>
                    Run All Checks
                  </button>
                </div>
                {!!proofResults.length && (
                  <div style={{ marginTop: 16, ...styles.glassCard }}>
                    <ul style={{ margin: 0, paddingLeft: 18, color: theme.text }}>
                      {proofResults.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {step === "format" && (
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                  Format Preview
                </h3>
                <div style={styles.preview}>
                  <iframe
                    title="format-preview"
                    style={{ width: "100%", height: 328, border: 0 }}
                    srcDoc={compiledHTML}
                  />
                </div>
                <p style={{ color: theme.subtext, fontSize: 12, marginTop: 8 }}>
                  * For true headers/footers + page numbers, use the DOCX export and
                  finalize in Word/LibreOffice (then export PDF from there).
                </p>
              </div>
            )}

            {step === "export" && (
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                  Export
                </h3>
                <p style={{ color: theme.subtext, fontSize: 14 }}>
                  DOCX includes headers/footers and page numbers per selected presets.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button style={styles.lightBtn} onClick={exportPDF}>
                    📄 Export PDF (Print Dialog)
                  </button>
                  <button style={styles.lightBtn} onClick={exportDOCX}>
                    📝 Export DOCX
                  </button>
                  <button style={styles.primaryBtn} onClick={exportEPUB}>
                    📖 Export EPUB (.epub)
                  </button>
                  <button style={styles.darkBtn} onClick={exportEPUBXHTML}>
                    📑 Export EPUB XHTML
                  </button>
                </div>
              </div>
            )}

            {step === "prep" && (
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>
                  Publishing Preparation
                </h3>
                <p style={{ color: theme.subtext, fontSize: 14 }}>
                  Get your submission assets ready.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button style={styles.lightBtn}>📝 Synopsis Generator</button>
                  <button style={styles.lightBtn}>✉️ Query Letter Builder</button>
                  <button style={styles.lightBtn}>✅ Self-Publishing Checklist</button>
                  <button style={styles.lightBtn}>📊 Marketing Kit</button>
                  <button style={styles.lightBtn}>🏷️ Genre Guidelines</button>
                  <button style={styles.lightBtn}>💰 Pricing Calculator</button>
                </div>
              </div>
            )}
          </div>

          {/* Chapters */}
          <div style={styles.glassCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, color: theme.text }}>
                Chapter Management
              </h3>
              <button
                style={styles.primaryBtn}
                onClick={() =>
                  setChapters((prev) => [
                    ...prev,
                    {
                      id:
                        typeof crypto !== "undefined" && "randomUUID" in crypto
                          ? (crypto as any).randomUUID()
                          : `c_${Date.now()}`,
                      title: `Chapter ${prev.length + 1} – Untitled`,
                      included: true,
                      text: "New chapter text...",
                    },
                  ])
                }
              >
                + Add Chapter
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {chapters.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 14,
                    background: c.included ? "rgba(12,18,32,0.6)" : "#0E1726",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: theme.text,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.subtext,
                          marginTop: 4,
                        }}
                      >
                        {c.text.slice(0, 100)}…
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button
                          style={{ ...styles.lightBtn, padding: "6px 8px" }}
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
                          aria-label="Move chapter up"
                        >
                          ↑
                        </button>
                        <button
                          style={{ ...styles.lightBtn, padding: "6px 8px" }}
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
                          aria-label="Move chapter down"
                        >
                          ↓
                        </button>
                      </div>
                      <Toggle
                        checked={c.included}
                        onChange={(v) =>
                          setChapters((prev) =>
                            prev.map((x) => (x.id === c.id ? { ...x, included: v } : x))
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button style={styles.lightBtn} onClick={goBack} disabled={stepIndex === 0}>
              ← Back
            </button>
            <button
              style={styles.primaryBtn}
              onClick={goNext}
              disabled={stepIndex === STEPS.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
