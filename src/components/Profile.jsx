// src/components/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Save,
  BookOpen,
  LogOut,
  Mail,
  Image,
  ArrowLeft,
  Home,
  PencilLine,
  BookOpen as BookIcon,
  Calendar as CalIcon,
  Layers,
  Store,
  Info,
  Loader2,
} from "lucide-react";
import heic2any from "heic2any";

/* =========================================================
   Minimal, self-contained image helpers (no external imports)
   ========================================================= */
const isHeicLike = (f) => {
  const n = f.name?.toLowerCase() || "";
  const t = f.type?.toLowerCase() || "";
  return n.endsWith(".heic") || n.endsWith(".heif") || t === "image/heic" || t === "image/heif";
};

async function ensureJpegFile(file, quality = 0.9) {
  if (isHeicLike(file)) {
    const jpegBlob = await heic2any({ blob: file, toType: "image/jpeg", quality });
    const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([jpegBlob], name, { type: "image/jpeg" });
  }
  // If PNG, we’ll keep it unless it's too large—downscale will handle conversion to JPEG later
  return file;
}

async function resizeImageBlob(file, maxW = 2000, maxH = 2000, quality = 0.9) {
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  if (scale >= 1) {
    // no resize needed; return original blob
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Export to JPEG for consistent previews/storage
  const outDataUrl = canvas.toDataURL("image/jpeg", quality);
  const outBlob = await (await fetch(outDataUrl)).blob();
  const name = file.name.replace(/\.(png|webp)$/i, ".jpg");
  return new File([outBlob], name.endsWith(".jpg") ? name : `${name}.jpg`, {
    type: "image/jpeg",
  });
}

/* =========================================================
   Safe, optional store hook (no import path errors)
   ========================================================= */
const useUserSafe = () => null;

/* ---------- Local persistence ---------- */
const STORAGE_KEY = "dt_profile";

function readProfile() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("userProfile") ||
      localStorage.getItem("profile") ||
      localStorage.getItem("currentUser");
    return raw
      ? JSON.parse(raw)
      : { displayName: "", email: "", bio: "", avatar: "" };
  } catch {
    return { displayName: "", email: "", bio: "", avatar: "" };
  }
}

function writeProfile(p) {
  try {
    const payload = JSON.stringify(p);
    localStorage.setItem("dt_profile", payload);
    localStorage.setItem("userProfile", payload);
    localStorage.setItem("profile", payload);
    localStorage.setItem("currentUser", payload);
    window.dispatchEvent(new Event("profile:updated"));
  } catch {}
}

