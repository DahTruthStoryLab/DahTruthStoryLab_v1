// src/components/Profile.jsx
import React, { useEffect, useState } from "react";

/** Read frontend env vars (defined in .env.development / Amplify env) */
const API_BASE = process.env.REACT_APP_API_BASE || "";                // e.g. https://xxx.lambda-url.us-east-1.on.aws
const PUBLIC_BUCKET = process.env.REACT_APP_PUBLIC_BUCKET_URL || "";  // e.g. https://your-public-bucket.s3.amazonaws.com

/** Minimal helper: tiny toasts via alert+console (no external deps) */
function toast({ title, description } = {}) {
  if (title || description) {
    console.log(`[toast] ${title || ""}${description ? " — " + description : ""}`);
    // alert(`${title || ""}\n${description || ""}`); // enable if you want dialogs
  }
}

/** Helper: upload to S3 with a presigned POST */
async function uploadViaPresignedPost({ presignEndpoint, userId, file }) {
  // 1) ask Lambda for presigned form data
  const presignRes = await fetch(`${presignEndpoint}/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId || "dev-user-1",
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!presignRes.ok) {
    const errText = await presignRes.text();
    throw new Error(`Presign failed: ${presignRes.status} ${errText}`);
  }
  const { url, fields, key } = await presignRes.json();
  if (!url || !fields || !key) throw new Error("Malformed presign response");

  // 2) POST the file to S3 with the returned form
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  formData.append("file", file);

  const s3Res = await fetch(url, { method: "POST", body: formData });
  if (!s3Res.ok) {
    const errText = await s3Res.text();
    throw new Error(`S3 upload failed: ${s3Res.status} ${errText}`);
  }

  // 3) Return the public URL if provided, else construct from PUBLIC_BUCKET
  // If your raw bucket isn't public, you might copy/process to a public bucket later.
  if (PUBLIC_BUCKET) {
    return `${PUBLIC_BUCKET}/${key}`;
  }
  // Fallback: return key only; caller can decide how to display/resolve it.
  return key;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Load current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/user/current");
        if (!res.ok) throw new Error(`GET /api/user/current ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        setUser(data);
        setName(data?.name || "");
        setEmail(data?.email || "");
        setBio(data?.bio || "");
      } catch (e) {
        console.error(e);
        toast({ title: "Unable to load profile", description: "Please try refreshing the page." });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => (isMounted = false);
  }, []);

  // Handle avatar change (basic validation + preview)
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Choose an image smaller than 5MB." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please pick an image file." });
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Save profile
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let avatarUrl = user.avatar;

      if (avatarFile) {
        if (API_BASE) {
          // Preferred path: presign + upload to S3 via Lambda Function URL
          avatarUrl = await uploadViaPresignedPost({
            presignEndpoint: API_BASE,
            userId: user?.id || "dev-user-1",
            file: avatarFile,
          });
        } else {
          // Fallback path: existing backend endpoint
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          const up = await fetch("/api/user/avatar", { method: "POST", body: formData });
          if (!up.ok) {
            const errText = await up.text();
            throw new Error(`Avatar upload failed: ${up.status} ${errText}`);
          }
          const resJson = await up.json();
          avatarUrl = resJson.avatarUrl || avatarUrl;
        }
      }

      // Update profile
      const patchRes = await fetch("/api/user/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          bio: bio,
          avatar: avatarUrl || undefined,
        }),
      });
      if (!patchRes.ok) {
        const errText = await patchRes.text();
        throw new Error(`Update failed: ${patchRes.status} ${errText}`);
      }
      const updated = await patchRes.json();

      // Update local state
      setUser((prev) => ({ ...prev, ...updated }));
      if (avatarUrl) {
        const busted = `${avatarUrl}?t=${Date.now()}`; // cache-bust
        setUser((prev) => ({ ...prev, avatar: busted }));
        setAvatarPreview(null);
        setAvatarFile(null);
      }

      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error updating profile",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
    }
    setIsEditing(false);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  /* ----------------- UI ----------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-black/5 rounded-lg w-1/4"></div>
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-black/5 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-black/5 rounded w-32"></div>
                  <div className="h-4 bg-black/5 rounded w-48"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <p className="text-muted">Unable to load profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base bg-radial-fade">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink font-serif">Author Profile</h2>
              <p className="text-muted">Manage your writing identity and personal information</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary font-semibold shadow-lg px-4 py-2 rounded-lg"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl">
          <div className="glass-soft rounded-t-2xl p-6 border-0">
            <div className="text-xl text-ink font-semibold">Personal Information</div>
            <div className="text-muted">Manage your author profile and personal information</div>
          </div>

          <div className="p-6 space-y-6">
            {!isEditing ? (
              /* -------- Display Mode -------- */
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 ring-4 ring-white/20 shadow-xl bg-white/60">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-ink/70 font-semibold">
                          {user.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30 pointer-events-none"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-ink font-serif">{user.name}</h3>
                    <p className="text-muted text-lg">{user.email}</p>
                  </div>
                </div>

                {user.bio ? (
                  <div className="glass-soft p-4">
                    <h4 className="text-sm font-medium text-ink/80 mb-2">Bio</h4>
                    <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                  </div>
                ) : (
                  <div className="glass-soft p-4 border-dashed">
                    <div className="text-muted italic text-center">
                      No bio added yet. Click "Edit Profile" to add your author biography.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* -------- Edit Mode -------- */
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 ring-4 ring-white/20 shadow-xl bg-white/60">
                      {avatarPreview || user.avatar ? (
                        <img
                          src={avatarPreview || user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-ink/70 font-semibold">
                          {user.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-2 -right-2 bg-primary hover:opacity-90 text-ink rounded-full px-3 py-2 cursor-pointer shadow-xl border border-white/40 text-sm"
                      title="Change avatar"
                    >
                      Change
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={onAvatarChange}
                      className="hidden"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30 pointer-events-none"></div>
                  </div>

                  <div className="text-xs text-muted">
                    Max 5MB. JPG/PNG/WebP recommended.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-ink/90 text-sm">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-soft border-white/40 text-ink placeholder:text-ink/50 px-3 py-2 rounded-lg focus:outline-none focus:border-white/60"
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-ink/90 text-sm">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-soft border-white/40 text-ink placeholder:text-ink/50 px-3 py-2 rounded-lg focus:outline-none focus:border-white/60"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-ink/90 text-sm">Author Bio</label>
                  <textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full glass-soft border-white/40 text-ink placeholder:text-ink/50 px-3 py-2 rounded-lg resize-none focus:outline-none focus:border-white/60"
                    placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                  />
                  <div className="text-xs text-muted text-right glass-soft px-2 py-1 rounded-lg">
                    {(bio || "").length}/500 characters
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="glass-soft hover:bg-white/60 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary shadow-xl px-4 py-2 rounded-lg"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
