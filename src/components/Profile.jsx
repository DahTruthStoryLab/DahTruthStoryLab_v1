// src/components/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  LogOut,
  Save,
  X,
  BookOpen,
  PenSquare,
  Link2,
  Settings,
} from "lucide-react";
import heic2any from "heic2any";

// -------------------- Storage Keys --------------------
const PROFILE_KEY = "profile";
const PROJECTS_KEY = "userProjects";

// -------------------- Load/Save Helpers --------------------
function getDefaultProfile() {
  return {
    displayName: "New Author",
    tagline: "",
    bio: "",
    avatarUrl: "",
    genres: [],
    website: "",
    instagram: "",
    twitter: "",
    facebook: "",
    email: "",
    memberSince: new Date().toISOString(),
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return getDefaultProfile();
    return { ...getDefaultProfile(), ...JSON.parse(raw) };
  } catch {
    return getDefaultProfile();
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("profile:updated"));
  } catch (err) {
    console.error("Failed to save profile:", err);
  }
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// -------------------- Image Helpers (HEIC/iPhone support) --------------------
async function heicArrayBufferToJpegDataUrl(arrayBuffer, quality = 0.9) {
  const blob = new Blob([arrayBuffer], { type: "image/heic" });
  const jpegBlob = await heic2any({ blob, toType: "image/jpeg", quality });
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(jpegBlob);
  });
  return dataUrl;
}

