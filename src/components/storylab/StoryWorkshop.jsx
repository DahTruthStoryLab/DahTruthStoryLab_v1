// src/components/storylab/StoryWorkshop.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Quote, Users, Map, Flag, Pin, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw
} from "lucide-react";
import {
  loadProject, saveProject, ensureWorkshopFields, getFullStoryText, uid
} from "../../lib/storylab/projectStore";

/* ──────────────────────────────────────────────────────────────
   Simple tabbed layout
─────────────────────────────────────────────────────────────── */
const tabs = [
  { id: "characters", label: "Characters", icon: Users },
  { id: "roadmap",    label: "Roadmap",    icon: Map },
  { id: "priorities", label: "Priority Cards", icon: Flag },
  { id: "clothesline",label: "Clothesline", icon: Pin }
];

export default function StoryWorkshop() {
  const [project, setProject] = useState(() =>
    ensureWorkshopFields(loadProject()) || { title: "My Story", chapters: [] }
  );
  const [active, setActive] = useState("characters");

  // keep project in sync
  const commit = (mutator) => {
    const copy = JSON.parse(JSON.stringify(project || {}));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
  };

  const fullText = useMemo(() => getFullStoryText(project), [project]);

  return (
    <div style={page}>
      <QuoteBar fullText={fullText} />

      <div style={tabsBar}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{ ...tabBtn, ...(active === t.id ? tabBtnActive : {}) }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={panel}>
        {active === "characters"  && <CharactersPanel  project={project} commit={commit} />}
        {active === "roadmap"     && <RoadmapPanel     project={project} commit={commit} />}
        {active === "priorities"  && <PriorityPanel    project={project} commit={commit} />}
        {active === "clothesline" && <ClotheslinePanel project={project} commit={commit} />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Quote Bar (top): pulls a random sentence from the current story
─────────────────────────────────────────────────────────────── */
function QuoteBar({ fullText }) {
  const [quote, setQuote] = useState("");

  const pickSentence = () => {
    const sentences = (fullText || "")
      .replace(/\s+/g, " ")
      .match(/[^.!?]*[.!?]/g) || [];
    if (sentences.length === 0) {
      setQuote("“Start writing, then refresh to surface a line from your story.”");
      return;
    }
    const idx = Math.floor(Math.random() * sentences.length);
    setQuote(`“${sentences[idx].trim()}”`);
  };

  useEffect(() => { pickSentence(); }, [fullText]);

  return (
    <div style={quoteWrap}>
      <div style={quoteInner}>
        <Quote size={16} />
        <div style={{ flex: 1, padding: "0 10px" }}>{quote}</div>
        <button onClick={pickSentence} style={quoteRefresh} title="New quote from your story">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Characters: strengths & weaknesses
─────────────────────────────────────────────────────────────── */
function CharactersPanel({ project, commit }) {
  const chars = project?.characters || [];

  const add = () =>
    commit(p => { p.characters.push({ id: uid(), name: "New Character", strengths: "", weaknesses: "" }); });

  const remove = (id) =>
    commit(p => { p.characters = p.characters.filter(c => c.id !== id); });

  const update = (id, field, value) =>
    commit(p => {
      const c = p.characters.find(c => c.id === id);
      if (c) c[field] = value;
    });

  return (
    <div>
      <div style={sectionHeader}>
        <div>Character Strengths & Weaknesses</div>
        <button onClick={add} style={btn}><Plus size={16}/> Add Character</button>
      </div>

      <div style={grid}>
        {chars.map(c => (
          <div key={c.id} style={card}>
            <div style={rowBetween}>
              <input
                value={c.name}
                onChange={e => update(c.id, "name", e.target.value)}
                placeholder="Name"
                style={nameInput}
              />
              <button style={iconBtn} onClick={() => remove(c.id)} title="Delete"><Trash2 size={16}/></button>
            </div>
            <div style={twocol}>
              <div>
                <div style={label}>Strengths</div>
                <textarea
                  value={c.strengths}
                  onChange={e => update(c.id, "strengths", e.target.value)}
                  placeholder="e.g., Loyal, strategic, quick-witted"
                  rows={4}
                  style={ta}
                />
              </div>
              <div>
                <div style={label}>Weaknesses</div>
                <textarea
                  value={c.weaknesses}
                  onChange={e => update(c.id, "weaknesses", e.target.value)}
                  placeholder="e.g., Prideful, impulsive, avoids vulnerability"
                  rows={4}
                  style={ta}
                />
              </div>
            </div>
          </div>
        ))}
        {chars.length === 0 && <div style={emptyNote}>No characters yet. Click “Add Character”.</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Roadmap: simple ordered milestones (You are here ➜ There)
─────────────────────────────────────────────────────────────── */
function RoadmapPanel({ project, commit }) {
  const items = project?.roadmap || [];

  const add = () =>
    commit(p => { p.roadmap.push({ id: uid(), title: "New Milestone", done: false }); });

  const remove = (id) =>
    commit(p => { p.roadmap = p.roadmap.filter(r => r.id !== id); });

  const update = (id, patch) =>
    commit(p => {
      const r = p.roadmap.find(x => x.id === id);
      if (r) Object.assign(r, patch);
    });

  const move = (id, dir) =>
    commit(p => {
      const i = p.roadmap.findIndex(x => x.id === id);
      if (i < 0) return;
      const j = i + (dir === "up" ? -1 : 1);
      if (j < 0 || j >= p.roadmap.length) return;
      const [it] = p.roadmap.splice(i, 1);
      p.roadmap.splice(j, 0, it);
    });

  return (
    <div>
      <div style={sectionHeader}>
        <div>Story Roadmap</div>
        <button onClick={add} style={btn}><Plus size={16}/> Add Milestone</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((r, idx) => (
          <div key={r.id} style={cardRow}>
            <div style={rowLeft}>
              <button style={iconBtn} onClick={() => move(r.id, "up")} title="Move up"><ArrowUp size={16}/></button>
              <button style={iconBtn} onClick={() => move(r.id, "down")} title="Move down"><ArrowDown size={16}/></button>
            </div>
            <input
              value={r.title}
              onChange={e => update(r.id, { title: e.target.value })}
              style={wideInput}
              placeholder={`Milestone ${idx + 1}`}
            />
            <label style={chkRow}>
              <input
                type="checkbox"
                checked={!!r.done}
                onChange={e => update(r.id, { done: e.target.checked })}
              />
              <span style={{ marginLeft: 6 }}>Done</span>
            </label>
            <button style={iconBtn} onClick={() => remove(r.id)} title="Delete"><Trash2 size={16}/></button>
          </div>
        ))}
        {items.length === 0 && <div style={emptyNote}>No milestones yet. Click “Add Milestone”.</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Priority Cards: simple kanban-lite list
─────────────────────────────────────────────────────────────── */
function PriorityPanel({ project, commit }) {
  const items = project?.priorities || [];

  const add = () =>
    commit(p => { p.priorities.push({ id: uid(), title: "New Task", priority: "Medium", done: false }); });

  const remove = (id) =>
    commit(p => { p.priorities = p.priorities.filter(x => x.id !== id); });

  const update = (id, patch) =>
    commit(p => {
      const r = p.priorities.find(x => x.id === id);
      if (r) Object.assign(r, patch);
    });

  return (
    <div>
      <div style={sectionHeader}>
        <div>Priority Cards</div>
        <button onClick={add} style={btn}><Plus size={16}/> Add Card</button>
      </div>

      <div style={grid}>
        {items.map(x => (
          <div key={x.id} style={card}>
            <input
              value={x.title}
              onChange={e => update(x.id, { title: e.target.value })}
              placeholder="Task"
              style={wideInput}
            />
            <div style={rowBetween}>
              <select
                value={x.priority}
                onChange={e => update(x.id, { priority: e.target.value })}
                style={select}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <label style={chkRow}>
                <input
                  type="checkbox"
                  checked={!!x.done}
                  onChange={e => update(x.id, { done: e.target.checked })}
                />
                <span style={{ marginLeft: 6 }}>Done</span>
              </label>

              <button style={iconBtn} onClick={() => remove(x.id)} title="Delete"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={emptyNote}>No cards yet. Click “Add Card”.</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Clothesline: horizontal sequence of scenes
─────────────────────────────────────────────────────────────── */
function ClotheslinePanel({ project, commit }) {
  const items = project?.scenes || [];

  const add = () =>
    commit(p => { p.scenes.push({ id: uid(), title: "New Beat", notes: "" }); });

  const remove = (id) =>
    commit(p => { p.scenes = p.scenes.filter(x => x.id !== id); });

  const update = (id, patch) =>
    commit(p => {
      const x = p.scenes.find(s => s.id === id);
      if (x) Object.assign(x, patch);
    });

  const move = (id, dir) =>
    commit(p => {
      const i = p.scenes.findIndex(s => s.id === id);
      const j = i + (dir === "left" ? -1 : 1);
      if (i < 0 || j < 0 || j >= p.scenes.length) return;
      const [it] = p.scenes.splice(i, 1);
      p.scenes.splice(j, 0, it);
    });

  return (
    <div>
      <div style={sectionHeader}>
        <div>Clothesline</div>
        <button onClick={add} style={btn}><Plus size={16}/> Add Beat</button>
      </div>

      <div style={clothesWrap}>
        {items.map(s => (
          <div key={s.id} style={pegCard}>
            <div style={rowBetween}>
              <input
                value={s.title}
                onChange={e => update(s.id, { title: e.target.value })}
                placeholder="Beat/Scene title"
                style={nameInput}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button style={iconBtn} onClick={() => move(s.id, "left")}  title="Move left">◀</button>
                <button style={iconBtn} onClick={() => move(s.id, "right")} title="Move right">▶</button>
                <button style={iconBtn} onClick={() => remove(s.id)} title="Delete"><Trash2 size={16}/></button>
              </div>
            </div>
            <textarea
              value={s.notes}
              onChange={e => update(s.id, { notes: e.target.value })}
              placeholder="What happens here? Who wants what? Stakes?"
              rows={3}
              style={ta}
            />
          </div>
        ))}
        {items.length === 0 && <div style={emptyNote}>No beats yet. Click “Add Beat”.</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Styles (kept simple; align with your glassy aesthetic later)
─────────────────────────────────────────────────────────────── */
const page = { display: "flex", flexDirection: "column", gap: 12, height: "100%" };

const quoteWrap = {
  padding: 12, background: "linear-gradient(90deg, #eef2ff, #f5f7ff)",
  border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 4
};
const quoteInner = { display: "flex", alignItems: "center", gap: 8, fontStyle: "italic" };
const quoteRefresh = {
  border: "1px solid #cfd8e3", background: "white", borderRadius: 8, padding: "6px 10px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12
};

const tabsBar = { display: "flex", gap: 8, alignItems: "center" };
const tabBtn = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "8px 12px", borderRadius: 10, border: "1px solid #dbe2ea",
  background: "white", cursor: "pointer", fontWeight: 600
};
const tabBtnActive = { background: "#f1f5ff", borderColor: "#c7d2fe" };

const panel = { padding: 8, border: "1px solid #eef2f7", borderRadius: 12, background: "white" };

const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontWeight: 700 };
const btn = { border: "1px solid #cfd8e3", background: "white", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 };

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 };
const card = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.96)" };
const cardRow = { ...card, display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 10 };
const rowBetween = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
const rowLeft = { display: "flex", alignItems: "center", gap: 6 };
const nameInput = { border: "1px solid #cfd8e3", borderRadius: 8, padding: "8px 10px", width: "100%" };
const ta = { width: "100%", border: "1px solid #cfd8e3", borderRadius: 8, padding: 8, resize: "vertical" };
const label = { fontSize: 12, color: "#6b7280", marginBottom: 6 };
const iconBtn = { border: "1px solid #cfd8e3", background: "white", borderRadius: 8, padding: 6, cursor: "pointer" };
const wideInput = { border: "1px solid #cfd8e3", borderRadius: 8, padding: "8px 10px", width: "100%" };
const select = { border: "1px solid #cfd8e3", borderRadius: 8, padding: "6px 8px" };
const chkRow = { display: "inline-flex", alignItems: "center", userSelect: "none" };
const emptyNote = { fontSize: 13, color: "#6b7280", padding: 8 };

const clothesWrap = { display: "flex", gap: 12, overflowX: "auto", padding: 6, borderTop: "1px dashed #e5e7eb" };
const pegCard = { minWidth: 260, ...card };
