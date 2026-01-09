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
  /** Additional style overrides for outer shell */
  style?: React.CSSProperties;
  /** Optional class for outer shell */
  className?: string;
  /** Optional class for main container */
  mainClassName?: string;
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
  className = "",
  mainClassName = "",
  children,
}: PageShellProps) {
  return (
    <div
      className={className}
      style={{
        minHeight: "100vh",
        background,
        ...style,
      }}
    >
      {header}

      <main
        className={mainClassName}
        style={{
          margin: "0 auto",
          maxWidth: contained ? maxWidth : "none",
          padding,
        }}
      >
        {children}
      </main>

      {footer}
    </div>
  );
}
