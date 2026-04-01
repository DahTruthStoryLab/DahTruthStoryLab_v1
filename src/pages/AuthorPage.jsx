// src/pages/AuthorPage.jsx
// Author profile hub — light theme matching Dashboard aesthetic
// Feather + BookOpen placeholder icons (Lucide, already in app)

import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Feather, BookOpen, Settings, Plus, ChevronRight } from "lucide-react";
import { useAuthorProfile } from "../hooks/useAuthorProfile";

// ── Brand tokens (match Dashboard exactly) ────
const BRAND = {
  navy:      "#1e3a5f",
  navyLight: "#2d4a6f",
  gold:      "#d4af37",
  goldDark:  "#b8960c",
  mauve:     "#e8b4b8",
  mauveDeep: "#c9868a",
  sky:       "#7eb8d4",
  violet:    "#7C3AED",
  ink:       "#0F172A",
};

// ── Status badge styles (light-mode) ──────────
const STATUS_STYLES = {
  published:     { bg: "rgba(16,185,129,0.12)",  color: "#065f46", border: "1px solid rgba(16,185,129,0.3)" },
  complete:      { bg: "rgba(59,130,246,0.10)",  color: "#1e40af", border: "1px solid rgba(59,130,246,0.25)" },
  "in-progress": { bg: "rgba(212,175,55,0.14)",  color: "#b8960c", border: "1px solid rgba(212,175,55,0.3)" },
  draft:         { bg: "rgba(100,116,139,0.10)", color: "#475569", border: "1px solid rgba(100,116,139,0.2)" },
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

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-slate-200 bg-white/80 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 text-slate-800 placeholder-slate-400";

// ── Helpers ───────────────────────────────────
function TagPill({ label, onRemove, color }) {
  const colors = {
    gold:  { bg: "rgba(212,175,55,0.12)",  color: "#b8960c",   border: "1px solid rgba(212,175,55,0.3)" },
    mauve: { bg: "rgba(232,180,184,0.15)", color: "#c9868a",   border: "1px solid rgba(201,134,138,0.3)" },
    sky:   { bg: "rgba(126,184,212,0.15)", color: "#2a6f8a",   border: "1px solid rgba(126,184,212,0.3)" },
  };
  const s = colors[color] || colors.gold;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: s.border }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-400 transition-colors ml-1 leading-none">×</button>
      )}
    </span>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-wide"
        style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy }}>
        {title}
      </h2>
      {sub && <p className="text-sm mt-1 text-slate-500">{sub}</p>}
      <div className="mt-2 h-0.5 w-16 rounded-full"
        style={{ background: "linear-gradient(90deg, #d4af37, #e8b4b8)" }} />
    </div>
  );
}

function AuthorAvatarPlaceholder({ size }) {
  const iconSize = Math.round(size * 0.26);
  return (
    <div className="rounded-full flex flex-col items-center justify-center gap-1"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg, rgba(30,58,95,0.08) 0%, rgba(212,175,55,0.12) 50%, rgba(232,180,184,0.15) 100%)",
        border: "2px solid rgba(212,175,55,0.35)",
        boxShadow: "0 4px 20px rgba(30,58,95,0.1)",
      }}>
      <Feather size={iconSize} style={{ color: "#b8960c", transform: "rotate(-20deg)" }} />
      <BookOpen size={iconSize} style={{ color: "#1e3a5f", opacity: 0.65 }} />
    </div>
  );
}

