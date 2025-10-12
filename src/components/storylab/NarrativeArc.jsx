import React, { useMemo, useState, useEffect, useRef } from "react";
import { Heart, Users, Plane, Sparkles, BookOpen, MapPin } from "lucide-react";

/* =========================
   Brand color class mapping
   ========================= */
const COLOR_CLASSES = {
  primary: "bg-brand-navy border-brand-navy text-white",
  accent:  "bg-brand-rose border-brand-rose text-ink",
  gold:    "bg-brand-gold border-brand-gold text-ink",
  muted:   "bg-brand-mauve border-brand-mauve text-white",
  ink:     "bg-brand-ink border-brand-ink text-white",
};

/* =========================
   LocalStorage + helpers
   ========================= */
const LS_BEATS_KEY = "dt_arc_beats_v1";
const LS_CHARS_KEY = "dt_arc_chars_v1";

const loadLocal = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};
const saveLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const snap = (val, step = 5, min = 0, max = 100) => {
  const s = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, s));
};

const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;

const useDebouncedCallback = (fn, delay = 250) => {
  const tRef = useRef(null);
  return (v) => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => fn(v), delay);
  };
};

/* =========================
   Component
   ========================= */
const StoryArcTracker = () => {
  const DEFAULT_BEATS = [
    { id: 1, title: "Preston Meets Darla",        icon: Heart,   position: { x: 10, y: 70 }, content: "The moment their paths cross for the first time. Describe the circumstances, the setting, and the immediate connection or tension between them.", color: "primary", size: "large" },
    { id: 2, title: "Meeting Darla's Parents",    icon: Users,   position: { x: 25, y: 45 }, content: "Preston enters Darla's family world. Capture the dynamics, expectations, and how this shapes their relationship.",                                      color: "accent",  size: "medium" },
    { id: 3, title: "First Separation",           icon: MapPin,  position: { x: 40, y: 60 }, content: "Preston and Darla part ways. What forces them apart? What emotions surface? What remains unresolved?",                                         color: "muted",   size: "small" },
    { id: 4, title: "Mediterranean Consummation", icon: Plane,   position: { x: 55, y: 25 }, content: "Their relationship reaches its peak in the Mediterranean. Describe the passion, intimacy, and significance of this moment.",                       color: "gold",    size: "xlarge" },
    { id: 5, title: "Second Separation",          icon: BookOpen,position: { x: 70, y: 55 }, content: "Another parting, perhaps more painful than the first. What has changed? What do they each carry forward?",                                          color: "muted",   size: "small" },
    { id: 6, title: "Darla's Death",              icon: Sparkles,position: { x: 85, y: 75 }, content: "The final chapter. How does Darla's death occur? What is Preston's emotional journey? How does this transform him?",                                 color: "ink",     size: "large" },
  ];

  const DEFAULT_CHARACTERS = [
    { id: 1, name: "Darla Baxter",    initials: "DB", role: "Protagonist",      bg: "bg-brand-rose" },
    { id: 2, name: "Preston Stanley", initials: "PS", role: "Airman",           bg: "bg-brand-navy" },
    { id: 3, name: "Macy Baxter",     initials: "MB", role: "Mother",           bg: "bg-brand-mauve" },
    { id: 4, name: "Roosevelt Baxter",initials: "RB", role: "Father",           bg: "bg-brand-ink" },
    { id: 5, name: "Jonathan",        initials: "J",  role: "Brother",          bg: "bg-brand-gold text-ink" },
    { id: 6, name: "Michael",         initials: "M",  role: "Brother",          bg: "bg-brand-gold text-ink" },
    { id: 7, name: "Theresa",         initials: "T",  role: "Sister",           bg: "bg-brand-rose" },
    { id: 8, name: "Rebecca",         initials: "R",  role: "Jonathan’s wife",  bg: "bg-brand-mauve" },
    { id: 9, name: "Latoya",          initials: "L",  role: "Michael’s wife",   bg: "bg-brand-mauve" },
    { id:10, name: "DeShaun",         initials: "DS", role: "Relative",         bg: "bg-brand-navy" },
    { id:11, name: "Pauly",           initials: "P",  role: "Relative",         bg: "bg-brand-navy" },
    { id:12, name: "Rev. Wiley",      initials: "RW", role: "Pastor",           bg: "bg-brand-ink" },
    { id:13, name: "Nina Knox",       initials: "NK", role: "Grandmother",      bg: "bg-brand-gold text-ink" },
    { id:14, name: "Sam Knox",        initials: "SK", role: "Grandfather",      bg: "bg-brand-gold text-ink" },
    { id:15, name: "Cordelia King",   initials: "CK", role: "Friend",           bg: "bg-brand-rose" },
    { id:16, name: "Jersey",          initials: "JY", role: "Friend",           bg: "bg-brand-ink" },
  ];

  const [activeNode, setActiveNode] = useState(null);
  const [storyBeats, setStoryBeats] = useState(() => loadLocal(LS_BEATS_KEY, DEFAULT_BEATS));
  const [characters, setCharacters] = useState(() => loadLocal(LS_CHARS_KEY, DEFAULT_CHARACTERS));
  const [dragIndex, setDragIndex] = useState(null);

  // persist to localStorage
  useEffect(() => { saveLocal(LS_BEATS_KEY, storyBeats); }, [storyBeats]);
  useEffect(() => { saveLocal(LS_CHARS_KEY, characters); }, [characters]);

  // Export / Import
  const fileInputRef = useRef(null);
  const exportJSON = () => {
    const data = { beats: storyBeats, characters };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "story-arc.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.beats) setStoryBeats(parsed.beats);
      if (parsed.characters) setCharacters(parsed.characters);
    } catch {}
    e.target.value = "";
  };

  // Debounced beat editor
  const debouncedUpdate = useDebouncedCallback(({ id, content }) => {
    setStoryBeats(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));
  }, 250);

  // Keyboard nudging helper (Shift for faster)
  const nudgeBeat = (id, dx, dy, fast = false) => {
    const step = fast ? 5 : 1;
    setStoryBeats(prev => prev.map(b => b.id === id ? ({
      ...b,
      position: {
        x: snap(b.position.x + dx * step, 5, 5, 95),
        y: snap(b.position.y + dy * step, 5, 10, 85),
      }
    }) : b));
  };

  const getNodeSize = (size) => {
    switch (size) {
      case "small":  return "w-20 h-20";
      case "medium": return "w-24 h-24";
      case "large":  return "w-28 h-28";
      case "xlarge": return "w-32 h-32";
      default:       return "w-24 h-24";
    }
  };

  const getColorClasses = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.primary;

  const pathD = useMemo(() => {
    if (storyBeats.length < 2) return "";
    const pts = storyBeats.map(b => b.position);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` Q ${midX} ${prev.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [storyBeats]);

  return (
    <div className="min-h-screen bg-base bg-radial-fade p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-panel p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-rose flex items-center justify-center shadow-soft">
              <BookOpen className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold text-ink">Preston & Darla's Journey</h1>
              <p className="text-muted mt-1 font-sans">An emotional arc through love and loss</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={exportJSON} className="px-3 py-2 rounded-lg bg-brand-navy text-white hover:opacity-90">Export JSON</button>
            <button onClick={handleImportClick} className="px-3 py-2 rounded-lg bg-brand-rose text-ink hover:opacity-90">Import JSON</button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportChange} />
          </div>
        </div>

        {/* Master Arc Summary */}
        <div className="glass-panel p-8 mb-8">
          <h2 className="text-2xl font-serif font-bold text-ink mb-6">Complete Story Arc - Drag to Arrange</h2>
          <div
            className="relative h-80 bg-white/40 rounded-2xl p-8"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = parseInt(e.dataTransfer.getData("beatId"), 10);
              const rect = e.currentTarget.getBoundingClientRect();
              const xRaw = ((e.clientX - rect.left) / rect.width) * 100;
              const yRaw = ((e.clientY - rect.top) / rect.height) * 100;
              const x = snap(xRaw, 5, 5, 95);
              const y = snap(yRaw, 5, 10, 85);
              setStoryBeats(prev => prev.map(b => b.id === draggedId ? { ...b, position: { x, y } } : b));
            }}
          >
            {/* Decor path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 250" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="masterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   style={{ stopColor: "var(--brand-navy, #0B1B3B)",  stopOpacity: 0.4 }} />
                  <stop offset="50%"  style={{ stopColor: "var(--brand-gold, #D4AF37)",  stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: "var(--brand-ink,  #0F172A)",  stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              <path d="M 100 200 Q 250 160, 350 130 Q 450 80, 500 50 Q 550 80, 650 140 Q 750 170, 900 210"
                    fill="none" stroke="url(#masterGradient)" strokeWidth={3} strokeLinecap="round" strokeDasharray="6,4" />
            </svg>

            {/* Draggable beats */}
            <div className="relative z-10 h-full">
              {storyBeats.map((beat) => {
                const Icon = beat.icon;
                const isActive = activeNode === beat.id;
                return (
                  <div
                    key={beat.id}
                    className="flex flex-col items-center cursor-move group absolute"
                    style={{ left: `${beat.position.x}%`, top: `${beat.position.y}%`, transform: "translate(-50%, -50%)" }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("beatId", beat.id.toString());
                      e.currentTarget.style.opacity = "0.5";
                    }}
                    onDragEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onClick={() => setActiveNode(beat.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => {
                      if (ev.key === "ArrowLeft")  nudgeBeat(beat.id, -1, 0, ev.shiftKey);
                      if (ev.key === "ArrowRight") nudgeBeat(beat.id,  1, 0, ev.shiftKey);
                      if (ev.key === "ArrowUp")    nudgeBeat(beat.id,  0,-1, ev.shiftKey);
                      if (ev.key === "ArrowDown")  nudgeBeat(beat.id,  0, 1, ev.shiftKey);
                    }}
                    aria-label={`Edit beat ${beat.id}: ${beat.title}`}
                  >
                    <div className={`w-16 h-16 ${getColorClasses(beat.color)} rounded-full flex items-center justify-center shadow-soft border-4 border-white/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-glass ${isActive ? "scale-110 ring-4 ring-brand-navy/30" : ""}`}>
                      <Icon size={24} />
                    </div>

                    <div className="mt-3 text-center" style={{ width: 120 }}>
                      <div className="text-[9px] font-bold text-brand-navy mb-1">BEAT {beat.id}</div>
                      <div className="text-[11px] font-serif font-bold text-ink leading-tight break-words">{beat.title}</div>
                      <div className="glass mt-2 px-2 py-1 text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300 break-words">
                        {beat.content.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Arc Visualization */}
          <div className="lg:col-span-2">
            <div className="glass-soft p-8 h-[600px] relative overflow-hidden">
              <h2 className="text-2xl font-serif font-bold text-ink mb-6">Interactive Story Beats</h2>

              {/* SVG path through current positions */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   style={{ stopColor: "var(--brand-navy, #0B1B3B)", stopOpacity: 0.3 }} />
                    <stop offset="50%"  style={{ stopColor: "var(--brand-gold, #D4AF37)", stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: "var(--brand-ink,  #0F172A)", stopOpacity: 0.3 }} />
                  </linearGradient>
                </defs>
                <path d={pathD} fill="none" stroke="url(#pathGradient)" strokeWidth={3} strokeDasharray="8,4" vectorEffect="non-scaling-stroke" />
              </svg>

              {/* Nodes */}
              {storyBeats.map((beat, index) => {
                const Icon = beat.icon;
                const isActive = activeNode === beat.id;
                return (
                  <div
                    key={beat.id}
                    className="absolute cursor-pointer transition-all duration-500 hover:scale-110"
                    style={{
                      left: `${beat.position.x}%`,
                      top:  `${beat.position.y}%`,
                      transform: "translate(-50%, -50%)",
                      animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                      zIndex: isActive ? 20 : 10,
                    }}
                    onClick={() => setActiveNode(beat.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => {
                      if (ev.key === "ArrowLeft")  nudgeBeat(beat.id, -1, 0, ev.shiftKey);
                      if (ev.key === "ArrowRight") nudgeBeat(beat.id,  1, 0, ev.shiftKey);
                      if (ev.key === "ArrowUp")    nudgeBeat(beat.id,  0,-1, ev.shiftKey);
                      if (ev.key === "ArrowDown")  nudgeBeat(beat.id,  0, 1, ev.shiftKey);
                    }}
                    aria-pressed={isActive}
                    aria-label={`Select beat ${beat.id}`}
                  >
                    <div className={`${getNodeSize(beat.size)} ${getColorClasses(beat.color)} rounded-2xl border-4 flex flex-col items-center justify-center shadow-glass transition-all duration-300 ${isActive ? "scale-125 shadow-2xl" : ""}`}>
                      <Icon size={isActive ? 32 : 24} className="mb-1" />
                      <span className="text-[10px] font-bold text-center px-1 leading-tight">{beat.title.split(" ")[0]}</span>
                    </div>

                    <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}>
                      <div className="glass px-3 py-1 text-xs font-bold text-ink">Beat {beat.id}</div>
                    </div>

                    <div className={`absolute inset-0 ${getColorClasses(beat.color)} rounded-2xl opacity-20 transition-all duration-1000`} style={{ animation: isActive ? "pulse 2s ease-in-out infinite" : "none" }} aria-hidden />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-1">
            <div className="glass-soft p-6 sticky top-8">
              {activeNode ? (
                <div className="space-y-4">
                  {(() => {
                    const beat = storyBeats.find(b => b.id === activeNode);
                    const Icon = beat.icon;
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 ${getColorClasses(beat.color)} rounded-xl flex items-center justify-center shadow-soft`}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-brand-navy">BEAT {beat.id}</div>
                            <h3 className="text-lg font-serif font-bold text-ink leading-tight">{beat.title}</h3>
                          </div>
                        </div>

                        <textarea
                          defaultValue={beat.content}
                          onChange={(e) => debouncedUpdate({ id: beat.id, content: e.target.value })}
                          className="w-full h-64 p-4 bg-white/60 border-2 border-border rounded-xl text-ink text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-brand-navy resize-none shadow-inner-soft font-sans"
                          placeholder="Describe this moment..."
                        />

                        <div className="text-xs text-muted text-right">{beat.content.length} characters</div>

                        {/* Word goal (250) */}
                        <div className="mt-2 h-2 bg-white/50 rounded">
                          <div className="h-2 rounded bg-brand-navy" style={{ width: `${Math.min(100, Math.round((countWords(beat.content) / 250) * 100))}%` }} />
                        </div>
                        <div className="text-[11px] text-muted text-right">{countWords(beat.content)} / 250 words</div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="mx-auto text-brand-rose mb-4" size={48} />
                  <p className="text-muted font-sans">Click on a story node to edit its content</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Character Board (4x4) */}
        <div className="glass-soft p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif font-bold text-ink">Character Board (4x4)</h2>
            <p className="text-xs text-muted">Drag cards to reorder</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {characters.map((c, idx) => (
              <div
                key={c.id}
                className="rounded-2xl border-2 shadow-soft bg-white/60 border-border p-4 flex items-center gap-3 cursor-move select-none transition-transform duration-200 hover:scale-[1.02]"
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex === null || dragIndex === idx) return;
                  setCharacters(prev => {
                    const next = [...prev];
                    const [moved] = next.splice(dragIndex, 1);
                    next.splice(idx, 0, moved);
                    return next;
                  });
                  setDragIndex(null);
                }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${c.bg}`}>
                  {c.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{c.name}</div>
                  <div className="text-[11px] text-muted truncate">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="glass-soft p-6 mt-8">
          <div className="flex items-center gap-3">
            {storyBeats.map((beat, index) => {
              const Icon = beat.icon;
              const isActive = activeNode === beat.id;
              return (
                <React.Fragment key={beat.id}>
                  <button
                    onClick={() => setActiveNode(beat.id)}
                    className={`flex-1 ${getColorClasses(beat.color)} p-4 rounded-xl transition-all duration-300 hover:scale-105 ${isActive ? "ring-4 ring-brand-navy/50 scale-105" : ""}`}
                    aria-label={`Jump to beat ${beat.id}`}
                  >
                    <Icon size={20} className="mx-auto mb-2" />
                    <div className="text-[10px] font-bold text-center leading-tight">{beat.title}</div>
                  </button>
                  {index < storyBeats.length - 1 && <div className="w-4 h-1 bg-border rounded-full flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

export default StoryArcTracker;
