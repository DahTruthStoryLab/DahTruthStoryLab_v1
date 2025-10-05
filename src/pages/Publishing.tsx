// src/pages/Publishing.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import AeroBanner from "../components/layout/AeroBanner.tsx";

/* ---------- Theme via CSS variables (from your brand.css) ---------- */
const theme = {
  bg: "var(--brand-bg)",
  surface: "var(--brand-white)",
  border: "var(--brand-border)",
  borderStrong: "var(--brand-border-strong)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  primary: "var(--brand-primary)",
  white: "var(--brand-white)",
};

/* ---------- Types ---------- */
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
    border: `1px solid var(--brand-border-strong)`,
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
};

/* ---------- Small UI helpers ---------- */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
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
          background: theme.white,
          color: theme.text,
        }}
      />
    </div>
  );
}

/* ---------- Helpers ---------- */
function safeFile(name: string): string {
  return (name || "manuscript").replace(/[^\w\-]+/g, "_");
}

/* ---------- Component ---------- */
const STEPS: { key: StepKey; label: string }[] = [
  { key: "builder", label: "Manuscript Builder" },
  { key: "proof", label: "Proof & Consistency" },
  { key: "format", label: "Format & Styles" },
  { key: "export", label: "Export" },
  { key: "prep", label: "Publishing Prep" },
];

