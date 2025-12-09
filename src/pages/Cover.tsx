// src/pages/Cover.tsx
import React, { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell.tsx";

const COVER_PREF_KEY = "dahtruth_cover_prefs";

interface CoverPrefs {
  title: string;
  subtitle: string;
  author: string;
  series: string;
  tagline: string;
  trimSize: "6x9" | "5.5x8.5" | "5x8";
  bgType: "solid" | "gradient" | "image";
  bgColor: string;
  bgGradient: string;
  imageUrl: string | null;
  titleFont: string;
  subtitleFont: string;
  authorFont: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
}

const defaultPrefs: CoverPrefs = {
  title: "",
  subtitle: "",
  author: "",
  series: "",
  tagline: "",
  trimSize: "6x9",
  bgType: "solid",
  bgColor: "#111827",
  bgGradient: "linear-gradient(135deg,#1f2933,#111827)",
  imageUrl: null,
  titleFont: '"Merriweather", serif',
  subtitleFont: '"Inter", system-ui, sans-serif',
  authorFont: '"Inter", system-ui, sans-serif',
  titleColor: "#ffffff",
  subtitleColor: "#e5e7eb",
  authorColor: "#f9fafb",
};

export default function Cover(): JSX.Element {
  const [prefs, setPrefs] = useState<CoverPrefs>(defaultPrefs);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COVER_PREF_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setPrefs({ ...defaultPrefs, ...parsed });
    } catch {
      // ignore
    }
  }, []);

  const savePrefs = () => {
    try {
      localStorage.setItem(COVER_PREF_KEY, JSON.stringify(prefs));
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      // ignore
    }
  };

  // Helper for controlled inputs
  const update = <K extends keyof CoverPrefs>(key: K, value: CoverPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  // Derived: aspect ratio based on trim size
  const aspect = prefs.trimSize === "6x9" ? 9 / 6 : prefs.trimSize === "5.5x8.5" ? 8.5 / 5.5 : 8 / 5;
  const width = 260;
  const height = width * aspect;

  return (
    <PageShell title="Cover">
      <div
        style={{
          maxWidth: 1300,
          margin: "32px auto",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid rgba(15,23,42,0.1)",
          boxShadow: "0 12px 38px rgba(15,23,42,0.08)",
          padding: 20,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Book Cover</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              Rough-in your cover before you move to a design tool or your designer.
            </p>
          </div>
          <button
            type="button"
            onClick={savePrefs}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: "linear-gradient(135deg,#22c55e,#4ade80)",
              color: "#0f172a",
            }}
          >
            Save cover settings
          </button>
        </div>

        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr)",
            gap: 20,
          }}
        >
          {/* LEFT: Fields + controls */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: "auto auto",
              gap: 16,
            }}
          >
            {/* Book info */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                padding: 12,
                background: "#f9fafb",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Book details</h3>
              <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                <label>
                  Title
                  <input
                    type="text"
                    value={prefs.title}
                    onChange={(e) => update("title", e.target.value)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label>
                  Subtitle
                  <input
                    type="text"
                    value={prefs.subtitle}
                    onChange={(e) => update("subtitle", e.target.value)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label>
                  Author
                  <input
                    type="text"
                    value={prefs.author}
                    onChange={(e) => update("author", e.target.value)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label>
                  Series / Imprint (optional)
                  <input
                    type="text"
                    value={prefs.series}
                    onChange={(e) => update("series", e.target.value)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label>
                  Tagline (optional)
                  <input
                    type="text"
                    value={prefs.tagline}
                    onChange={(e) => update("tagline", e.target.value)}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
            </div>

            {/* Design controls */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                padding: 12,
                background: "#f9fafb",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Design</h3>
              <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                <label>
                  Trim size
                  <select
                    value={prefs.trimSize}
                    onChange={(e) =>
                      update("trimSize", e.target.value as CoverPrefs["trimSize"])
                    }
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="6x9">6 x 9 in (standard)</option>
                    <option value="5.5x8.5">5.5 x 8.5 in</option>
                    <option value="5x8">5 x 8 in</option>
                  </select>
                </label>

                <label>
                  Background
                  <select
                    value={prefs.bgType}
                    onChange={(e) =>
                      update("bgType", e.target.value as CoverPrefs["bgType"])
                    }
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="solid">Solid color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image (uploaded)</option>
                  </select>
                </label>

                {/* You can later add a color picker or upload control here */}
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              paddingTop: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                Front cover preview
              </div>
              <div
                style={{
                  width,
                  height,
                  borderRadius: 12,
                  boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background:
                    prefs.bgType === "gradient"
                      ? prefs.bgGradient
                      : prefs.bgType === "solid"
                      ? prefs.bgColor
                      : "#111827",
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Title + subtitle */}
                <div>
                  {prefs.series && (
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        marginBottom: 6,
                        opacity: 0.85,
                      }}
                    >
                      {prefs.series}
                    </div>
                  )}
                  {prefs.title && (
                    <div
                      style={{
                        fontFamily: prefs.titleFont,
                        fontSize: 24,
                        lineHeight: 1.1,
                        fontWeight: 700,
                        color: prefs.titleColor,
                        marginBottom: prefs.subtitle ? 8 : 0,
                      }}
                    >
                      {prefs.title}
                    </div>
                  )}
                  {prefs.subtitle && (
                    <div
                      style={{
                        fontFamily: prefs.subtitleFont,
                        fontSize: 13,
                        lineHeight: 1.4,
                        color: prefs.subtitleColor,
                      }}
                    >
                      {prefs.subtitle}
                    </div>
                  )}
                </div>

                {/* Tagline + author */}
                <div>
                  {prefs.tagline && (
                    <div
                      style={{
                        fontSize: 11,
                        marginBottom: 6,
                        opacity: 0.9,
                      }}
                    >
                      {prefs.tagline}
                    </div>
                  )}
                  {prefs.author && (
                    <div
                      style={{
                        fontFamily: prefs.authorFont,
                        fontSize: 13,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: prefs.authorColor,
                      }}
                    >
                      {prefs.author}
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                This is a visual planning tool. Use these specs when you or your
                designer build the final print-ready cover.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save toast */}
      {showSaved && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #22c55e, #4ade80)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(22,163,74,0.4)",
          }}
        >
          Cover settings saved
        </div>
      )}
    </PageShell>
  );
}
