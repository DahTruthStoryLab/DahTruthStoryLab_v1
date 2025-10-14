// src/pages/PublishingPrep.tsx
import React, { useState } from "react";
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
  toolCard: {
    background: theme.white,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  } as React.CSSProperties,
  btn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: theme.accent,
    color: theme.white,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
  } as React.CSSProperties,
} as const;

/* ---------- Component ---------- */
export default function PublishingPrep(): JSX.Element {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: "synopsis",
      icon: "📝",
      title: "Synopsis Generator",
      description: "Create compelling book summaries for agents and readers. AI-powered suggestions.",
      action: "Generate Synopsis",
    },
    {
      id: "query",
      icon: "✉️",
      title: "Query Letter Builder",
      description: "Craft professional query letters for literary agents with proven templates.",
      action: "Build Query Letter",
    },
    {
      id: "checklist",
      icon: "✅",
      title: "Self-Publishing Checklist",
      description: "Complete pre-launch checklist for self-publishers. Track your progress.",
      action: "View Checklist",
    },
    {
      id: "marketing",
      icon: "📊",
      title: "Marketing Kit",
      description: "Build your author platform with social media templates and promotional materials.",
      action: "Create Marketing Kit",
    },
    {
      id: "genre",
      icon: "🏷️",
      title: "Genre Guidelines",
      description: "Learn formatting and content expectations for your specific genre.",
      action: "Browse Guidelines",
    },
    {
      id: "pricing",
      icon: "💰",
      title: "Pricing Calculator",
      description: "Calculate optimal pricing for your book based on length, genre, and market.",
      action: "Calculate Price",
    },
  ];

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    // In real implementation, this would navigate to the specific tool page
    alert(`${toolId} tool coming soon! This will open the ${toolId} interface.`);
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
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Publishing Preparation</h1>
            </div>
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Intro Card */}
          <div style={{ ...styles.glassCard, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme.text }}>
              Get Ready to Publish
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: theme.subtext, lineHeight: 1.6 }}>
              Essential tools to help you prepare your manuscript for submission or self-publishing.
              From query letters to marketing materials, we've got you covered.
            </p>
          </div>

          {/* Tools Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {tools.map((tool) => (
              <div
                key={tool.id}
                style={{
                  ...styles.toolCard,
                  borderColor: selectedTool === tool.id ? theme.accent : theme.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(2,20,40,0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: 42, marginBottom: 12 }}>{tool.icon}</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 17, color: theme.text, fontWeight: 600 }}>
                  {tool.title}
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: 13, color: theme.subtext, lineHeight: 1.6, flex: 1 }}>
                  {tool.description}
                </p>
                <button
                  style={styles.btn}
                  onClick={() => handleToolClick(tool.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.accent;
                  }}
                >
                  {tool.action}
                </button>
              </div>
            ))}
          </div>

          {/* Resources Section */}
          <div style={{ ...styles.glassCard, marginTop: 24 }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: theme.text, fontWeight: 600 }}>
              📚 Additional Resources
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
              <div>
                <h5 style={{ margin: "0 0 6px 0", fontSize: 14, color: theme.primary }}>Traditional Publishing</h5>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: theme.text, lineHeight: 1.8 }}>
                  <li>Agent submission guidelines</li>
                  <li>Query letter examples</li>
                  <li>Industry standard formatting</li>
                </ul>
              </div>
              <div>
                <h5 style={{ margin: "0 0 6px 0", fontSize: 14, color: theme.primary }}>Self-Publishing</h5>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: theme.text, lineHeight: 1.8 }}>
                  <li>Platform comparison guide</li>
                  <li>ISBN & copyright info</li>
                  <li>Cover design resources</li>
                </ul>
              </div>
              <div>
                <h5 style={{ margin: "0 0 6px 0", fontSize: 14, color: theme.primary }}>Marketing</h5>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: theme.text, lineHeight: 1.8 }}>
                  <li>Author platform building</li>
                  <li>Book launch strategies</li>
                  <li>Social media templates</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div style={{ ...styles.glassCard, marginTop: 24, background: theme.highlight }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: 16, color: theme.text, fontWeight: 600 }}>
              💡 Pro Tips
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: theme.text, fontSize: 13, lineHeight: 1.8 }}>
              <li>Start building your author platform <strong>before</strong> you publish</li>
              <li>Research your genre's market thoroughly - pricing and length matter</li>
              <li>Get professional editing and cover design - first impressions count</li>
              <li>Join writing communities and beta reader groups for feedback</li>
              <li>Create a launch plan at least 3 months before publication</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
