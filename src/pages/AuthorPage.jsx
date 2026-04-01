// src/pages/AuthorPage.jsx
// Author profile hub — plain JSX (no TypeScript)
// Import from useAuthorProfile.js (no separate authorTypes file)

import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthorProfile } from "../hooks/useAuthorProfile";

// ── Status badge styles ───────────────────────
const STATUS_STYLES = {
  published:     "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50",
  complete:      "bg-blue-900/50    text-blue-300    border border-blue-700/50",
  "in-progress": "bg-amber-900/50   text-amber-300   border border-amber-700/50",
  draft:         "bg-zinc-800/60   text-zinc-400    border border-zinc-700/50",
};

const GENRE_OPTIONS = [
  "Fiction","Urban Fiction","Fantasy","Sci-Fi","Mystery","Thriller",
  "Romance","Historical Fiction","Literary Fiction","Horror",
  "Nonfiction","Memoir","Essay","Poetry","Christian Fiction",
  "Inspirational","Political Commentary","Cultural Criticism",
];

const THEME_OPTIONS = [
  "Faith","Identity","Justice","Race","Family","Power","Redemption",
  "Community","Love","Loss","Resilience","Prophetic","ADOS","Culture",
  "Politics","Spiritual Warfare","Legacy","History",
];

// ── Shared input style ────────────────────────
const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#e8e0d4",
};

const inputCls =
  "w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all focus:ring-1";

