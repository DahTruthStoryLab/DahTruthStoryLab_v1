// Collaboration module (JSX). Paste as a NEW file.
// Works with the /story-lab/critique route above.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, EyeOff, Flag, Info, Key, Lock, MessageSquare, Plus, Shield, Trash2, Upload, Users } from "lucide-react";

const LS_KEY = "storylab_workshop_mvp_v1";

function loadState() { try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveState(state) { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {} }

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function selectionOffsets(rootEl, fullText) {
  const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0); if (!rootEl.contains(range.commonAncestorContainer)) return null;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let offset = 0, start = -1, end = -1;
  while (walker.nextNode()) {
    const n = walker.currentNode; const len = n.nodeValue?.length ?? 0;
    if (n === range.startContainer) start = offset + range.startOffset;
    if (n === range.endContainer) end = offset + range.endOffset;
    offset += len;
  }
  if (start === -1 || end === -1 || start === end) return null;
  const s = clamp(Math.min(start, end), 0, fullText.length); const e = clamp(Math.max(start, end), 0, fullText.length);
  return { start: s, end: e };
}

function renderWithHighlights(text, comments, sel) {
  const marks = [];
  comments.forEach((c) => marks.push({ s: c.start, e: c.end, kind: "comment" }));
  if (sel) marks.push({ s: sel.start, e: sel.end, kind: "select" });
  if (marks.length === 0) return [text];
  marks.sort((a, b) => a.s - b.s || a.e - b.e);

  const out = []; let cursor = 0;
  marks.forEach((m, i) => {
    if (m.s > cursor) out.push(text.slice(cursor, m.s));
    const slice = text.slice(m.s, m.e);
    const className = m.kind === "comment" ? "bg-yellow-200/60 rounded px-0.5" : "bg-blue-200/50 rounded px-0.5";
    out.push(<span key={`mk_${i}`} className={className}>{slice}</span>);
    cursor = m.e;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

function IPBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 text-slate-200 bg-slate-900/60">
      <Shield className="w-3 h-3" /> Author retains all rights
    </span>
  );
}

function exportTxt(doc) {
  const blob = new Blob([doc.text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

function AuditPanel({ doc }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center gap-2 font-semibold mb-2 text-slate-100"><Key className="w-4 h-4" /> Audit Log</div>
      <div className="space-y-1 max-h-40 overflow-auto text-xs">
        {doc.audit.slice().reverse().map((a) => (
          <div key={a.id} className="text-slate-300">
            {new Date(a.at).toLocaleString()} — <span className="font-mono">{a.actorId}</span> • {a.action}
          </div>
        ))}
        {doc.audit.length === 0 && <div className="text-slate-400">No activity yet.</div>}
      </div>
    </div>
  );
}

function CommentsPanel({ me, doc, updateDoc }) {
  const perms = doc.permissionsByMember[me.id];
  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center gap-2 font-semibold mb-2 text-slate-100"><MessageSquare className="w-4 h-4" /> Comments</div>
      <div className="space-y-3 max-h-72 overflow-auto pr-1">
        {doc.comments.length === 0 && <div className="text-sm text-slate-400">No comments yet.</div>}
        {doc.comments.map((c) => {
          const mine = c.authorId === me.id;
          return (
            <div key={c.id} className={`p-3 rounded-xl border ${c.resolved ? "bg-emerald-900/20 border-emerald-800" : "bg-black/30 border-slate-800"} text-slate-100`}>
              <div className="text-xs text-slate-400 mb-1">{new Date(c.createdAt).toLocaleString()}</div>
              <div className="text-sm leading-5">{c.text}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <button onClick={() => toggleResolved(c.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 text-slate-200">
                  <Check className="w-3 h-3" /> {c.resolved ? "Reopen" : "Resolve"}
                </button>
                {mine && (
                  <button onClick={() => deleteComment(c.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-700 text-rose-300">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          );
          function toggleResolved(id) {
            updateDoc((d) => {
              const cc = d.comments.find((x) => x.id === id);
              if (cc) { cc.resolved = !cc.resolved; d.audit.push({ id: uid("a"), actorId: me.id, action: `resolve:${id}:${cc.resolved}`, at: Date.now() }); }
            });
          }
          function deleteComment(id) {
            updateDoc((d) => { d.comments = d.comments.filter((x) => x.id !== id); d.audit.push({ id: uid("a"), actorId: me.id, action: `delete_comment:${id}`, at: Date.now() }); });
          }
        })}
      </div>
      {!perms?.canComment && (
        <div className="mt-3 text-xs text-amber-400/90 flex items-center gap-1"><Info className="w-3 h-3" /> You don’t have comment access.</div>
      )}
    </div>
  );
}

function PermissionsPanel({ me, doc, updateDoc }) {
  const isAuthor = me.id === doc.authorId;
  const [open, setOpen] = useState(false);
  const members = Object.keys(doc.permissionsByMember);

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
      <button onClick={() => setOpen((v) => !v)} className="w-full inline-flex items-center justify-between px-2 py-1 rounded-md text-slate-100">
        <span className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Permissions</span>
        {open ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {!isAuthor && <div className="text-xs text-slate-400">Only the author can edit permissions.</div>}
          {members.map((memberId) => {
            const perms = doc.permissionsByMember[memberId];
            const toggle = (label, key) => {
              const checked = perms?.[key] ?? false;
              return (
                <label className="flex items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    disabled={!isAuthor}
                    checked={checked}
                    onChange={(e) => {
                      const value = e.target.checked; if (!isAuthor) return;
                      updateDoc((d) => {
                        const cur = d.permissionsByMember[memberId] || { canView: false, canComment: false, canEdit: false, allowCopy: false, allowExport: false };
                        d.permissionsByMember[memberId] = { ...cur, [key]: value };
                        d.audit.push({ id: uid("a"), actorId: me.id, action: `perm:${memberId}:${key}:${value}`, at: Date.now() });
                      });
                    }}
                  />
                  {label}
                </label>
              );
            };
            return (
              <div key={memberId} className="p-3 rounded-xl border bg-black/30 border-slate-800">
                <div className="text-sm font-medium mb-2 text-slate-200">Member: <span className="text-slate-400">{memberId}</span></div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {toggle("View", "canView")}
                  {toggle("Comment", "canComment")}
                  {toggle("Edit", "canEdit")}
                  {toggle("Allow Copy", "allowCopy")}
                  {toggle("Allow Export", "allowExport")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CohortHeader({ cohort, setCohort, me }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const isFacilitator = cohort.members.find((m) => m.id === me.id)?.role === "facilitator";

  function addMember() {
    if (!inviteEmail.trim()) return;
    const m = { id: uid("m"), name: inviteEmail.split("@")[0], email: inviteEmail, role: "reviewer" };
    setCohort({ ...cohort, members: [...cohort.members, m] }); setInviteEmail("");
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">Cohort</div>
          <div className="text-xl font-semibold text-slate-100">{cohort.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex -space-x-2">
            {cohort.members.map((m) => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 grid place-items-center text-[10px] font-semibold text-white" title={`${m.name} • ${m.role}`}>
                {m.name.split(" ").map((w) => w[0]).join("")}
              </div>
            ))}
          </div>
          {isFacilitator && (
            <div className="flex items-center gap-2">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="invite by email" className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-400" />
              <button onClick={addMember} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-sky-600 text-white">
                <Plus className="w-4 h-4" /> Invite
              </button>
            </div>
          )}
        </div>
      </div>
      {cohort.confidentialityRequired && (
        <div className="mt-3 text-xs text-slate-300 flex items-center gap-1"><Lock className="w-3 h-3" /> By entering, you agree not to reproduce or share others’ work without permission.</div>
      )}
    </div>
  );
}

function DocumentPane({ me, doc, updateDoc }) {
  const readerRef = useRef(null);
  const [sel, setSel] = useState(null);
  const perms = doc.permissionsByMember[me.id];

  useEffect(() => {
    function onCopy(e) { if (!perms?.allowCopy) { e.preventDefault(); alert("Copy is disabled for this document."); } }
    document.addEventListener("copy", onCopy); return () => document.removeEventListener("copy", onCopy);
  }, [perms?.allowCopy]);

  const highlighted = useMemo(() => renderWithHighlights(doc.text, doc.comments, sel || undefined), [doc.text, doc.comments, sel]);
  function onSelect() { if (!readerRef.current) return; const off = selectionOffsets(readerRef.current, doc.text); setSel(off); }

  function addComment() {
    if (!sel) return; const text = prompt("Add your comment"); if (!text) return;
    updateDoc((d) => {
      d.comments.push({ id: uid("c"), authorId: me.id, start: sel.start, end: sel.end, text, createdAt: Date.now() });
      d.audit.push({ id: uid("a"), actorId: me.id, action: `comment:${sel.start}-${sel.end}`, at: Date.now() });
    });
    setSel(null);
  }
  function react(sym) { const at = sel ? sel.start : 0; updateDoc((d) => { d.reactions.push({ id: uid("r"), userId: me.id, atChar: at, symbol: sym }); }); }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Reader */}
      <div className="xl:col-span-2 relative">
        {doc.watermark && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
            <div className="rotate-[-25deg] text-4xl md:text-6xl font-bold whitespace-pre-wrap text-center text-white">{doc.watermark}</div>
          </div>
        )}
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-lg text-slate-100 flex items-center gap-2"><Lock className="w-4 h-4" /> {doc.title}</div>
            <div className="flex items-center gap-1 text-xs"><IPBadge /></div>
          </div>

          <div ref={readerRef} onMouseUp={onSelect} className="prose prose-invert max-w-none leading-7 whitespace-pre-wrap text-slate-100 select-text">
            {highlighted}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={addComment} disabled={!perms?.canComment || !sel} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-50">
              <MessageSquare className="w-4 h-4" /> Add comment
            </button>
            <button onClick={() => react("⭐")} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-100">⭐</button>
            <button onClick={() => react("💡")} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-100">💡</button>
            <button onClick={() => react("❓")} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-100">❓</button>
            <button onClick={() => react("👍")} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-100">👍</button>
            {perms?.allowExport && (
              <button onClick={() => exportTxt(doc)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-100">
                <Upload className="w-4 h-4" /> Export .txt
              </button>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-400">
            {sel ? `Selected ${sel.end - sel.start} chars` : "Select text to comment or react."}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="xl:col-span-1 space-y-4">
        <CommentsPanel me={me} doc={doc} updateDoc={updateDoc} />
        <PermissionsPanel me={me} doc={doc} updateDoc={updateDoc} />
        <AuditPanel doc={doc} />
      </div>
    </div>
  );
}

export default function WorkshopModule() {
  const persisted = loadState();
  const initial = persisted ?? seed();

  const [cohorts, setCohorts] = useState(initial.cohorts);
  const [me, setMe] = useState(initial.me);
  useEffect(() => { saveState({ cohorts, me }); }, [cohorts, me]);

  const cohort = cohorts[0];
  function setCohort(next) { setCohorts((cs) => { const copy = cs.slice(); copy[0] = next; return copy; }); }
  const activeDoc = useMemo(() => cohort.docs.find((d) => d.id === cohort.activeDocId), [cohort]);

  function updateDoc(mut) {
    setCohort({
      ...cohort,
      docs: cohort.docs.map((d) => {
        if (d.id !== cohort.activeDocId) return d;
        const copy = JSON.parse(JSON.stringify(d)); // simple structured clone
        mut(copy); return copy;
      }),
    });
  }

  function createDoc() {
    const title = prompt("New document title?") || "Untitled";
    const text = "Paste or type your draft here...";
    const doc = {
      id: uid("d"), title, text, authorId: me.id, comments: [], reactions: [],
      watermark: "StoryLab Session Copy • Confidential", audit: [],
      permissionsByMember: Object.fromEntries(cohort.members.map((m) => [m.id, defaultPermsFor(m, me)])),
    };
    setCohort({ ...cohort, docs: [doc, ...cohort.docs], activeDocId: doc.id });
  }

  function defaultPermsFor(m, author) {
    if (m.id === author.id) return { canView: true, canComment: true, canEdit: true, allowCopy: false, allowExport: true };
    if (m.role === "facilitator") return { canView: true, canComment: true, canEdit: false, allowCopy: false, allowExport: false };
    return { canView: true, canComment: true, canEdit: false, allowCopy: false, allowExport: false };
  }

  function seed() {
    const me = { id: "m_self", name: "You (Demo)", email: "you@storylab.local", role: "author" };
    const reviewer = { id: "m_2", name: "Peer Reviewer", email: "peer@example.com", role: "reviewer" };
    const facilitator = { id: "m_3", name: "Facilitator", email: "coach@example.com", role: "facilitator" };
    const demoText =
      "Darla stood at the window counting the streetlights,\n\n" +
      "and Preston's last message still glowed on her phone. The house hummed\nwith weekend noises—pots, laughter, a TV telling someone else's news.\n\n" +
      "She wrote a sentence, struck it out, then wrote it again. This time, it hurt.";
    const demoDoc = {
      id: "d_1", title: "Chapter – Saturday Prep", text: demoText, authorId: me.id,
      comments: [], reactions: [], watermark: "StoryLab Session Copy • Confidential", audit: [],
      permissionsByMember: {
        [me.id]: { canView: true, canComment: true, canEdit: true, allowCopy: false, allowExport: true },
        [reviewer.id]: { canView: true, canComment: true, canEdit: false, allowCopy: false, allowExport: false },
        [facilitator.id]: { canView: true, canComment: true, canEdit: false, allowCopy: false, allowExport: false },
      },
    };
    const cohort = { id: "c_1", name: "Spring Cohort – Fiction", members: [me, reviewer, facilitator], docs: [demoDoc], activeDocId: "d_1", confidentialityRequired: true };
    return { cohorts: [cohort], me };
  }

  // initialize once if no persisted state
  useEffect(() => {
    if (!persisted) {
      const seeded = seed();
      setCohorts(seeded.cohorts);
      setMe(seeded.me);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!activeDoc) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#0b1220] min-h-screen text-slate-100">
      <div className="mb-4">
        <div className="text-2xl font-bold">Critique Circle</div>
        <div className="text-slate-300">Secure cohort sharing, inline comments, and reactions.</div>
      </div>

      <CohortHeader cohort={cohort} setCohort={setCohort} me={me} />

      <div className="my-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Doc picker */}
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold flex items-center gap-2 text-slate-100"><Users className="w-4 h-4" /> Documents</div>
            <button onClick={createDoc} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-sky-600 text-white">
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {cohort.docs.map((d) => (
              <button
                key={d.id}
                onClick={() => setCohort({ ...cohort, activeDocId: d.id })}
                className={`w-full text-left p-3 rounded-xl border ${
                  cohort.activeDocId === d.id ? "bg-slate-800 border-sky-700" : "bg-slate-900/60 border-slate-800"
                } text-slate-100`}
              >
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-slate-400">Comments: {d.comments.length} • Reactions: {d.reactions.length}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400">Tip: Invite peers, then adjust their permissions in the doc view.</div>
        </div>

        {/* You (demo) */}
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
          <div className="font-semibold mb-2 flex items-center gap-2 text-slate-100"><Info className="w-4 h-4" /> You (demo)</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-slate-400 w-24">Name</span><span className="font-medium">{me.name}</span></div>
            <div className="flex items-center gap-2"><span className="text-slate-400 w-24">Email</span><span className="font-medium">{me.email}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-24">Role</span>
              <select value={me.role} onChange={(e) => setMe({ ...me, role: e.target.value })} className="px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-100">
                <option value="author">author</option>
                <option value="reviewer">reviewer</option>
                <option value="facilitator">facilitator</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Switch roles to demo permissions behavior.</div>
        </div>

        {/* Session Rules */}
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800">
          <div className="font-semibold mb-2 flex items-center gap-2 text-slate-100"><Flag className="w-4 h-4" /> Session Rules</div>
          <ul className="list-disc ml-5 text-sm space-y-1 text-slate-200">
            <li>Confidential: Do not share or reproduce others’ work.</li>
            <li>Be specific: Comment on sentences and choices, not people.</li>
            <li>Actionable: Suggest improvements or ask clarifying questions.</li>
            <li>Respect time: Keep critiques focused during live sessions.</li>
          </ul>
        </div>
      </div>

      {/* Reader + Comments + Permissions */}
      <DocumentPane me={me} doc={activeDoc} updateDoc={updateDoc} />
    </div>
  );
}
