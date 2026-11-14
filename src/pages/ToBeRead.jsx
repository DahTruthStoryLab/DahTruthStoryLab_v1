// src/pages/ToBeRead.jsx
// "To Be Read" — a reading list with a limit of 200 books added per year.
// Books can be added, edited and deleted; deleting frees the slot.

import React, { useMemo, useState } from "react";
import {
  BookMarked, Plus, Pencil, Trash2, Search, Star, Cloud, CloudOff, Loader2, X,
} from "lucide-react";
import { useTbrList, TBR_STATUSES, countForYear } from "../hooks/useTbrList";

const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  mauve: "#e8b4b8",
  ink: "#0F172A",
};

const SERIF = "'EB Garamond', Georgia, serif";

const STATUS_STYLE = {
  "to-read":  { bg: "rgba(100,116,139,0.10)", color: "#475569", border: "1px solid rgba(100,116,139,0.2)" },
  reading:    { bg: "rgba(212,175,55,0.14)",  color: "#b8960c", border: "1px solid rgba(212,175,55,0.3)" },
  finished:   { bg: "rgba(16,185,129,0.12)",  color: "#065f46", border: "1px solid rgba(16,185,129,0.3)" },
};

const EMPTY_FORM = {
  title: "", author: "", genre: "", status: "to-read", upNext: false, recommendedBy: "", notes: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "focus:outline-none focus:ring-2 focus:ring-amber-300/60 focus:border-amber-300";

function statusLabel(value) {
  return TBR_STATUSES.find((s) => s.value === value)?.label || "To Read";
}

function SyncBadge({ status }) {
  const map = {
    loading: { icon: Loader2, text: "Loading…", spin: true, color: "#64748b" },
    saving:  { icon: Loader2, text: "Saving…",  spin: true, color: "#64748b" },
    synced:  { icon: Cloud,   text: "Saved to cloud", color: "#065f46" },
    offline: { icon: CloudOff, text: "Saved on this device (cloud unavailable)", color: "#b45309" },
  };
  const s = map[status] || map.synced;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
      <Icon size={14} className={s.spin ? "animate-spin" : ""} />
      {s.text}
    </span>
  );
}