export default function Publishing(): JSX.Element {
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

  // meta + content
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

  // presets + overrides (so Single/Double buttons really work)
  const [manuscriptPreset, setManuscriptPreset] =
    useState<ManuscriptPresetKey>("Agents_Standard_12pt_TNR_Double");
  const [platformPreset, setPlatformPreset] =
    useState<PlatformPresetKey>("Generic_Manuscript_Submission");
  const [msOverrides, setMsOverrides] = useState<
    Partial<(typeof MANUSCRIPT_PRESETS)[ManuscriptPresetKey]>
  >({});

  // keep overrides sane when switching presets (reset lineHeight to chosen preset)
  useEffect(() => {
    setMsOverrides((prev) => ({
      ...prev,
      lineHeight: MANUSCRIPT_PRESETS[manuscriptPreset].lineHeight,
    }));
  }, [manuscriptPreset]);

  const ms = { ...MANUSCRIPT_PRESETS[manuscriptPreset], ...msOverrides };
  const pf = PLATFORM_PRESETS[platformPreset];
  const includeHeadersFooters = pf.headers || pf.footers;

  // compile plain text
  const compiled: string = useMemo(() => {
    const vars = (s: string) =>
      s.replaceAll("{title}", meta.title).replaceAll("{author}", meta.author).replaceAll("{year}", meta.year);

    const parts: string[] = [];
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

    chapters.forEach((c) => {
      if (!c.included) return;
      // mimic visual density differences for double spacing
      const txt = ms.lineHeight && ms.lineHeight >= 2 ? c.text.replaceAll(" ", "  ") : c.text;
      parts.push("\n\n" + c.title + "\n" + txt);
    });

    if (matter.acknowledgments) parts.push("\n\nAcknowledgments\n" + matter.acknowledgments);
    if (matter.aboutAuthor) parts.push("\n\nAbout the Author\n" + vars(matter.aboutAuthor));
    if (matter.notes) parts.push("\n\nNotes\n" + matter.notes);

    return parts.join("\n").trim();
  }, [chapters, matter, meta, ms.lineHeight]);

  const wordCount = useMemo(
    () => compiled.split(/\s+/).filter(Boolean).length,
    [compiled]
  );

  // HTML preview with print CSS
  const compiledHTML: string = useMemo(() => {
    const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    const front = [
      matter.titlePage,
      matter.copyright,
      matter.dedication && `Dedication\n${matter.dedication}`,
      matter.epigraph && `Epigraph\n${matter.epigraph}`,
    ]
      .filter(Boolean)
      .map((s) => `<p>${esc(String(s)).replaceAll("\n", "<br/>")}</p>`)
      .join("\n");

    const toc = matter.toc
      ? `<h2 class="chapter" style="page-break-before: always">Contents</h2><p>${chapters
          .filter((c) => c.included)
          .map((c, i) => `${i + 1}. ${esc(c.title)}`)
          .join("<br/>")}</p>`
      : "";

    const chapterized = chapters
      .filter((c) => c.included)
      .map((c) => {
        const t =
          ms.chapterTitleCase === "UPPER"
            ? c.title.toUpperCase()
            : ms.chapterTitleCase === "Capitalize"
            ? c.title.replace(/\b(\w)/g, (m) => m.toUpperCase())
            : c.title;
        const body = esc(c.text).replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br/>");
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
        return `<h2 class="chapter">${lines[0]}</h2><p>${esc(lines.slice(1).join("\n")).replaceAll("\n", "<br/>")}</p>`;
      })
      .join("\n");

    const css = `
      @page { margin: ${pf.margins.top}in ${pf.margins.right}in ${pf.margins.bottom}in ${pf.margins.left}in; }
      body { font-family: ${ms.fontFamily}; font-size: ${ms.fontSizePt}pt; margin: 0; line-height: ${ms.lineHeight}; color: #111; }
      p { orphans: 3; widows: 3; ${ms.align === "justify" ? "text-align: justify;" : ""} ${
      ms.firstLineIndentInches ? `text-indent: ${ms.firstLineIndentInches}in;` : ""
    } ${ms.paragraphSpacingPt ? `margin: 0 0 ${ms.paragraphSpacingPt}pt 0;` : ""} }
      h2.chapter { ${ms.chapterStartsOnNewPage ? "page-break-before: always;" : ""} text-align:center; margin: 0 0 1em 0; font-weight: bold; }
    `;

    const titleBlock = `
      <div style="text-align:center; font-size:${ms.fontSizePt + 4}pt; font-weight:bold; margin-bottom: 1.5em;">${meta.title}</div>
      <div style="text-align:center; margin-bottom: 2em;">by ${meta.author} • ${meta.year}</div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${meta.title}</title><style>${css}</style></head><body>${titleBlock}${front}${toc}${chapterized}${back}</body></html>`;
  }, [chapters, matter, meta, ms, pf]);

  /* ---------- Proof helpers ---------- */
  const [proofResults, setProofResults] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  function runLocalChecks() {
    const issues: string[] = [];
    if (compiled.match(/ {2,}/)) issues.push("Multiple consecutive spaces found.");
    if (compiled.match(/[“”]/) && !compiled.match(/[‘’]/))
      issues.push("Smart quotes present; ensure consistency of curly quotes.");
    if (compiled.match(/--/)) issues.push("Double hyphen found; consider an em dash (—) or a period.");
    const longParas = compiled.split("\n\n").filter((p) => p.split(/\s+/).length > 250).length;
    if (longParas) issues.push(`${longParas} very long paragraph(s); consider breaking them up.`);
    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  // "AI" placeholder (local heuristic now; swap to your API later)
  async function runAIChecks() {
    setAiBusy(true);
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

    compiled.split("\n\n").forEach((block) => {
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
    const esc = (t: string) => t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const xhtml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<!DOCTYPE html>",
      '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">',
      "<head>",
      '  <meta charset="utf-8"/>',
      `  <title>${esc(meta.title)}</title>`,
      "  <style>body{font-family:serif;line-height:1.45;margin:1em;} p{margin:0 0 1em 0;}</style>",
      "</head>",
      "<body>",
      compiled
        .split("\n\n")
        .map((b) => "<p>" + esc(b).replaceAll("\n", "<br/>") + "</p>")
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
    const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    const body = compiled
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
    <PageShell style={{ background: theme.bg, minHeight: "100vh" }}>
      <div style={styles.outer}>
        {/* Header Bar (gradient) */}
        <div
          style={{
            background: `linear-gradient(135deg, var(--brand-primary), var(--brand-accent))`,
            color: theme.white,
            padding: "14px 18px",
          }}
          aria-label="Publishing banner"
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Back */}
            <div>
              <button
                onClick={() => navigate(-1)}
                style={{
                  ...styles.btn,
                  border: "none",
                  background: "rgba(255,255,255,0.15)",
                  color: theme.white,
                }}
                aria-label="Go back"
              >
                ← Back
              </button>
            </div>

            {/* Center title with icons */}
            <div style={{ textAlign: "center", display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
              {/* Book icon */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M6 2h9a3 3 0 0 1 3 3v12.5a1.5 1.5 0 0 1-1.5 1.5H7a3 3 0 0 0-3 3V5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v13.764A4.99 4.99 0 0 1 7 18h9V5a1 1 0 0 0-1-1H6z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 18, letterSpacing: 0.2 }}>Publishing Suite</h1>
              {/* Site icon (falls back to favicon) */}
              <img
                src="/favicon.ico"
                alt="Site icon"
                width={20}
                height={20}
                style={{ borderRadius: 4, opacity: 0.95 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Right spacer */}
            <div />
          </div>
        </div>

        {/* Optional house banner just below header */}
        <AeroBanner
          size="md"
          title="Publishing Suite"
          subtitle="Presets • Page Breaks • Headers & Footers"
        />

        {/* Page body */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
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

          {/* Meta */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Manuscript Details</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Title</label>
                <input
                  style={styles.input}
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  placeholder="Enter your book title"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author</label>
                <input
                  style={styles.input}
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Publication Year</label>
                <input
                  style={styles.input}
                  value={meta.year}
                  onChange={(e) => setMeta({ ...meta, year: e.target.value })}
                  placeholder="YYYY"
                />
              </div>
              <div>
                <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author Last Name (header)</label>
                <input
                  style={styles.input}
                  value={meta.authorLast || ""}
                  onChange={(e) => setMeta({ ...meta, authorLast: e.target.value })}
                  placeholder="For running header"
                />
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: 16, color: theme.subtext, fontSize: 14 }}>
                <div>
                  Words: <strong>{wordCount.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Format & Presets */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Format & Presets</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ minWidth: 260 }}>
                <div style={styles.label}>Manuscript Preset</div>
                <select
                  value={manuscriptPreset}
                  onChange={(e) => setManuscriptPreset(e.target.value as ManuscriptPresetKey)}
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
                    ? "DOCX export will include page-level margins (headers/footers typical for print)."
                    : "Headers/footers disabled for this platform (typical for eBooks)."}
                </div>
              </div>

              {/* Single / Double buttons – actually update lineHeight */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={styles.label}>Line Spacing</span>
                <button
                  style={{
                    ...styles.btn,
                    ...(ms.lineHeight && ms.lineHeight < 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
                  }}
                  onClick={() => setMsOverrides((o) => ({ ...o, lineHeight: 1.5 }))}
                >
                  Single (1.5)
                </button>
                <button
                  style={{
                    ...styles.btn,
                    ...(ms.lineHeight && ms.lineHeight >= 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
                  }}
                  onClick={() => setMsOverrides((o) => ({ ...o, lineHeight: 2.0 }))}
                >
                  Double (2.0)
                </button>
              </div>
            </div>
          </div>

          {/* Step body */}
          <div style={{ ...styles.glassCard, marginBottom: 20, minHeight: 400 }}>
            {step === "builder" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Live Preview</h3>
                  <div style={styles.preview}>
                    <iframe title="preview" style={{ width: "100%", height: 328, border: 0 }} srcDoc={compiledHTML} />
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Front & Back Matter</h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    <Field label="Title Page" value={matter.titlePage} onChange={(v) => setMatter({ ...matter, titlePage: v })} />
                    <Field label="Copyright" value={matter.copyright} onChange={(v) => setMatter({ ...matter, copyright: v })} />
                    <Field label="Dedication" value={matter.dedication} onChange={(v) => setMatter({ ...matter, dedication: v })} />
                    <Field label="Epigraph" value={matter.epigraph} onChange={(v) => setMatter({ ...matter, epigraph: v })} />
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 14, color: theme.text }}
                    >
                      <input
                        type="checkbox"
                        checked={matter.toc}
                        onChange={(e) => setMatter({ ...matter, toc: e.target.checked })}
                      />{" "}
                      Include Table of Contents
                    </label>
                    <div style={{ borderTop: `1px solid ${theme.border}`, margin: "8px 0" }} />
                    <Field
                      label="Acknowledgments"
                      value={matter.acknowledgments}
                      onChange={(v) => setMatter({ ...matter, acknowledgments: v })}
                    />
                    <Field
                      label="About the Author"
                      value={matter.aboutAuthor}
                      onChange={(v) => setMatter({ ...matter, aboutAuthor: v })}
                    />
                    <Field label="Author Notes" value={matter.notes} onChange={(v) => setMatter({ ...matter, notes: v })} />
                  </div>
                </div>
              </div>
            )}

            {step === "proof" && (
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>Proof & Consistency</h3>
                <p style={{ color: theme.subtext, fontSize: 14, marginTop: 0 }}>
                  Local quick checks now. You can wire these buttons to your server-side AI later.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button style={styles.btn} onClick={runLocalChecks}>
                    Grammar Check (Local)
                  </button>
                  <button style={styles.btn} onClick={runLocalChecks}>
                    Style Analysis (Local)
                  </button>
                  <button style={styles.btn} onClick={runLocalChecks}>
                    Character Consistency (Local)
                  </button>
                  <button style={styles.btn} onClick={runLocalChecks}>
                    Timeline Validation (Local)
                  </button>
                  <button style={styles.btnPrimary} onClick={runAIChecks} disabled={aiBusy}>
                    {aiBusy ? "AI Proof… " : "AI Proof (Local Suggestions)"}
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button style={styles.btn} onClick={exportPDF}>
                    📄 Export PDF (Print dialog)
                  </button>
                  <button style={styles.btn} onClick={exportDOCX}>
                    📝 Export DOCX
                  </button>
                  <button style={styles.btnPrimary} onClick={exportEPUB}>
                    📖 Export EPUB (.epub)
                  </button>
                  <button style={styles.btnDark} onClick={exportEPUBXHTML}>
                    📑 Export EPUB XHTML
                  </button>
                </div>
              </div>
            )}

            {step === "prep" && (
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Publishing Preparation</h3>
                <p style={{ color: theme.subtext, fontSize: 14 }}>Get your submission assets ready.</p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
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
              <h3 style={{ margin: 0, fontSize: 18, color: theme.text }}>Chapter Management</h3>
              <button
                style={styles.btnPrimary}
                onClick={() =>
                  setChapters((prev) => [
                    ...prev,
                    {
                      id: crypto && "randomUUID" in crypto ? (crypto as any).randomUUID() : `c_${Date.now()}`,
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
                    background: c.included ? theme.white : "#F9FBFD",
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>
                        {c.text.slice(0, 100)}…
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
                        onChange={(v) =>
                          setChapters((prev) => prev.map((x) => (x.id === c.id ? { ...x, included: v } : x)))
                        }
                        label={c.included ? "Included" : "Excluded"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button style={styles.btn} onClick={goBack} disabled={stepIndex === 0}>
              ← Back
            </button>
            <button style={styles.btnPrimary} onClick={goNext} disabled={stepIndex === STEPS.length - 1}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