async function downscaleDataUrl(dataUrl, maxDim = 800, quality = 0.9) {
  const img = await new Promise((resolve, reject) => {
    const x = new Image();
    x.onload = () => resolve(x);
    x.onerror = reject;
    x.src = dataUrl;
  });
  let { width, height } = img;
  if (Math.max(width, height) <= maxDim) return dataUrl;
  const scale = maxDim / Math.max(width, height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

// -------------------- Genre Options --------------------
const GENRE_OPTIONS = [
  "Urban Fiction",
  "Romance",
  "Mystery",
  "Drama",
  "Thriller",
  "Sci-Fi",
  "Fantasy",
  "Historical",
  "YA",
  "Literary",
  "Horror",
  "Comedy",
  "Adventure",
  "Memoir",
];

// -------------------- Main Component --------------------
export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getDefaultProfile());
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadedProfile = loadProfile();
    setProfile(loadedProfile);
  }, []);

  // Listen for external profile changes
  useEffect(() => {
    const sync = () => {
      setProfile(loadProfile());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("profile:updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("profile:updated", sync);
    };
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre) => {
    setProfile((prev) => {
      const genres = prev.genres || [];
      if (genres.includes(genre)) {
        return { ...prev, genres: genres.filter((g) => g !== genre) };
      } else {
        return { ...prev, genres: [...genres, genre] };
      }
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("Image is too large. Please choose an image under 10MB.");
        return;
      }

      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      let dataUrl = "";
      if (isHEIC) {
        const ab = await file.arrayBuffer();
        const jpegDataUrl = await heicArrayBufferToJpegDataUrl(ab, 0.9);
        dataUrl = await downscaleDataUrl(jpegDataUrl, 800, 0.9);
      } else {
        dataUrl = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result || ""));
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
        dataUrl = await downscaleDataUrl(String(dataUrl), 800, 0.9);
      }

      updateProfile("avatarUrl", dataUrl);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Failed to upload image. Please try again or use a different image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveProfile(profile);

      // Also update author name in all projects
      const projects = loadProjects();
      if (projects.length > 0) {
        const updatedProjects = projects.map((p) => ({
          ...p,
          author: profile.displayName,
        }));
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
        window.dispatchEvent(new Event("project:change"));
      }

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      navigate("/");
    }
  };

  const getInitials = () => {
    const name = profile.displayName || "A";
    return name.charAt(0).toUpperCase();
  };

  const formatMemberSince = () => {
    if (!profile.memberSince) return "—";
    const date = new Date(profile.memberSince);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div
      className="min-h-screen text-gray-800"
      style={{
        background: "linear-gradient(135deg, #fef5ff 0%, #f8e8ff 50%, #fff5f7 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Dashboard Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #f5e6b3)",
            color: "#1f2937",
            border: "1px solid rgba(180,142,38,0.9)",
            boxShadow: "0 6px 18px rgba(180,142,38,0.35)",
          }}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Profile Header Card */}
        <div
          className="rounded-3xl overflow-hidden mb-6"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 14px 45px rgba(15,23,42,0.08)",
          }}
        >
          {/* Header gradient banner */}
          <div
            className="h-28"
            style={{
              background: "linear-gradient(135deg, #b897d6, #e3c8ff, #f5e6ff)",
            }}
          />

          <div className="px-8 pb-8 -mt-16 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-6">
              <div
                className="w-36 h-36 rounded-full p-1.5"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #9b7bc9)",
                  boxShadow: "0 12px 40px rgba(155,123,201,0.4)",
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #e8dff5, #f5e6ff)",
                  }}
                >
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-purple-400" />
                  ) : profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-5xl font-semibold"
                      style={{
                        fontFamily: "'EB Garamond', Georgia, serif",
                        color: "#6b4f7a",
                      }}
                    >
                      {getInitials()}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload button */}
              <label
                className="absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                style={{
                  background: "white",
                  border: "3px solid #f8e8ff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                title="Upload photo (supports iPhone photos)"
              >
                <Camera size={18} className="text-purple-600" />
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* Name input */}
            <input
              type="text"
              value={profile.displayName || ""}
              onChange={(e) => updateProfile("displayName", e.target.value)}
              placeholder="Your name or pen name..."
              className="w-full max-w-md mx-auto text-center text-3xl font-semibold bg-transparent outline-none border-b-2 border-transparent hover:border-purple-200 focus:border-purple-400 transition-colors pb-1"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#2b143f",
              }}
            />

            {/* Tagline input */}
            <input
              type="text"
              value={profile.tagline || ""}
              onChange={(e) => updateProfile("tagline", e.target.value)}
              placeholder="Add a tagline... (e.g., 'Urban fiction author & storyteller')"
              className="mt-3 w-full max-w-lg mx-auto text-center text-base bg-transparent outline-none italic"
              style={{ color: "rgba(31,41,55,0.6)" }}
            />
          </div>
        </div>

        {/* About Me Section */}
        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(155,123,201,0.08)" }}
            >
              <PenSquare size={18} className="text-purple-700" />
            </div>
            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#2b143f",
              }}
            >
              About Me
            </h2>
          </div>

          <textarea
            value={profile.bio || ""}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                updateProfile("bio", e.target.value);
              }
            }}
            placeholder="Tell readers about yourself... What inspires your writing? What genres do you love? Share your story."
            className="w-full min-h-32 p-4 rounded-2xl text-base leading-relaxed outline-none resize-y transition-all"
            style={{
              background: "rgba(248,250,252,0.8)",
              border: "1px solid rgba(148,163,184,0.3)",
              color: "#1f2937",
            }}
          />
          <div className="text-right text-xs text-gray-400 mt-2">
            {(profile.bio || "").length} / 500 characters
          </div>
        </div>

        {/* Writing Genres Section */}
        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.08)" }}
            >
              <BookOpen size={18} className="text-amber-600" />
            </div>
            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#2b143f",
              }}
            >
              Writing Genres
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Select the genres you focus on in your writing:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {GENRE_OPTIONS.map((genre) => {
              const isActive = (profile.genres || []).includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #9b7bc9, #b897d6)"
                      : "rgba(155,123,201,0.06)",
                    color: isActive ? "white" : "#6b4f7a",
                    border: isActive
                      ? "1px solid transparent"
                      : "1px solid rgba(155,123,201,0.2)",
                  }}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Links Section */}
        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.08)" }}
            >
              <Link2 size={18} className="text-blue-600" />
            </div>
            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#2b143f",
              }}
            >
              Social & Website
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-5">
            Optional: share where readers can follow your work.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: <Globe size={18} />,
                field: "website",
                placeholder: "Your website (e.g., dahtruth.com)",
                bg: "rgba(59,130,246,0.1)",
              },
              {
                icon: <Instagram size={18} />,
                field: "instagram",
                placeholder: "Instagram username",
                bg: "rgba(236,72,153,0.1)",
              },
              {
                icon: <Twitter size={18} />,
                field: "twitter",
                placeholder: "X (Twitter) username",
                bg: "rgba(14,165,233,0.1)",
              },
              {
                icon: <Facebook size={18} />,
                field: "facebook",
                placeholder: "Facebook page URL",
                bg: "rgba(59,89,152,0.1)",
              },
            ].map((item) => (
              <div key={item.field} className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}
                >
                  <span className="text-gray-600">{item.icon}</span>
                </div>
                <input
                  type="text"
                  value={profile[item.field] || ""}
                  onChange={(e) => updateProfile(item.field, e.target.value)}
                  placeholder={item.placeholder}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(248,250,252,0.8)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    color: "#1f2937",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(107,114,128,0.08)" }}
            >
              <Settings size={18} className="text-slate-600" />
            </div>
         

            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#2b143f",
              }}
            >
              Account
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { label: "Email", value: profile.email || "—" },
              { label: "Member Since", value: formatMemberSince() },
              {
                label: "Plan",
                value: "Premium Author",
                highlight: true,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: "rgba(248,250,252,0.8)" }}
              >
                <span className="text-sm text-gray-500">{item.label}</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: item.highlight ? "#D4AF37" : "#1f2937",
                    fontWeight: item.highlight ? 600 : 500,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSignOut}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#dc2626",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Save Actions */}
        <div className="flex gap-4 justify-center pb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#1f2937",
              border: "1px solid rgba(148,163,184,0.3)",
            }}
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #9b7bc9, #b897d6)",
              boxShadow: "0 4px 16px rgba(155,123,201,0.4)",
            }}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showSaved && (
        <div
          className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold"
          style={{
            background: "linear-gradient(135deg, #10b981, #34d399)",
            boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
          }}
        >
          <span>✓</span>
          Profile saved!
        </div>
      )}
    </div>
  );
}
