// src/components/Profile.jsx
import React, { useEffect, useState } from "react";
import { loadUser, saveUser } from "../lib/userStore";

/** Simple toast notification - replaces API toasts temporarily */
function toast({ title, description } = {}) {
  if (title || description) {
    console.log(`[toast] ${title || ""}${description ? " — " + description : ""}`);
    const toastEl = document.createElement("div");
    toastEl.className =
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm bg-green-600";
    toastEl.innerHTML = `
      <div class="font-semibold">${title || ""}</div>
      <div class="text-sm opacity-90">${description || ""}</div>
    `;
    document.body.appendChild(toastEl);
    setTimeout(() => document.body.removeChild(toastEl), 3000);
  }
}

// Fallback user (used only if nothing saved yet)
const mockUser = {
  name: "Jacqueline Session",
  email: "jacqueline@dahtruth.com",
  bio:
    "Founder of DahTruth.com and creator of DahTruth StoryLab. Passionate about empowering writers to discover and share their authentic stories through faith-based community and modern technology.",
  avatar: null,
};

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

  // Load user: prefer saved data, fall back to mock
  useEffect(() => {
    let isMounted = true;

    setTimeout(() => {
      if (!isMounted) return;
      try {
        const stored = loadUser();
        const base = stored || mockUser;
        setUser(base);
        setName(base.name || "");
        setEmail(base.email || "");
        setBio(base.bio || "");
      } catch (e) {
        console.error(e);
        toast({
          title: "Unable to load profile",
          description: "Please try refreshing the page.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle avatar change (validation + preview)
  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Choose an image smaller than 5MB." });
      return;
    }
    const isHeic = /\.(heic|heif)$/i.test(file.name);
    if (isHeic) {
      toast({
        title: "HEIC files not supported yet",
        description: "Please convert to JPEG or PNG first.",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please pick an image file." });
      return;
    }

    try {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("Image processing error:", err);
      toast({ title: "Image processing failed", description: "Try a different photo." });
    }
  };

  // Save profile
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      let avatarUrl = user.avatar;
      if (avatarFile) {
        avatarUrl = avatarPreview || URL.createObjectURL(avatarFile);
      }

      const updatedUser = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        bio,
        avatar: avatarUrl,
      };

      setUser(updatedUser);
      saveUser(updatedUser); // persist

      if (avatarPreview && avatarFile) {
        setAvatarFile(null);
      }

      try {
        window.dispatchEvent(new CustomEvent("app:user-updated", { detail: updatedUser }));
      } catch {}

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
              // Display mode
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 ring-4 ring-white/20 shadow-xl bg-white/60">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-ink/70 font-semibold">
                          {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
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
              // Edit mode
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
                          {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
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
                    Max 5MB. JPG/PNG/WebP recommended. HEIC support coming with backend APIs.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-ink/90 text-sm">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-soft border-white/40 text-ink placeholder:text-ink/50 px-3 py-2 rounded-lg focus:outline-none focus:border-white/60"
                    placeholder="Your full name"
                    required
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
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-ink/90 text-sm">Author Bio</label>
                  <textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full glass-soft border-white/40 text-ink placeholder:text-ink/50 px-3 py-2 rounded-lg resize-none focus:outline-none focus;border-white/60"
                    placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                    maxLength={500}
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
                    className="glass-soft hover:bg-white/60 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary shadow-xl px-4 py-2 rounded-lg disabled:opacity-50"
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