// ── Small helpers ─────────────────────────────
function TagPill({ label, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: "rgba(201,168,76,0.12)",
        color: "#c9a84c",
        border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-red-400 transition-colors ml-1 leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2
        className="text-2xl font-semibold tracking-wide"
        style={{ fontFamily: "EB Garamond, serif", color: "#c9a84c" }}
      >
        {title}
      </h2>
      {sub && (
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          {sub}
        </p>
      )}
      <div
        className="mt-2 h-px w-16"
        style={{ background: "rgba(201,168,76,0.4)" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  EDIT PROFILE MODAL
// ─────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const fileRef = useRef(null);

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const socialField = (key) => (e) =>
    setForm((f) => ({
      ...f,
      socialLinks: { ...f.socialLinks, [key]: e.target.value },
    }));

  const addGenre = (g) => {
    if (g && !form.genres.includes(g))
      setForm((f) => ({ ...f, genres: [...f.genres, g] }));
  };

  const addTheme = (t) => {
    if (t && !form.themes.includes(t))
      setForm((f) => ({ ...f, themes: [...f.themes, t] }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setForm((f) => ({ ...f, photoUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-2xl my-8 rounded-2xl shadow-2xl"
        style={{ background: "#0d1535", border: "1px solid rgba(201,168,76,0.25)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "EB Garamond, serif", color: "#c9a84c" }}
          >
            Edit Author Profile
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl"
              style={{
                background: "rgba(201,168,76,0.15)",
                border: "2px solid rgba(201,168,76,0.4)",
              }}
            >
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "✍"
              )}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{
                  background: "rgba(201,168,76,0.15)",
                  color: "#c9a84c",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
              >
                Upload Photo
              </button>
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                JPG, PNG — stored locally
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            {[["fullName", "Full Name *"], ["penName", "Pen Name"]].map(([key, label]) => (
              <div key={key}>
                <label
                  className="block text-xs mb-1.5 font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {label}
                </label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={form[key] || ""}
                  onChange={field(key)}
                />
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Tagline
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Writer. Storyteller. Builder of truth."
              value={form.tagline || ""}
              onChange={field("tagline")}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Bio
            </label>
            <textarea
              className={inputCls}
              style={inputStyle}
              rows={4}
              value={form.bio || ""}
              onChange={field("bio")}
            />
          </div>

          {/* Writing Mission */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Writing Mission
            </label>
            <textarea
              className={inputCls}
              style={inputStyle}
              rows={2}
              value={form.writingMission || ""}
              onChange={field("writingMission")}
            />
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Personal Quote or Scripture
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={form.personalQuote || ""}
              onChange={field("personalQuote")}
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Genres
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.genres.map((g) => (
                <TagPill
                  key={g}
                  label={g}
                  onRemove={() =>
                    setForm((f) => ({ ...f, genres: f.genres.filter((x) => x !== g) }))
                  }
                />
              ))}
            </div>
            <select
              className={inputCls}
              style={inputStyle}
              value=""
              onChange={(e) => addGenre(e.target.value)}
            >
              <option value="">+ Add genre</option>
              {GENRE_OPTIONS.filter((g) => !form.genres.includes(g)).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Themes */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Themes
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.themes.map((t) => (
                <TagPill
                  key={t}
                  label={t}
                  onRemove={() =>
                    setForm((f) => ({ ...f, themes: f.themes.filter((x) => x !== t) }))
                  }
                />
              ))}
            </div>
            <select
              className={inputCls}
              style={inputStyle}
              value=""
              onChange={(e) => addTheme(e.target.value)}
            >
              <option value="">+ Add theme</option>
              {THEME_OPTIONS.filter((t) => !form.themes.includes(t)).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-xs mb-3 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Social &amp; Contact Links
            </label>
            <div className="space-y-3">
              {[
                ["website",    "🌐 Website"],
                ["twitter",    "🐦 X / Twitter"],
                ["instagram",  "📷 Instagram"],
                ["facebook",   "📘 Facebook"],
                ["goodreads",  "📚 Goodreads"],
                ["amazon",     "🛒 Amazon Author Page"],
                ["newsletter", "✉️ Newsletter / Substack"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-44 flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </span>
                  <input
                    className={`${inputCls} flex-1`}
                    style={inputStyle}
                    placeholder="https://"
                    value={form.socialLinks?.[key] || ""}
                    onChange={socialField(key)}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-xs w-44 flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                  📧 Contact Email
                </span>
                <input
                  className={`${inputCls} flex-1`}
                  style={inputStyle}
                  value={form.contactEmail || ""}
                  onChange={field("contactEmail")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-8 py-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  BOOK CARD
// ─────────────────────────────────────────────
function BookCard({ book, onEdit }) {
  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      onClick={() => onEdit(book)}
    >
      <div
        className="h-40 flex items-center justify-center text-4xl"
        style={{ background: book.coverUrl ? undefined : "rgba(201,168,76,0.08)" }}
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : "📖"}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-semibold text-sm leading-tight line-clamp-2"
            style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4" }}
          >
            {book.title || "Untitled"}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[book.status]}`}>
            {book.status}
          </span>
        </div>
        {book.genre && (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{book.genre}</p>
        )}
        {book.isFeatured && (
          <span
            className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
          >
            ★ Featured
          </span>
        )}
      </div>
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ background: "rgba(201,168,76,0.08)" }}
      >
        <span className="text-xs font-medium" style={{ color: "#c9a84c" }}>Edit Book</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  BOOK EDIT MODAL
// ─────────────────────────────────────────────
function BookEditModal({ book, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...book });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverRef = useRef(null);

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setForm((f) => ({ ...f, coverUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const GENRE_LIST = [
    "Fiction","Urban Fiction","Fantasy","Sci-Fi","Mystery","Thriller",
    "Romance","Historical Fiction","Literary Fiction","Horror",
    "Nonfiction","Memoir","Essay","Poetry","Christian Fiction",
    "Inspirational","Political Commentary",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-2xl my-8 rounded-2xl shadow-2xl"
        style={{ background: "#0d1535", border: "1px solid rgba(201,168,76,0.25)" }}
      >
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "EB Garamond, serif", color: "#c9a84c" }}
          >
            {book.title ? `Edit: ${book.title}` : "New Book"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Cover upload */}
          <div className="flex items-start gap-5">
            <div
              className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl"
              style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
            >
              {form.coverUrl ? (
                <img src={form.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : "📖"}
            </div>
            <div className="flex-1">
              <button
                onClick={() => coverRef.current?.click()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}
              >
                Upload Cover
              </button>
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                JPG, PNG — stored locally
              </p>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCover}
              />
              <button
                onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
                className="mt-3 flex items-center gap-2 text-xs transition-all hover:opacity-80"
                style={{ color: form.isFeatured ? "#c9a84c" : "rgba(255,255,255,0.4)" }}
              >
                <span className="text-base">{form.isFeatured ? "★" : "☆"}</span>
                {form.isFeatured ? "Featured on profile" : "Mark as featured"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Title *</label>
              <input className={inputCls} style={inputStyle} value={form.title} onChange={field("title")} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Subtitle</label>
              <input className={inputCls} style={inputStyle} value={form.subtitle || ""} onChange={field("subtitle")} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Genre</label>
              <select className={inputCls} style={inputStyle} value={form.genre} onChange={field("genre")}>
                <option value="">Select genre</option>
                {GENRE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status} onChange={field("status")}>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Publish Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.publishDate || ""} onChange={field("publishDate")} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Blurb / Description</label>
            <textarea className={inputCls} style={inputStyle} rows={4} value={form.blurb} onChange={field("blurb")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Excerpt (optional)</label>
            <textarea className={inputCls} style={inputStyle} rows={3} value={form.excerpt || ""} onChange={field("excerpt")} />
          </div>

          {/* Buy links */}
          <div>
            <label className="block text-xs mb-3 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Buy / Find Links</label>
            <div className="space-y-2.5">
              {[
                ["amazon",        "🛒 Amazon"],
                ["barnesAndNoble","📘 Barnes & Noble"],
                ["kobo",          "📱 Kobo"],
                ["gumroad",       "💚 Gumroad"],
                ["directStore",   "🏬 Direct Store"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-36 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {label}
                  </span>
                  <input
                    className={`${inputCls} flex-1`}
                    style={inputStyle}
                    placeholder="https://"
                    value={form.buyLinks?.[key] || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, buyLinks: { ...f.buyLinks, [key]: e.target.value } }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            {book.title && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Delete this book?</span>
                  <button
                    onClick={() => onDelete(book.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-900/60 transition-all"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
                >
                  Delete Book
                </button>
              )
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}
            >
              Save Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN — AuthorPage
// ─────────────────────────────────────────────
export default function AuthorPage() {
  const {
    profile,
    books,
    activeProjects,
    publishedBooks,
    saveProfile,
    saveBook,
    deleteBook,
    createBook,
    toggleFeatured,
  } = useAuthorProfile();

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBook, setEditingBook]       = useState(null);
  const [activeTab, setActiveTab]           = useState("overview");

  const isNew = !profile.fullName;

  const blogPosts = [
    { id: "1", title: "The Old Story, Returning", excerpt: "A reflection on the Protestant Reformation and what it means for the Church today.", category: "Faith", date: "March 2025", url: "https://dahtruth.com" },
    { id: "2", title: "You Do Not Speak For Us", excerpt: "On ADOS identity and the voices that claim to represent a people they never were.", category: "Identity", date: "March 2025", url: "https://dahtruth.com" },
    { id: "3", title: "Rising Like Dracula, Afraid of the Cross", excerpt: "The Catholic resurgence, the Israel-Iran conflict, and the prophetic mirror of our moment.", category: "Politics", date: "March 2025", url: "https://dahtruth.com" },
  ];

  const TABS = [
    { key: "overview",  label: "Overview" },
    { key: "projects",  label: `Active Projects (${activeProjects.length})` },
    { key: "catalog",   label: `Published Works (${publishedBooks.length})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #07102a 0%, #0d1535 60%, #12103a 100%)" }}>

      {editingProfile && (
        <EditProfileModal
          profile={profile}
          onSave={saveProfile}
          onClose={() => setEditingProfile(false)}
        />
      )}

      {editingBook && (
        <BookEditModal
          book={editingBook}
          onSave={(b) => { saveBook(b); setEditingBook(null); }}
          onDelete={(id) => { deleteBook(id); setEditingBook(null); }}
          onClose={() => setEditingBook(null)}
        />
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-5xl"
                style={{ background: "rgba(201,168,76,0.12)", border: "3px solid rgba(201,168,76,0.4)", boxShadow: "0 0 40px rgba(201,168,76,0.15)" }}
              >
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : <span>✍</span>}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {isNew ? (
                <div>
                  <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "EB Garamond, serif", color: "#c9a84c" }}>
                    Build Your Author Profile
                  </h1>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Your author page is the center of your creative identity inside Story Lab.
                  </p>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}
                  >
                    Create Profile
                  </button>
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-semibold leading-tight" style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4" }}>
                    {profile.fullName}
                  </h1>
                  {profile.penName && (
                    <p className="text-sm mt-0.5" style={{ color: "#c9a84c" }}>Writing as {profile.penName}</p>
                  )}
                  {profile.tagline && (
                    <p className="mt-2 text-lg italic" style={{ fontFamily: "EB Garamond, serif", color: "rgba(255,255,255,0.55)" }}>
                      {profile.tagline}
                    </p>
                  )}
                  {profile.personalQuote && (
                    <blockquote className="mt-3 pl-4 italic text-sm" style={{ borderLeft: "2px solid rgba(201,168,76,0.4)", color: "rgba(255,255,255,0.45)" }}>
                      "{profile.personalQuote}"
                    </blockquote>
                  )}
                  {(profile.genres.length > 0 || profile.themes.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {profile.genres.map((g) => <TagPill key={g} label={g} />)}
                      {profile.themes.slice(0, 4).map((t) => (
                        <span key={t} className="inline-flex items-center px-3 py-1 rounded-full text-xs"
                          style={{ background: "rgba(107,79,160,0.15)", color: "#b094d4", border: "1px solid rgba(107,79,160,0.3)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                    <div className="flex flex-wrap gap-3 mt-5">
                      {Object.entries(profile.socialLinks).map(([key, url]) =>
                        url ? (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80 capitalize"
                            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {key}
                          </a>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isNew && (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-12">

        {/* Tabs */}
        {!isNew && (
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={activeTab === tab.key
                  ? { background: "rgba(201,168,76,0.2)", color: "#c9a84c" }
                  : { color: "rgba(255,255,255,0.45)" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Overview */}
        {(activeTab === "overview" || isNew) && (
          <div className="space-y-12">
            {(profile.bio || profile.writingMission) && (
              <section>
                <SectionHeader title="About the Author" />
                <div className="grid md:grid-cols-2 gap-8">
                  {profile.bio && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Biography</h3>
                      <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "EB Garamond, serif", fontSize: "1rem" }}>
                        {profile.bio}
                      </p>
                    </div>
                  )}
                  {profile.writingMission && (
                    <div className="rounded-xl p-6" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(201,168,76,0.7)" }}>Writing Mission</h3>
                      <p className="leading-relaxed italic" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "EB Garamond, serif", fontSize: "1.05rem" }}>
                        {profile.writingMission}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Books */}
            {books.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader title="Current Projects &amp; Works" />
                  <button
                    onClick={() => setEditingBook(createBook())}
                    className="text-xs px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
                  >
                    + Add Book
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {books.slice(0, 8).map((book) => (
                    <BookCard key={book.id} book={book} onEdit={setEditingBook} />
                  ))}
                </div>
              </section>
            ) : (
              !isNew && (
                <section>
                  <SectionHeader title="Your Books" />
                  <div className="rounded-xl p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                    <p className="text-4xl mb-3">📖</p>
                    <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Add your books, manuscripts, and poetry collections here.
                    </p>
                    <button
                      onClick={() => setEditingBook(createBook())}
                      className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}
                    >
                      Add Your First Book
                    </button>
                  </div>
                </section>
              )
            )}

            {/* Blog feed */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Latest from the Author" sub="Recent essays and reflections" />
                <a href="https://dahtruth.com" target="_blank" rel="noopener noreferrer"
                  className="text-xs transition-all hover:opacity-80" style={{ color: "#c9a84c" }}>
                  View full archive →
                </a>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {blogPosts.map((post) => (
                  <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer"
                    className="group block rounded-xl p-5 transition-all hover:border-amber-700/50"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-xs px-2 py-0.5 rounded-full mb-3 inline-block"
                      style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}>
                      {post.category}
                    </span>
                    <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-amber-300 transition-colors"
                      style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4", fontSize: "1rem" }}>
                      {post.title}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {post.excerpt}
                    </p>
                    <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>{post.date}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Projects tab */}
        {activeTab === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Active Projects" sub="Manuscripts in progress" />
              <button
                onClick={() => setEditingBook(createBook())}
                className="text-xs px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
              >
                + Add Book
              </button>
            </div>
            {activeProjects.length === 0 ? (
              <div className="rounded-xl p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No active projects yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {activeProjects.map((book) => (
                  <BookCard key={book.id} book={book} onEdit={setEditingBook} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalog tab */}
        {activeTab === "catalog" && (
          <div>
            <SectionHeader title="Published Works" sub="Your completed catalog" />
            {publishedBooks.length === 0 ? (
              <div className="rounded-xl p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No published works yet — keep writing!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {publishedBooks.map((book) => (
                  <BookCard key={book.id} book={book} onEdit={setEditingBook} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
