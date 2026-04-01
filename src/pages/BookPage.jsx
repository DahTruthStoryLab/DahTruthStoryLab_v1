// src/pages/BookPage.jsx
// Individual per-book display page — plain JSX (no TypeScript)
// Imports from useAuthorProfile.js only

import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthorProfile } from "../hooks/useAuthorProfile";

const STATUS_LABEL = {
  draft:         "In Draft",
  "in-progress": "In Progress",
  complete:      "Completed",
  published:     "Published",
};

const STATUS_STYLE = {
  published:     "bg-emerald-900/50 text-emerald-300 border-emerald-700/40",
  complete:      "bg-blue-900/50    text-blue-300    border-blue-700/40",
  "in-progress": "bg-amber-900/50   text-amber-300   border-amber-700/40",
  draft:         "bg-zinc-800/60    text-zinc-400    border-zinc-700/40",
};

const BUY_LABELS = {
  amazon:        "🛒 Amazon",
  barnesAndNoble:"📘 Barnes & Noble",
  kobo:          "📱 Kobo",
  applebooks:    "🍎 Apple Books",
  gumroad:       "💚 Gumroad",
  directStore:   "🏬 Buy Direct",
};

export default function BookPage() {
  const { bookId }  = useParams();
  const navigate    = useNavigate();
  const { getBook, profile, books } = useAuthorProfile();

  const book = bookId ? getBook(bookId) : null;

  if (!book) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg, #07102a 0%, #0d1535 100%)" }}
      >
        <p className="text-xl mb-4" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "EB Garamond, serif" }}>
          Book not found.
        </p>
        <Link
          to="/author"
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}
        >
          ← Back to Author Page
        </Link>
      </div>
    );
  }

  const otherBooks = books.filter((b) => b.id !== book.id && b.status !== "draft").slice(0, 4);
  const hasLinks = book.buyLinks && Object.values(book.buyLinks).some(Boolean);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #07102a 0%, #0d1535 60%, #12103a 100%)" }}
    >
      {/* Back nav */}
      <div className="max-w-5xl mx-auto px-8 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition-all hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          ← Back
        </button>
      </div>

      {/* Hero */}
      <div
        className="relative overflow-hidden py-14"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 rounded-full"
            style={{ background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)", transform: "translate(40%, -40%)" }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-start gap-10">

            {/* Cover */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div
                className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center text-6xl"
                style={{
                  background: book.coverUrl ? undefined : "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.1)",
                }}
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : "📖"}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <span className={`inline-block text-xs px-3 py-1 rounded-full border mb-4 ${STATUS_STYLE[book.status]}`}>
                {STATUS_LABEL[book.status]}
              </span>

              <h1
                className="text-4xl md:text-5xl font-semibold leading-tight mb-2"
                style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4" }}
              >
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="text-xl mb-4 italic" style={{ fontFamily: "EB Garamond, serif", color: "rgba(255,255,255,0.5)" }}>
                  {book.subtitle}
                </p>
              )}

              <p className="text-sm mb-5" style={{ color: "#c9a84c" }}>
                by {profile.penName || profile.fullName || "the Author"}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                {book.genre && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>
                    {book.genre}
                  </span>
                )}
                {book.series && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(107,79,160,0.15)", color: "#b094d4", border: "1px solid rgba(107,79,160,0.3)" }}>
                    {book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ""}
                  </span>
                )}
                {book.publishDate && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {new Date(book.publishDate).getFullYear()}
                  </span>
                )}
              </div>

              {hasLinks && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(book.buyLinks).map(([key, url]) =>
                    url ? (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#0d1535" }}>
                        {BUY_LABELS[key] || key}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-14">

        {/* Blurb */}
        {book.blurb && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              About This Book
            </h2>
            <p
              className="leading-relaxed max-w-3xl"
              style={{ fontFamily: "EB Garamond, serif", fontSize: "1.15rem", color: "rgba(255,255,255,0.75)", lineHeight: "1.8" }}
            >
              {book.blurb}
            </p>
          </section>
        )}

        {/* Excerpt */}
        {book.excerpt && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Excerpt
            </h2>
            <div
              className="rounded-xl p-8 max-w-3xl"
              style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderLeft: "3px solid rgba(201,168,76,0.5)" }}
            >
              <p
                className="leading-relaxed italic"
                style={{ fontFamily: "EB Garamond, serif", fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", lineHeight: "1.9" }}
              >
                {book.excerpt}
              </p>
            </div>
          </section>
        )}

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Themes &amp; Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Author box */}
        {profile.fullName && (
          <section
            className="rounded-2xl p-8"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
              About the Author
            </h2>
            <div className="flex items-start gap-6">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
                style={{ background: "rgba(201,168,76,0.12)", border: "2px solid rgba(201,168,76,0.3)" }}
              >
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : "✍"}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4" }}>
                  {profile.fullName}
                </h3>
                {profile.penName && (
                  <p className="text-xs mb-2" style={{ color: "#c9a84c" }}>Writing as {profile.penName}</p>
                )}
                {profile.bio && (
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "EB Garamond, serif", fontSize: "1rem" }}>
                    {profile.bio.length > 300 ? profile.bio.slice(0, 300) + "…" : profile.bio}
                  </p>
                )}
                <Link to="/author" className="inline-block mt-4 text-xs transition-all hover:opacity-80" style={{ color: "#c9a84c" }}>
                  View full author profile →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* More books */}
        {otherBooks.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "EB Garamond, serif", color: "#c9a84c" }}>
              More by This Author
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {otherBooks.map((b) => (
                <Link
                  key={b.id}
                  to={`/author/book/${b.id}`}
                  className="group block rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-32 flex items-center justify-center text-3xl"
                    style={{ background: b.coverUrl ? undefined : "rgba(201,168,76,0.06)" }}
                  >
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                    ) : "📖"}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-amber-300 transition-colors"
                      style={{ fontFamily: "EB Garamond, serif", color: "#e8e0d4" }}>
                      {b.title}
                    </p>
                    {b.genre && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{b.genre}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────
//  DahTruth StoryLab – BookPage.tsx
//  Individual per-book page display
// ─────────────────────────────────────────────
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthorProfile } from '../hooks/useAuthorProfile';
import type { Book } from '../types/authorTypes';

const STATUS_LABEL: Record<string, string> = {
  draft:        'In Draft',
  'in-progress':'In Progress',
  complete:     'Completed',
  published:    'Published',
};

const STATUS_STYLE: Record<string, string> = {
  published:    'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  complete:     'bg-blue-900/50    text-blue-300    border-blue-700/40',
  'in-progress':'bg-amber-900/50   text-amber-300   border-amber-700/40',
  draft:        'bg-zinc-800/60    text-zinc-400    border-zinc-700/40',
};

const BUY_LABELS: Record<string, string> = {
  amazon:        '🛒 Amazon',
  barnesAndNoble:'📘 Barnes & Noble',
  kobo:          '📱 Kobo',
  applebooks:    '🍎 Apple Books',
  gumroad:       '💚 Gumroad',
  directStore:   '🏬 Buy Direct',
};

// ─────────────────────────────────────────────
//  BookPage
// ─────────────────────────────────────────────
export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate   = useNavigate();
  const { getBook, profile, books } = useAuthorProfile();

  const book = bookId ? getBook(bookId) : null;

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #07102a 0%, #0d1535 100%)' }}>
        <p className="text-xl mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'EB Garamond, serif' }}>
          Book not found.
        </p>
        <Link to="/author"
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #a07830)', color: '#0d1535' }}>
          ← Back to Author Page
        </Link>
      </div>
    );
  }

  // Other books by same author (exclude current)
  const otherBooks = books.filter(b => b.id !== book.id && b.status !== 'draft').slice(0, 4);

  const hasLinks = Object.values(book.buyLinks).some(Boolean);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #07102a 0%, #0d1535 60%, #12103a 100%)' }}>

      {/* ── Back nav ── */}
      <div className="max-w-5xl mx-auto px-8 pt-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition-all hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          ← Back
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-14"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Decorative bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 rounded-full"
            style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)', transform: 'translate(40%, -40%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-start gap-10">

            {/* Cover */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center text-6xl"
                style={{
                  background: book.coverUrl ? undefined : 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.1)',
                }}>
                {book.coverUrl
                  ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  : '📖'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Status */}
              <span className={`inline-block text-xs px-3 py-1 rounded-full border mb-4 ${STATUS_STYLE[book.status]}`}>
                {STATUS_LABEL[book.status]}
              </span>

              <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-2"
                style={{ fontFamily: 'EB Garamond, serif', color: '#e8e0d4' }}>
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="text-xl mb-4 italic" style={{ fontFamily: 'EB Garamond, serif', color: 'rgba(255,255,255,0.5)' }}>
                  {book.subtitle}
                </p>
              )}

              {/* Author */}
              <p className="text-sm mb-5" style={{ color: '#c9a84c' }}>
                by {profile.penName || profile.fullName || 'the Author'}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 mb-6">
                {book.genre && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                    {book.genre}
                  </span>
                )}
                {book.series && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(107,79,160,0.15)', color: '#b094d4', border: '1px solid rgba(107,79,160,0.3)' }}>
                    {book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ''}
                  </span>
                )}
                {book.publishDate && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {new Date(book.publishDate).getFullYear()}
                  </span>
                )}
              </div>

              {/* Buy links */}
              {hasLinks && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(book.buyLinks).map(([key, url]) =>
                    url ? (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: 'linear-gradient(135deg, #c9a84c, #a07830)', color: '#0d1535' }}>
                        {BUY_LABELS[key] ?? key}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-14">

        {/* Blurb */}
        {book.blurb && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.35)' }}>About This Book</h2>
            <p className="leading-relaxed max-w-3xl"
              style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.15rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.8' }}>
              {book.blurb}
            </p>
          </section>
        )}

        {/* Excerpt */}
        {book.excerpt && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Excerpt</h2>
            <div className="rounded-xl p-8 max-w-3xl"
              style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderLeft: '3px solid rgba(201,168,76,0.5)' }}>
              <p className="leading-relaxed italic"
                style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.9' }}>
                {book.excerpt}
              </p>
            </div>
          </section>
        )}

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Themes &amp; Tags</h2>
            <div className="flex flex-wrap gap-2">
              {book.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Author section */}
        {profile.fullName && (
          <section className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              About the Author
            </h2>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
                style={{ background: 'rgba(201,168,76,0.12)', border: '2px solid rgba(201,168,76,0.3)' }}>
                {profile.photoUrl
                  ? <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  : '✍'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'EB Garamond, serif', color: '#e8e0d4' }}>
                  {profile.fullName}
                </h3>
                {profile.penName && (
                  <p className="text-xs mb-2" style={{ color: '#c9a84c' }}>Writing as {profile.penName}</p>
                )}
                {profile.bio && (
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'EB Garamond, serif', fontSize: '1rem' }}>
                    {profile.bio.length > 300 ? profile.bio.slice(0, 300) + '…' : profile.bio}
                  </p>
                )}
                <Link to="/author"
                  className="inline-block mt-4 text-xs transition-all hover:opacity-80" style={{ color: '#c9a84c' }}>
                  View full author profile →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Other Books */}
        {otherBooks.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'EB Garamond, serif', color: '#c9a84c' }}>
              More by This Author
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {otherBooks.map(b => (
                <Link key={b.id} to={`/author/book/${b.id}`}
                  className="group block rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="h-32 flex items-center justify-center text-3xl"
                    style={{ background: b.coverUrl ? undefined : 'rgba(201,168,76,0.06)' }}>
                    {b.coverUrl
                      ? <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                      : '📖'}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-amber-300 transition-colors"
                      style={{ fontFamily: 'EB Garamond, serif', color: '#e8e0d4' }}>
                      {b.title}
                    </p>
                    {b.genre && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.genre}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

