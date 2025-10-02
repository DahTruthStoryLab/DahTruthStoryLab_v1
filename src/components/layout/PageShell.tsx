import React from "react";

export type PageShellProps = {
  /** Optional page-level background color */
  background?: string;
  /** Constrain content width if true */
  contained?: boolean;
  /** Max width (applies when contained = true) */
  maxWidth?: number | string;
  /** Optional top/bottom padding inside the shell */
  padding?: string;
  /** Optional header/footer (could be a nav, etc.) */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Additional style overrides */
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const DEFAULT_BG = "#F6FAFF";

export default function PageShell({
  background = DEFAULT_BG,
  contained = true,
  maxWidth = 1120,
  padding = "20px 24px",
  header,
  footer,
  style,
  children,
}: PageShellProps) {
  return (
    <div style={{ minHeight: "100vh", background, ...style }}>
      {header}
      <main
        style={{
          margin: "0 auto",
          ...(contained ? { maxWidth } : { maxWidth: "none" }),
          padding,
        }}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