function BookForm({ initial, onSave, onCancel, isEdit }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [error, setError] = useState("");

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const result = onSave(form);
    if (result && !result.ok) setError(result.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl my-8 rounded-2xl shadow-xl bg-white border border-slate-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold" style={{ fontFamily: SERIF, color: BRAND.navy }}>
            {isEdit ? "Edit Book" : "Add a Book"}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close"
            className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Title *</label>
            <input className={inputCls} value={form.title} onChange={field("title")} autoFocus required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Author</label>
              <input className={inputCls} value={form.author} onChange={field("author")} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Genre</label>
              <input className={inputCls} value={form.genre} onChange={field("genre")} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Status</label>
              <select className={inputCls} value={form.status} onChange={field("status")}>
                {TBR_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500">Recommended by</label>
              <input className={inputCls} value={form.recommendedBy} onChange={field("recommendedBy")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={form.upNext} onChange={field("upNext")}
              className="h-4 w-4 rounded border-slate-300 accent-amber-500" />
            Mark as <strong>Up Next</strong>
          </label>
          <div>
            <label className="block text-xs mb-1.5 font-medium text-slate-500">Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={field("notes")}
              placeholder="Why it's on your list, where you heard about it…" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BRAND.navy }}>
            {isEdit ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BookCard({ book, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const st = STATUS_STYLE[book.status] || STATUS_STYLE["to-read"];

  return (
    <div className="rounded-2xl border border-slate-200/70 shadow-sm p-5 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.9)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug break-words"
            style={{ fontFamily: SERIF, color: BRAND.navy }}>
            {book.title}
          </h3>
          {book.author && <p className="text-sm text-slate-600">by {book.author}</p>}
        </div>
        {book.upNext && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
            style={{ background: "rgba(212,175,55,0.14)", color: BRAND.goldDark, border: "1px solid rgba(212,175,55,0.3)" }}>
            <Star size={11} fill="currentColor" /> Up Next
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: st.bg, color: st.color, border: st.border }}>
          {statusLabel(book.status)}
        </span>
        {book.genre && (
          <span className="px-2.5 py-0.5 rounded-full text-xs text-slate-600 bg-slate-100">{book.genre}</span>
        )}
      </div>

      {book.recommendedBy && (
        <p className="text-xs text-slate-500">Recommended by {book.recommendedBy}</p>
      )}
      {book.notes && <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{book.notes}</p>}

      <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          Added {new Date(book.addedAt).toLocaleDateString()}
        </span>
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Delete this book?</span>
            <button onClick={() => onDelete(book.id)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700">
              Delete
            </button>
            <button onClick={() => setConfirming(false)}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(book)} aria-label={`Edit ${book.title}`}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Pencil size={15} />
            </button>
            <button onClick={() => setConfirming(true)} aria-label={`Delete ${book.title}`}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToBeRead() {
  const {
    books, syncStatus, currentYear, usedThisYear, remainingThisYear, limit,
    addBook, updateBook, deleteBook,
  } = useTbrList();

  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", book }
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [query, setQuery] = useState("");

  const atLimit = remainingThisYear <= 0;
  const pct = Math.min(100, Math.round((usedThisYear / limit) * 100));

  const years = useMemo(() => {
    const set = new Set(books.map((b) => Number(b.addedYear)).filter(Boolean));
    set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [books, currentYear]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .filter((b) => yearFilter === "all" || Number(b.addedYear) === Number(yearFilter))
      .filter((b) =>
        !q ||
        [b.title, b.author, b.genre, b.notes, b.recommendedBy]
          .some((v) => String(v || "").toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (!!b.upNext !== !!a.upNext) return b.upNext ? 1 : -1;
        return Date.parse(b.addedAt) - Date.parse(a.addedAt);
      });
  }, [books, statusFilter, yearFilter, query]);

  const handleSave = (form) => {
    const result = modal?.mode === "edit" ? updateBook(modal.book.id, form) : addBook(form);
    if (result.ok) setModal(null);
    return result;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked size={26} style={{ color: BRAND.goldDark }} />
            <h1 className="text-3xl font-semibold tracking-wide" style={{ fontFamily: SERIF, color: BRAND.navy }}>
              To Be Read
            </h1>
          </div>
          <p className="text-sm mt-1 text-slate-500">
            Keep track of the books you want to read. You can add up to {limit} books each year.
          </p>
          <div className="mt-2 h-0.5 w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.mauve})` }} />
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button
            onClick={() => setModal({ mode: "add" })}
            disabled={atLimit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: BRAND.navy }}
          >
            <Plus size={16} /> Add Book
          </button>
          <SyncBadge status={syncStatus} />
        </div>
      </div>

      {/* Yearly counter */}
      <div className="rounded-2xl border border-slate-200/70 shadow-sm p-5 mb-6"
        style={{ background: "rgba(255,255,255,0.85)" }}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-600">
            <span className="text-2xl font-semibold" style={{ fontFamily: SERIF, color: BRAND.navy }}>
              {usedThisYear}
            </span>{" "}
            / {limit} books added in {currentYear}
          </p>
          <p className="text-sm" style={{ color: atLimit ? "#b91c1c" : "#64748b" }}>
            {atLimit
              ? "Limit reached. Delete a book to free up a slot."
              : `${remainingThisYear} slot${remainingThisYear === 1 ? "" : "s"} left this year`}
          </p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar" aria-valuenow={usedThisYear} aria-valuemin={0} aria-valuemax={limit}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: atLimit ? "#dc2626" : `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.goldDark})` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {[{ value: "all", label: "All" }, ...TBR_STATUSES].map((s) => {
            const active = statusFilter === s.value;
            return (
              <button key={s.value} onClick={() => setStatusFilter(s.value)}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={active
                  ? { background: BRAND.navy, color: "white" }
                  : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 md:ml-auto">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className={inputCls + " w-auto"} aria-label="Filter by year added">
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y} ({countForYear(books, y)})</option>
            ))}
          </select>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
              className={inputCls + " pl-9 w-48"} aria-label="Search books" />
          </div>
        </div>
      </div>

      {/* List */}
      {books.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 bg-white/60">
          <BookMarked size={36} className="mx-auto mb-3" style={{ color: BRAND.gold }} />
          <p className="text-lg" style={{ fontFamily: SERIF, color: BRAND.navy }}>Your reading list is empty.</p>
          <p className="text-sm text-slate-500 mt-1">Add the first book you want to read.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-12">No books match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((book) => (
            <BookCard key={book.id} book={book}
              onEdit={(b) => setModal({ mode: "edit", book: b })}
              onDelete={deleteBook} />
          ))}
        </div>
      )}

      {modal && (
        <BookForm
          key={modal.mode === "edit" ? modal.book.id : "new"}
          isEdit={modal.mode === "edit"}
          initial={modal.mode === "edit" ? modal.book : EMPTY_FORM}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
