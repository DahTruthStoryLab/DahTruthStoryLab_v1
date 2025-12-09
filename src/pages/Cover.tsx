// src/pages/Cover.tsx
import React, { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage } from "../lib/uploads"; // re-use your existing uploader

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

const COVER_PREF_KEY = "dahtruth_cover_prefs";

type TrimSize = "6x9" | "5.5x8.5" | "5x8";
type BgType = "solid" | "gradient" | "image";

interface CoverPrefs {
  title: string;
  subtitle: string;
  author: string;
  series: string;
  tagline: string;
  trimSize: TrimSize;
  bgType: BgType;
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
  const [isUploading, setIsUploading] = useState(false);

  // Load saved prefs from localStorage
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

  // Helper for controlled fields
  const update = <K extends keyof CoverPrefs>(key: K, value: CoverPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  // Derived: aspect ratio based on trim size
  const aspect =
    prefs.trimSize === "6x9"
      ? 9 / 6
      : prefs.trimSize === "5.5x8.5"
      ? 8.5 / 5.5
      : 8 / 5;
  const width = 260;
  const height = width * aspect;

  // Handle image upload for bgType = "image"
  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadImage(file); // assumes this returns a string URL
      update("imageUrl", url);
      update("bgType", "image");
    } catch (err) {
      console.error("Image upload failed", err);
      // you could show a toast later
    } finally {
      setIsUploading(false);
    }
  };

  // Base cover style + background style
  const baseCoverStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: 12,
    boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  };

  const coverBackgroundStyle: React.CSSProperties =
    prefs.bgType === "image" && prefs.imageUrl
      ? {
          backgroundColor: "#020617",
          backgroundImage: `url(${prefs.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          background:
            prefs.bgType === "gradient"
              ? prefs.bgGradient
              : prefs.bgColor,
        };

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
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Rough-in your cover inside StoryLab before moving to a
              design tool or your designer.
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
          {/* LEFT: Details + Design */}
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
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
                Book details
              </h3>
              <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                <label>
                  Title
                  <input
                    type="text"
                    value={prefs.title}
                    onChange={(e) => update("title", e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </label>
                <label>
                  Subtitle
                  <input
                    type="text"
                    value={prefs.subtitle}
                    onChange={(e) => update("subtitle", e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </label>
                <label>
                  Author
                  <input
                    type="text"
                    value={prefs.author}
                    onChange={(e) => update("author", e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </label>
                <label>
                  Series / Imprint (optional)
                  <input
                    type="text"
                    value={prefs.series}
                    onChange={(e) => update("series", e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </label>
                <label>
                  Tagline (optional)
                  <input
                    type="text"
                    value={prefs.tagline}
                    onChange={(e) => update("tagline", e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
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
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
                Design
              </h3>
              <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                <label>
                  Trim size
                  <select
                    value={prefs.trimSize}
                    onChange={(e) =>
                      update(
                        "trimSize",
                        e.target.value as CoverPrefs["trimSize"]
                      )
                    }
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="6x9">6 × 9 in (standard)</option>
                    <option value="5.5x8.5">5.5 × 8.5 in</option>
                    <option value="5x8">5 × 8 in</option>
                  </select>
                </label>

                <label>
                  Background type
                  <select
                    value={prefs.bgType}
                    onChange={(e) =>
                      update(
                        "bgType",
                        e.target.value as CoverPrefs["bgType"]
                      )
                    }
                    style={{
                      width: "100%",
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="solid">Solid color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image (uploaded)</option>
                  </select>
                </label>

                {prefs.bgType === "solid" && (
                  <label>
                    Background color (hex)
                    <input
                      type="text"
                      value={prefs.bgColor}
                      onChange={(e) =>
                        update("bgColor", e.target.value || "#111827")
                      }
                      style={{
                        width: "100%",
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                      }}
                    />
                  </label>
                )}

                {prefs.bgType === "gradient" && (
                  <label>
                    Gradient CSS
                    <input
                      type="text"
                      value={prefs.bgGradient}
                      onChange={(e) =>
                        update(
                          "bgGradient",
                          e.target.value || "linear-gradient(135deg,#1f2933,#111827)"
                        )
                      }
                      style={{
                        width: "100%",
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                      }}
                    />
                  </label>
                )}

                {prefs.bgType === "image" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <label>
                      Cover image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        style={{
                          width: "100%",
                          padding: 4,
                          fontSize: 12,
                        }}
                      />
                    </label>
                    {prefs.imageUrl && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>Image attached</span>
                        <button
                          type="button"
                          onClick={() => update("imageUrl", null)}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: 11,
                            color: "#ef4444",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {isUploading && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                        }}
                      >
                        Uploading image…
                      </div>
                    )}
                  </div>
                )}
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
              <div style={{ ...baseCoverStyle, ...coverBackgroundStyle }}>
                {/* Title area */}
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
                This is a planning tool. Use these specs when you or your
                designer builds the final print-ready cover.
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
