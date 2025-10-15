// src/pages/Export.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";

/* ---------- Theme ---------- */
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
    padding: 24,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  exportCard: {
    background: theme.white,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  btn: {
    padding: "12px 20px",
    borderRadius: 12,
    border: "none",
    background: theme.accent,
    color: theme.white,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    width: "100%",
    transition: "all 0.2s ease",
  } as React.CSSProperties,
} as const;

/* ---------- Helper Functions ---------- */
function safeFile(name: string): string {
  return (name || "manuscript").replace(/[^\w\-]+/g, "_");
}

function htmlEscape(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/* ---------- Component ---------- */
export default function Export(): JSX.Element {
  const navigate = useNavigate();

  // Mock data - in real app, pass via props/context/state
  const meta = {
    title: "Working Title",
    author: "Your Name",
    year: new Date().getFullYear().toString(),
  };

  const compiledHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${htmlEscape(meta.title)}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 1in; line-height: 2.0; }
          h1, h2 { text-align: center; margin: 2em 0 1em 0; }
          p { margin: 0 0 1em 0; text-indent: 0.5in; }
        </style>
      </head>
      <body>
        <h1>${htmlEscape(meta.title)}</h1>
        <p style="text-align:center;">by ${htmlEscape(meta.author)} • ${meta.year}</p>
        <p>The morning held the kind of quiet that asks for a first sentence...</p>
      </body>
    </html>
  `;

  const compiledPlain = `${meta.title}\nby ${meta.author}\n\nThe morning held the kind of quiet that asks for a first sentence...`;

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to export PDF");
      return;
    }
    w.document.open();
    w.document.write(compiledHTML);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 200);
  };

  const exportDOCX = async () => {
    try {
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
                  top: convertInchesToTwip(1),
                  right: convertInchesToTwip(1),
                  bottom: convertInchesToTwip(1),
                  left: convertInchesToTwip(1),
                },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${safeFile(meta.title)}.docx`);
    } catch (error) {
      console.error("Export DOCX error:", error);
      alert("Failed to export DOCX. Make sure the required libraries are installed.");
    }
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
    try {
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
        '<head><meta charset="utf-8"/><title>Table of Contents</title></head>',
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
    } catch (error) {
      console.error("Export EPUB error:", error);
      alert("Failed to export EPUB. Make sure JSZip is installed.");
    }
  };

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
      }}
    >
      <div style={styles.outer}>
        {/* Header */}
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
            <button
              onClick={() => navigate("/publishing")}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: theme.white,
                padding: "10px 18px",
                fontSize: 15,
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ← Back to Publishing
            </button>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Export Manuscript</h1>
            </div>
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Info Card */}
          <div style={{ ...styles.glassCard, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>Export Options</h3>
            <p style={{ margin: 0, fontSize: 14, color: theme.subtext }}>
              Choose your export format below. DOCX and EPUB are ready for publishing platforms.
              PDF is great for print-ready manuscripts or submissions.
            </p>
          </div>

          {/* Export Options Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {/* PDF Export */}
            <div
              style={styles.exportCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(2,20,40,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>DOCX</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: theme.subtext, lineHeight: 1.6 }}>
                Microsoft Word format with proper margins and formatting. Edit further in Word or LibreOffice.
              </p>
              <button style={styles.btn} onClick={exportDOCX}>
                Export DOCX
              </button>
            </div>

            {/* EPUB Export */}
            <div
              style={styles.exportCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(2,20,40,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>EPUB</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: theme.subtext, lineHeight: 1.6 }}>
                eBook format (.epub) ready for Kindle, Apple Books, and other eReaders. Packaged and validated.
              </p>
              <button style={styles.btn} onClick={exportEPUB}>
                Export EPUB
              </button>
            </div>

            {/* XHTML Export */}
            <div
              style={styles.exportCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(2,20,40,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📑</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>XHTML</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 13, color: theme.subtext, lineHeight: 1.6 }}>
                Clean XHTML file for web publishing or custom eBook creation. Simple and flexible.
              </p>
              <button style={styles.btn} onClick={exportEPUBXHTML}>
                Export XHTML
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div style={{ ...styles.glassCard, marginTop: 24, background: theme.highlight }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: 16, color: theme.text }}>💡 Export Tips</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: theme.text, fontSize: 13, lineHeight: 1.8 }}>
              <li><strong>For submissions:</strong> Use PDF or DOCX with proper formatting and headers</li>
              <li><strong>For self-publishing:</strong> EPUB for Kindle Direct Publishing, Apple Books, etc.</li>
              <li><strong>For print books:</strong> Export DOCX, finalize in Word/LibreOffice, then save as PDF</li>
              <li><strong>Need headers/footers?</strong> Export DOCX and add them in Word with page numbers</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
       