function GlassCard({ children, className, style, onClick }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 shadow-sm ${className || ""}`}
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", ...style }}
      onClick={onClick}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  EDIT PROFILE MODAL
// ─────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const fileRef = useRef(null);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const socialField = (key) => (e) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }));
  const addGenre = (g) => { if (g && !form.genres.includes(g)) setForm((f) => ({ ...f, genres: [...f.genres, g] })); };
  const addTheme = (t) => { if (t && !form.themes.includes(t)) setForm((f) => ({ ...f, themes: [...f.themes, t] })); };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photoUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl my-8 rounded-2xl shadow-xl bg-white border border-slate-200">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy }}>
            Edit Author Profile
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.3)" }}>
              {form.photoUrl
                ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                : <Feather size={28} style={{ color: "#b8960c" }} />}
            </div>
            <div>
              <button onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(212,175,55,0.12)", color: "#b8960c", border: "1px solid rgba(212,175,55,0.3)" }}>
                Upload Photo
              </button>
              <p className="text-xs mt-1.5 text-slate-400">JPG, PNG — stored locally</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[["fullName","Full Name *"],["penName","Pen Name"]].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs mb-1.5 font-medium text-slate-500">{label}</label>
                <input className={inputCls} value={form[key] || ""} onChange={field(key)} />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Tagline</label>
            <input className={inputCls} placeholder="e.g. Writer. Storyteller. Builder of truth."
              value={form.tagline || ""} onChange={field("tagline")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Bio</label>
            <textarea className={inputCls} rows={4} value={form.bio || ""} onChange={field("bio")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Writing Mission</label>
            <textarea className={inputCls} rows={2} value={form.writingMission || ""} onChange={field("writingMission")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Personal Quote or Scripture</label>
            <input className={inputCls} value={form.personalQuote || ""} onChange={field("personalQuote")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Genres</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.genres.map((g) => (
                <TagPill key={g} label={g} color="gold"
                  onRemove={() => setForm((f) => ({ ...f, genres: f.genres.filter((x) => x !== g) }))} />
              ))}
            </div>
            <select className={inputCls} value="" onChange={(e) => addGenre(e.target.value)}>
              <option value="">+ Add genre</option>
              {GENRE_OPTIONS.filter((g) => !form.genres.includes(g)).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Themes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.themes.map((t) => (
                <TagPill key={t} label={t} color="mauve"
                  onRemove={() => setForm((f) => ({ ...f, themes: f.themes.filter((x) => x !== t) }))} />
              ))}
            </div>
            <select className={inputCls} value="" onChange={(e) => addTheme(e.target.value)}>
              <option value="">+ Add theme</option>
              {THEME_OPTIONS.filter((t) => !form.themes.includes(t)).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-3 font-medium text-slate-500">Social &amp; Contact Links</label>
            <div className="space-y-3">
              {[
                ["website","🌐 Website"],["twitter","🐦 X / Twitter"],["instagram","📷 Instagram"],
                ["facebook","📘 Facebook"],["goodreads","📚 Goodreads"],
                ["amazon","🛒 Amazon Author Page"],["newsletter","✉️ Newsletter"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-44 flex-shrink-0 text-slate-400">{label}</span>
                  <input className={`${inputCls} flex-1`} placeholder="https://"
                    value={form.socialLinks?.[key] || ""} onChange={socialField(key)} />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-xs w-44 flex-shrink-0 text-slate-400">📧 Contact Email</span>
                <input className={`${inputCls} flex-1`} value={form.contactEmail || ""} onChange={field("contactEmail")} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#fff" }}>
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
  const s = STATUS_STYLES[book.status] || STATUS_STYLES.draft;
  return (
    <GlassCard className="group relative cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
      onClick={() => onEdit(book)}>
      <div className="h-40 flex items-center justify-center"
        style={{ background: book.coverUrl ? undefined : "linear-gradient(135deg, rgba(30,58,95,0.06), rgba(212,175,55,0.08))" }}>
        {book.coverUrl
          ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-1">
              <BookOpen size={28} style={{ color: "rgba(30,58,95,0.3)" }} />
              <Feather size={16} style={{ color: "#b8960c", opacity: 0.6 }} />
            </div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy }}>
            {book.title || "Untitled"}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
            style={{ background: s.bg, color: s.color, border: s.border }}>
            {book.status}
          </span>
        </div>
        {book.genre && <p className="text-xs text-slate-500">{book.genre}</p>}
        {book.isFeatured && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(212,175,55,0.14)", color: "#b8960c" }}>★ Featured</span>
        )}
      </div>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ background: "rgba(30,58,95,0.04)" }}>
        <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white shadow-sm border border-slate-200"
          style={{ color: BRAND.navy }}>Edit Book</span>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────
//  BOOK EDIT MODAL
// ─────────────────────────────────────────────
function BookEditModal({ book, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...book });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverRef = useRef(null);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, coverUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const GENRE_LIST = [
    "Fiction","Urban Fiction","Fantasy","Sci-Fi","Mystery","Thriller","Romance",
    "Historical Fiction","Literary Fiction","Horror","Nonfiction","Memoir","Essay",
    "Poetry","Christian Fiction","Inspirational","Political Commentary",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl my-8 rounded-2xl shadow-xl bg-white border border-slate-200">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy }}>
            {book.title ? `Edit: ${book.title}` : "New Book"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="flex items-start gap-5">
            <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(30,58,95,0.06), rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.25)" }}>
              {form.coverUrl
                ? <img src={form.coverUrl} alt="" className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-1">
                    <BookOpen size={22} style={{ color: "rgba(30,58,95,0.3)" }} />
                    <Feather size={14} style={{ color: "#b8960c", opacity: 0.7 }} />
                  </div>}
            </div>
            <div className="flex-1">
              <button onClick={() => coverRef.current?.click()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(212,175,55,0.12)", color: "#b8960c", border: "1px solid rgba(212,175,55,0.3)" }}>
                Upload Cover
              </button>
              <p className="text-xs mt-1.5 text-slate-400">JPG, PNG — stored locally</p>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
              <button onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
                className="mt-3 flex items-center gap-2 text-xs transition-all hover:opacity-80"
                style={{ color: form.isFeatured ? "#b8960c" : "#94a3b8" }}>
                <span className="text-base">{form.isFeatured ? "★" : "☆"}</span>
                {form.isFeatured ? "Featured on profile" : "Mark as featured"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Title *</label>
              <input className={inputCls} value={form.title} onChange={field("title")} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Subtitle</label>
              <input className={inputCls} value={form.subtitle || ""} onChange={field("subtitle")} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Genre</label>
              <select className={inputCls} value={form.genre} onChange={field("genre")}>
                <option value="">Select genre</option>
                {GENRE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Status</label>
              <select className={inputCls} value={form.status} onChange={field("status")}>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Publish Date</label>
              <input type="date" className={inputCls} value={form.publishDate || ""} onChange={field("publishDate")} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Blurb / Description</label>
            <textarea className={inputCls} rows={4} value={form.blurb} onChange={field("blurb")} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Excerpt (optional)</label>
            <textarea className={inputCls} rows={3} value={form.excerpt || ""} onChange={field("excerpt")} />
          </div>

          <div>
            <label className="block text-xs mb-3 font-medium text-slate-500">Buy / Find Links</label>
            <div className="space-y-2.5">
              {[
                ["amazon","🛒 Amazon"],["barnesAndNoble","📘 Barnes & Noble"],
                ["kobo","📱 Kobo"],["gumroad","💚 Gumroad"],["directStore","🏬 Direct Store"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-36 flex-shrink-0 text-slate-400">{label}</span>
                  <input className={`${inputCls} flex-1`} placeholder="https://"
                    value={form.buyLinks?.[key] || ""}
                    onChange={(e) => setForm((f) => ({ ...f, buyLinks: { ...f.buyLinks, [key]: e.target.value } }))} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100">
          <div>
            {book.title && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Delete this book?</span>
                  <button onClick={() => onDelete(book.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
                    Confirm Delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all">
                  Delete Book
                </button>
              )
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#fff" }}>
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
    profile, books, activeProjects, publishedBooks,
    saveProfile, saveBook, deleteBook, createBook,
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
    { key: "overview", label: "Overview" },
    { key: "projects", label: `Active Projects (${activeProjects.length})` },
    { key: "catalog",  label: `Published Works (${publishedBooks.length})` },
  ];

  return (
    <div className="min-h-screen text-slate-900"
      style={{ background: "radial-gradient(circle at top left, #F9FAFB 0, #F3F4F6 40%, #EDE9FE 100%)" }}>

      {editingProfile && (
        <EditProfileModal profile={profile} onSave={saveProfile} onClose={() => setEditingProfile(false)} />
      )}
      {editingBook && (
        <BookEditModal
          book={editingBook}
          onSave={(b) => { saveBook(b); setEditingBook(null); }}
          onDelete={(id) => { deleteBook(id); setEditingBook(null); }}
          onClose={() => setEditingBook(null)}
        />
      )}

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #1e3a5f 0%, #2d4a6f 55%, #3d5a7a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #d4af37 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #e8b4b8 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="rounded-full overflow-hidden"
                style={{ width: 120, height: 120, border: "3px solid rgba(212,175,55,0.5)", boxShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
                {profile.photoUrl
                  ? <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  : <AuthorAvatarPlaceholder size={120} />}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {isNew ? (
                <div>
                  <h1 className="text-3xl font-semibold mb-2 text-white"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                    Build Your Author Profile
                  </h1>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Your author page is the center of your creative identity inside Story Lab.
                  </p>
                  <button onClick={() => setEditingProfile(true)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#fff" }}>
                    Create Profile
                  </button>
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-semibold leading-tight text-white"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                    {profile.fullName}
                  </h1>
                  {profile.penName && (
                    <p className="text-sm mt-0.5" style={{ color: "#d4af37" }}>Writing as {profile.penName}</p>
                  )}
                  {profile.tagline && (
                    <p className="mt-2 text-lg italic" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "rgba(255,255,255,0.7)" }}>
                      {profile.tagline}
                    </p>
                  )}
                  {profile.personalQuote && (
                    <blockquote className="mt-3 pl-4 italic text-sm"
                      style={{ borderLeft: "2px solid rgba(212,175,55,0.5)", color: "rgba(255,255,255,0.55)" }}>
                      "{profile.personalQuote}"
                    </blockquote>
                  )}
                  {(profile.genres.length > 0 || profile.themes.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {profile.genres.map((g) => (
                        <span key={g} className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ background: "rgba(212,175,55,0.2)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.35)" }}>
                          {g}
                        </span>
                      ))}
                      {profile.themes.slice(0, 4).map((t) => (
                        <span key={t} className="text-xs px-3 py-1 rounded-full"
                          style={{ background: "rgba(232,180,184,0.2)", color: "#e8b4b8", border: "1px solid rgba(232,180,184,0.3)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {Object.entries(profile.socialLinks).map(([key, url]) =>
                        url ? (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg capitalize transition-all hover:opacity-80"
                            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.15)" }}>
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
              <button onClick={() => setEditingProfile(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Settings size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* Tabs */}
        {!isNew && (
          <div className="flex gap-1 p-1 rounded-xl w-fit bg-white/70 border border-slate-200/60 shadow-sm">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={activeTab === tab.key ? { background: BRAND.navy, color: "#fff" } : { color: "#64748b" }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Overview */}
        {(activeTab === "overview" || isNew) && (
          <div className="space-y-10">
            {(profile.bio || profile.writingMission) && (
              <section>
                <SectionHeader title="About the Author" />
                <div className="grid md:grid-cols-2 gap-6">
                  {profile.bio && (
                    <GlassCard className="p-6">
                      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 text-slate-400">Biography</h3>
                      <p className="leading-relaxed text-slate-700"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1rem" }}>
                        {profile.bio}
                      </p>
                    </GlassCard>
                  )}
                  {profile.writingMission && (
                    <GlassCard className="p-6" style={{ borderLeft: "3px solid #d4af37" }}>
                      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#b8960c" }}>
                        Writing Mission
                      </h3>
                      <p className="leading-relaxed italic text-slate-700"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.05rem" }}>
                        {profile.writingMission}
                      </p>
                    </GlassCard>
                  )}
                </div>
              </section>
            )}

            {books.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader title="Current Projects &amp; Works" />
                  <button onClick={() => setEditingBook(createBook())}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{ background: "rgba(212,175,55,0.12)", color: "#b8960c", border: "1px solid rgba(212,175,55,0.25)" }}>
                    <Plus size={13} /> Add Book
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {books.slice(0, 8).map((book) => <BookCard key={book.id} book={book} onEdit={setEditingBook} />)}
                </div>
              </section>
            ) : !isNew && (
              <section>
                <SectionHeader title="Your Books" />
                <GlassCard className="p-10 text-center">
                  <div className="flex justify-center mb-3 gap-2">
                    <BookOpen size={32} style={{ color: "rgba(30,58,95,0.25)" }} />
                    <Feather size={22} style={{ color: "#b8960c", opacity: 0.5 }} />
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Add your books, manuscripts, and poetry collections here.</p>
                  <button onClick={() => setEditingBook(createBook())}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#fff" }}>
                    Add Your First Book
                  </button>
                </GlassCard>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Latest from the Author" sub="Recent essays and reflections" />
                <a href="https://dahtruth.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium transition-all hover:opacity-80"
                  style={{ color: BRAND.navy }}>
                  View full archive <ChevronRight size={12} />
                </a>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {blogPosts.map((post) => (
                  <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer">
                    <GlassCard className="p-5 h-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <span className="text-xs px-2.5 py-0.5 rounded-full mb-3 inline-block font-medium"
                        style={{ background: "rgba(30,58,95,0.08)", color: BRAND.navy }}>
                        {post.category}
                      </span>
                      <h3 className="font-semibold text-sm leading-snug mb-2"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy, fontSize: "1rem" }}>
                        {post.title}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-3 text-slate-500">{post.excerpt}</p>
                      <p className="text-xs mt-3 text-slate-400">{post.date}</p>
                    </GlassCard>
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
              <button onClick={() => setEditingBook(createBook())}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(212,175,55,0.12)", color: "#b8960c", border: "1px solid rgba(212,175,55,0.25)" }}>
                <Plus size={13} /> Add Book
              </button>
            </div>
            {activeProjects.length === 0
              ? <GlassCard className="p-10 text-center"><p className="text-sm text-slate-500">No active projects yet.</p></GlassCard>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {activeProjects.map((book) => <BookCard key={book.id} book={book} onEdit={setEditingBook} />)}
                </div>}
          </div>
        )}

        {/* Catalog tab */}
        {activeTab === "catalog" && (
          <div>
            <SectionHeader title="Published Works" sub="Your completed catalog" />
            {publishedBooks.length === 0
              ? <GlassCard className="p-10 text-center"><p className="text-sm text-slate-500">No published works yet — keep writing!</p></GlassCard>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {publishedBooks.map((book) => <BookCard key={book.id} book={book} onEdit={setEditingBook} />)}
                </div>}
          </div>
        )}
      </div>
    </div>
  );
}