/* ---------- Inline Sidebar (optional) ---------- */
function ProfileSidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const items = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Writer", icon: PencilLine, path: "/writer" },
    { label: "Table of Contents", icon: BookIcon, path: "/toc" },
    { label: "Project", icon: Layers, path: "/project" },
    { label: "Calendar", icon: CalIcon, path: "/calendar" },
    { label: "Store", icon: Store, path: "/store" },
    { label: "About", icon: Info, path: "/about" },
  ];

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="glass-panel p-4 sticky top-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth"
            className="w-10 h-10 rounded-full border border-white/40"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <div className="heading-serif text-xl">DahTruth</div>
            <div className="text-xs text-muted -mt-0.5">StoryLab</div>
          </div>
        </div>
        <nav className="space-y-1.5">
          {items.map((it) => {
            const active = pathname === it.path;
            return (
              <button
                key={it.path}
                onClick={() => onNavigate(it.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition
                  ${
                    active
                      ? "bg-[color:var(--color-primary)] border-[hsl(var(--border))] font-medium"
                      : "bg-transparent border-transparent hover:bg-[color:var(--color-primary)]/60 hover:border-[hsl(var(--border))]"
                  }`}
              >
                <it.icon size={18} className="text-[color:var(--color-ink)]/80" />
                <span>{it.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/* ---------- Main Component ---------- */
export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Safe (no-op) store hook; wire into your real store later if desired.
  const store = useUserSafe();

  // Initial state from store or localStorage
  const initial = store?.user ?? readProfile();

  const [displayName, setDisplayName] = useState(initial.displayName || "");
  const [email, setEmail] = useState(initial.email || "");
  const [bio, setBio] = useState(initial.bio || "");
  const [avatar, setAvatar] = useState(initial.avatar || ""); // data URL preview
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (store?.user) {
      setDisplayName(store.user.displayName || "");
      setEmail(store.user.email || "");
      setBio(store.user.bio || "");
      setAvatar(store.user.avatar || "");
    }
  }, [
    store?.user?.displayName,
    store?.user?.email,
    store?.user?.bio,
    store?.user?.avatar,
  ]);

  // Convert File -> DataURL (for preview)
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  const onPickAvatar = async (file) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB guardrail
      if (file.size > maxSize) {
        alert("Image is too large. Please choose an image under 10MB.");
        setUploadingAvatar(false);
        return;
      }

      // 1) Ensure JPEG if user selected HEIC/HEIF (iPhone)
      let safeFile = await ensureJpegFile(file, 0.9);

      // 2) Optional downscale big images (keeps uploads snappy)
      if (safeFile.size > 5 * 1024 * 1024) {
        safeFile = await resizeImageBlob(safeFile, 2000, 2000, 0.88);
      }

      // 3) Preview as Data URL
      const previewUrl = await fileToDataUrl(safeFile);
      setAvatar(previewUrl);

      // TODO: upload `safeFile` to your backend / Amplify Storage if needed
      // await Storage.put(`avatars/${userId}.jpg`, safeFile, { contentType: safeFile.type });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Failed to process image. Please try a different photo.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (!uploadingAvatar) fileInputRef.current?.click();
  };

  const removeAvatar = () => setAvatar("");

  const save = () => {
    const next = {
      ...(store?.user || {}),
      displayName: displayName.trim(),
      email: email.trim(),
      bio,
      avatar,
    };
    if (store?.setUser) store.setUser(next);
    writeProfile(next);
    setLastSaved(Date.now());
  };

  const authorInitial = (displayName || "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen text-[color:var(--color-ink)] bg-[color:var(--color-base)] bg-radial-fade">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Top header with Back button */}
        <div className="glass-panel">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:opacity-90"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="w-10 h-10 rounded-lg grid place-items-center bg-[color:var(--color-primary)]">
                <User size={18} className="text-[color:var(--color-ink)]/80" />
              </div>
              <div>
                <h1 className="heading-serif text-2xl">Profile</h1>
                <div className="text-sm text-muted">
                  {displayName
                    ? `Signed in as ${displayName}`
                    : "Set your author details"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={save} className="btn-gold inline-flex items-center gap-2">
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => navigate("/toc")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <BookOpen size={16} /> Go to TOC
              </button>
              <span className="text-xs text-muted hidden sm:inline">
                Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
              </span>
            </div>
          </div>
        </div>

        {/* Main layout with optional sidebar */}
        <div className="mt-6 flex gap-6">
          {/* Sidebar (shown on lg+) */}
          <ProfileSidebar onNavigate={navigate} />

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Avatar Card */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 heading-serif">Profile Photo</div>

              <div className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[color:var(--color-primary)]/40 aspect-square max-w-sm flex items-center justify-center mb-4 relative">
                {uploadingAvatar ? (
                  <div className="text-center">
                    <Loader2 size={32} className="mx-auto mb-2 animate-spin text-[color:var(--color-ink)]/60" />
                    <div className="text-sm text-muted">Processing image...</div>
                  </div>
                ) : avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <div className="w-24 h-24 rounded-full bg-[color:var(--color-accent)] grid place-items-center shadow">
                      <span className="text-[color:var(--color-ink)] font-black text-3xl">{authorInitial}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUploadClick}
                  disabled={uploadingAvatar}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[color:var(--color-primary)] border border-[hsl(var(--border))] hover:opacity-90 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Image size={16} /> Upload
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickAvatar(file);
                  }}
                />
                {avatar && !uploadingAvatar && (
                  <button
                    onClick={removeAvatar}
                    className="px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:opacity-90 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-muted mt-2 text-center">
                Supports JPG, PNG, or iPhone HEIC photos
              </div>
            </div>

            {/* Author Details */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 heading-serif">Author Details</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted mb-1 block">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Jacqueline Session Ausby"
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-lg font-semibold outline-none"
                    style={{
                      fontFamily:
                        "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Email</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                      size={16}
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg bg-white border border-[hsl(var(--border))] pl-9 pr-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Website (optional)</label>
                  <input
                    placeholder="https://DahTruth.com"
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-muted mb-1 block">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A brief author bio for your profile and manuscripts…"
                    className="w-full min-h-[140px] rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none resize-vertical"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button onClick={save} className="btn-gold inline-flex items-center gap-2">
                  <Save size={16} /> Save Profile
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[hsl(var(--border))] hover:opacity-90 font-semibold"
                >
                  <Home size={16} /> Back to Dashboard
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 heading-serif">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={save} className="btn-primary">Save changes</button>
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:opacity-90 inline-flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
              <div className="text-xs text-muted mt-3">
                Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
              </div>
            </div>

            {/* Preview */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 heading-serif">Preview</div>
              <div className="flex items-center gap-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName || "Profile"}
                    className="w-12 h-12 rounded-full object-cover shadow border-2 border-[hsl(var(--border))]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[color:var(--color-accent)] grid place-items-center shadow">
                    <span className="text-[color:var(--color-ink)] font-black">
                      {authorInitial}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="font-bold text-lg truncate"
                    style={{
                      fontFamily:
                        "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                    }}
                  >
                    {displayName || "Your Name"}
                  </div>
                  <div className="text-sm text-muted truncate">
                    {email || "you@example.com"}
                  </div>
                </div>
              </div>
              {bio?.trim() && (
                <p className="mt-4 text-[color:var(--color-ink)]/80 leading-relaxed">
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
