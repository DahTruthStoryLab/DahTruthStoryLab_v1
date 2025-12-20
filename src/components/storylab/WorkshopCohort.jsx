// src/components/storylab/WorkshopCohort.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  Mail,
  Upload,
  Edit3,
  Save,
  X,
  UserPlus,
  Download,
  Send,
  Shuffle,
  CheckCircle,
  Pin,
  Sparkles,
  Layers,
  BookOpen,
  MessageSquare,
  Target,
  Heart,
  LayoutGrid,
  Clock,
  MapPin,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
  navyLight: "#2d4a6f",
  goldLight: "#e6c860",
};

/* ============= Helpers ============= */
const STORAGE_KEY = "dahtruth-workshop-cohort";

function loadCohortData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultCohort();
    return JSON.parse(raw);
  } catch {
    return getDefaultCohort();
  }
}

function saveCohortData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save cohort data", e);
  }
}

function getDefaultCohort() {
  return {
    name: "Spring 2025 Fiction Workshop",
    format: "8-week",
    startDate: "2025-03-15",
    endDate: "2025-05-10",
    meetingLink: "",
    location: "",
    participants: [],
    sessions: getDefaultSessions("8-week"),
    breakoutPairs: [],
    messages: [],
  };
}

function getDefaultSessions(format) {
  const sessionTitles = [
    { title: "Hopes • Fears • Legacy", module: "HFL", weeks: "Week 1" },
    { title: "Hopes • Fears • Legacy", module: "HFL", weeks: "Week 2" },
    { title: "Priority Cards", module: "Priorities", weeks: "Week 3" },
    { title: "Priority Cards", module: "Priorities", weeks: "Week 4" },
    { title: "Character Roadmap", module: "Roadmap", weeks: "Week 5" },
    { title: "Character Roadmap", module: "Roadmap", weeks: "Week 6" },
    { title: "Clothesline", module: "Clothesline", weeks: "Week 7" },
    { title: "Clothesline & Wrap-up", module: "Clothesline", weeks: "Week 8" },
  ];

  const count = format === "8-week" ? 8 : 10;
  const sessions = [];
  for (let i = 0; i < count; i++) {
    const info = sessionTitles[i] || { title: `Session ${i + 1}`, module: "", weeks: `Week ${i + 1}` };
    sessions.push({
      id: `session-${i + 1}`,
      number: i + 1,
      title: info.title,
      week: info.weeks,
      date: "",
      time: "",
      duration: "2 hours",
      objectives: [],
      agenda: [],
      modules: info.module ? [info.module] : [],
      homework: "",
      attendance: [],
      status: "upcoming",
    });
  }
  return sessions;
}

/* ============= Header Banner ============= */
const PageBanner = ({ cohort, onEdit }) => {
  const enrolled = cohort.participants.length;
  const maxParticipants = 20;
  const currentSession =
    cohort.sessions.findIndex((s) => s.status === "in-progress") + 1 || 1;
  const totalSessions = cohort.sessions.length;

  const completedSessions = cohort.sessions.filter((s) => s.status === "completed").length;

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 rounded-lg bg-white/20 px-3 py-1">
            <Users className="h-4 w-4 text-white/80" />
            <span className="text-xs font-semibold text-white/90">
              {cohort.format === "8-week" ? "8-Week Workshop" : "10-Day Intensive"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {cohort.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            {cohort.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {cohort.startDate} → {cohort.endDate}
              </span>
            )}
            {cohort.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {cohort.location}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <Edit3 size={16} />
          Edit Details
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="rounded-xl bg-white/15 backdrop-blur p-3">
          <div className="text-2xl font-bold text-white">
            {enrolled}<span className="text-lg text-white/60">/{maxParticipants}</span>
          </div>
          <div className="text-xs text-white/70">Participants</div>
        </div>
        <div className="rounded-xl bg-white/15 backdrop-blur p-3">
          <div className="text-2xl font-bold text-white">
            {currentSession}<span className="text-lg text-white/60">/{totalSessions}</span>
          </div>
          <div className="text-xs text-white/70">Current Session</div>
        </div>
        <div className="rounded-xl bg-white/15 backdrop-blur p-3">
          <div className="text-2xl font-bold text-white">{completedSessions}</div>
          <div className="text-xs text-white/70">Completed</div>
        </div>
        <div className="rounded-xl bg-white/15 backdrop-blur p-3">
          <div className="text-2xl font-bold text-amber-300">
            {cohort.breakoutPairs.length}
          </div>
          <div className="text-xs text-white/70">Critique Pairs</div>
        </div>
      </div>
    </div>
  );
};

/* ============= Tab Navigation ============= */
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: "directory", label: "Participants", icon: Users },
    { key: "schedule", label: "Sessions", icon: Calendar },
    { key: "breakouts", label: "Critique Pairs", icon: Shuffle },
    { key: "communication", label: "Messages", icon: Mail },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`
                : "rgba(255, 255, 255, 0.9)",
              color: isActive ? "#fff" : BRAND.navy,
              border: `1px solid ${isActive ? BRAND.navy : "rgba(30, 58, 95, 0.2)"}`,
              boxShadow: isActive ? `0 4px 12px ${BRAND.navy}30` : "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

/* ============= Participant Directory ============= */
const ParticipantDirectory = ({ participants, onEdit, onAdd, onDelete }) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.mauve}20` }}
          >
            <Users size={20} style={{ color: BRAND.mauve }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
              Participant Directory
            </h2>
            <p className="text-sm text-slate-500">{participants.length} members enrolled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
              boxShadow: `0 4px 12px ${BRAND.gold}40`,
            }}
          >
            <UserPlus size={16} />
            Add Participant
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-slate-100"
            style={{
              background: "white",
              border: `1px solid ${BRAND.navy}20`,
              color: BRAND.navy,
            }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${BRAND.mauve}15` }}
          >
            <Users size={32} style={{ color: BRAND.mauve }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: BRAND.navy }}>
            No Participants Yet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Add your first participant to get started
          </p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              background: `${BRAND.gold}20`,
              color: BRAND.navy,
              border: `1px solid ${BRAND.gold}40`,
            }}
          >
            <UserPlus size={16} />
            Add First Participant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              onClick={() => setSelectedParticipant(participant)}
            />
          ))}
        </div>
      )}

      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          onSave={(updated) => {
            onEdit(updated);
            setSelectedParticipant(null);
          }}
          onDelete={() => {
            onDelete(selectedParticipant.id);
            setSelectedParticipant(null);
          }}
        />
      )}
    </div>
  );
};

const ParticipantCard = ({ participant, onClick }) => {
  const initials = participant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left transition-all hover:shadow-lg hover:scale-[1.02] group"
      style={{
        background: "white",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              className="h-16 w-16 rounded-full object-cover"
              style={{ border: `3px solid ${BRAND.gold}40` }}
            />
          ) : (
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.mauve} 100%)`,
                border: `3px solid ${BRAND.gold}40`,
              }}
            >
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-center mb-1" style={{ color: BRAND.navy }}>
          {participant.name}
        </h3>
        {participant.email && (
          <p className="text-xs text-slate-500 mb-2 truncate max-w-full">
            {participant.email}
          </p>
        )}
        {participant.genre && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: `${BRAND.mauve}20`, color: BRAND.navy }}
          >
            {participant.genre}
          </span>
        )}
      </div>
    </button>
  );
};

const ParticipantModal = ({ participant, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(participant);
  const [avatarPreview, setAvatarPreview] = useState(participant.avatar || "");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setFormData({ ...formData, avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => onSave(formData);

  const initials = formData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "white" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: BRAND.navy }}>
            Edit Participant
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full object-cover"
                  style={{ border: `3px solid ${BRAND.gold}` }}
                />
              ) : (
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.mauve} 100%)`,
                    border: `3px solid ${BRAND.gold}`,
                  }}
                >
                  {initials}
                </div>
              )}
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <Upload className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Click to upload photo</p>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
              Genre/Focus
            </label>
            <select
              value={formData.genre || ""}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            >
              <option value="">Select genre...</option>
              <option value="Urban Fiction">Urban Fiction</option>
              <option value="Literary Fiction">Literary Fiction</option>
              <option value="Romance">Romance</option>
              <option value="Mystery/Thriller">Mystery/Thriller</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Memoir">Memoir</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Young Adult">Young Adult</option>
              <option value="Poetry">Poetry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
              Bio / What I'm Working On
            </label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
              style={{ border: `1px solid ${BRAND.navy}20` }}
              placeholder="Tell us about your writing project..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to remove this participant?")) {
                onDelete();
              }
            }}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            Remove Participant
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: "#f1f5f9", color: BRAND.navy }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============= Session Schedule ============= */
const SessionSchedule = ({ sessions, participants, onUpdateSession }) => {
  const [expandedSession, setExpandedSession] = useState(null);

  const moduleColors = {
    HFL: BRAND.mauve,
    Priorities: BRAND.gold,
    Roadmap: BRAND.navy,
    Clothesline: "#6366f1",
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${BRAND.gold}20` }}
        >
          <Calendar size={20} style={{ color: BRAND.gold }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
            Session Schedule
          </h2>
          <p className="text-sm text-slate-500">8-week character development journey</p>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const moduleColor = moduleColors[session.modules[0]] || BRAND.navy;

          return (
            <div
              key={session.id}
              className="rounded-xl transition-all"
              style={{
                background: "white",
                border: `1px solid ${moduleColor}20`,
              }}
            >
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${moduleColor} 0%, ${moduleColor}cc 100%)`,
                    }}
                  >
                    {session.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" style={{ color: BRAND.navy }}>
                        {session.title}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${moduleColor}15`, color: moduleColor }}
                      >
                        {session.week}
                      </span>
                    </div>
                    {session.date && (
                      <p className="text-sm text-slate-500">
                        {session.date} • {session.time} • {session.duration}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {session.status === "in-progress" ? "In Progress" : session.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.navy }}>
                        Objectives
                      </h4>
                      {session.objectives.length > 0 ? (
                        <ul className="space-y-1 text-sm text-slate-600">
                          {session.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No objectives set</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.navy }}>
                        Agenda
                      </h4>
                      {session.agenda.length > 0 ? (
                        <div className="space-y-2">
                          {session.agenda.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                              <span className="text-slate-400 font-mono text-xs">{item.time}</span>
                              <span className="text-slate-600">{item.activity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No agenda items</p>
                      )}
                    </div>
                  </div>

                  {session.homework && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: BRAND.navy }}>
                        Homework
                      </h4>
                      <p className="text-sm text-slate-600">{session.homework}</p>
                    </div>
                  )}

                  <button
                    onClick={() => onUpdateSession(session)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all hover:shadow"
                    style={{
                      background: `${BRAND.navy}08`,
                      color: BRAND.navy,
                      border: `1px solid ${BRAND.navy}15`,
                    }}
                  >
                    <Edit3 size={16} />
                    Edit Session Details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============= Breakout Assignments ============= */
const BreakoutAssignments = ({ participants, pairs, onShuffle }) => {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.navy}15` }}
          >
            <Shuffle size={20} style={{ color: BRAND.navy }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
              Critique Pairs
            </h2>
            <p className="text-sm text-slate-500">Breakout partners for feedback sessions</p>
          </div>
        </div>
        <button
          onClick={onShuffle}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <Shuffle size={16} />
          Shuffle Pairs
        </button>
      </div>

      {participants.length < 2 ? (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${BRAND.mauve}15` }}
          >
            <Users size={32} style={{ color: BRAND.mauve }} />
          </div>
          <p className="text-slate-500">Need at least 2 participants to create critique pairs.</p>
        </div>
      ) : pairs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No pairs created yet. Click "Shuffle Pairs" to generate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pairs.map((pair, idx) => (
            <div
              key={idx}
              className="rounded-xl p-4"
              style={{
                background: "white",
                border: `1px solid ${BRAND.mauve}30`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.mauve})` }}
                  >
                    {pair.participant1.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                    {pair.participant1.name}
                  </p>
                  <p className="text-xs text-slate-500">{pair.participant1.genre}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${BRAND.gold}20` }}
                >
                  <span style={{ color: BRAND.gold }}>↔</span>
                </div>
                <div className="flex-1 text-center">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${BRAND.mauve}, ${BRAND.navy})` }}
                  >
                    {pair.participant2.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                    {pair.participant2.name}
                  </p>
                  <p className="text-xs text-slate-500">{pair.participant2.genre}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============= Communication Hub ============= */
const CommunicationHub = ({ messages, participants, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText("");
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${BRAND.gold}20` }}
        >
          <Mail size={20} style={{ color: BRAND.gold }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
            Communication Hub
          </h2>
          <p className="text-sm text-slate-500">Send announcements to all participants</p>
        </div>
      </div>

      {/* Compose Message */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: `${BRAND.navy}05`, border: `1px solid ${BRAND.navy}10` }}
      >
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Compose message to all participants..."
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3"
          style={{ border: `1px solid ${BRAND.navy}15` }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            To: All Participants ({participants.length})
          </span>
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            }}
          >
            <Send size={16} />
            Send Message
          </button>
        </div>
      </div>

      {/* Message History */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.navy }}>
          Message History
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No messages sent yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl p-4"
                style={{ background: "white", border: `1px solid ${BRAND.navy}10` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
                    Group Message
                  </span>
                  <span className="text-xs text-slate-400">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-slate-600">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ============= Quick Links ============= */
const QuickLinks = () => {
  const links = [
    { to: "/story-lab/workshop/hfl", title: "Hopes & Fears", icon: Heart, color: BRAND.mauve },
    { to: "/story-lab/workshop/priorities", title: "Priorities", icon: Target, color: BRAND.gold },
    { to: "/story-lab/workshop/roadmap", title: "Roadmap", icon: Layers, color: BRAND.navy },
    { to: "/story-lab/workshop/clothesline", title: "Clothesline", icon: LayoutGrid, color: "#6366f1" },
  ];

  return (
    <div
      className="rounded-2xl p-6 mt-6"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: BRAND.navy }}>
        Quick Links to Modules
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-xl p-4 text-center transition-all hover:shadow-md hover:scale-105"
            style={{
              background: `${link.color}10`,
              border: `1px solid ${link.color}20`,
            }}
          >
            <link.icon
              size={24}
              className="mx-auto mb-2"
              style={{ color: link.color }}
            />
            <span className="text-sm font-medium" style={{ color: BRAND.navy }}>
              {link.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ============= Main Component ============= */
export default function WorkshopCohort() {
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(loadCohortData());
  const [activeTab, setActiveTab] = useState("directory");

  useEffect(() => {
    saveCohortData(cohort);
  }, [cohort]);

  const addParticipant = () => {
    const newParticipant = {
      id: `participant-${Date.now()}`,
      name: "New Participant",
      email: "",
      phone: "",
      genre: "",
      bio: "",
      avatar: "",
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setCohort({
      ...cohort,
      participants: [...cohort.participants, newParticipant],
    });
  };

  const editParticipant = (updated) => {
    setCohort({
      ...cohort,
      participants: cohort.participants.map((p) =>
        p.id === updated.id ? updated : p
      ),
    });
  };

  const deleteParticipant = (id) => {
    setCohort({
      ...cohort,
      participants: cohort.participants.filter((p) => p.id !== id),
    });
  };

  const updateSession = (session) => {
    alert("Session editing modal would open here for: " + session.title);
  };

  const shufflePairs = () => {
    const shuffled = [...cohort.participants].sort(() => Math.random() - 0.5);
    const newPairs = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newPairs.push({
        participant1: shuffled[i],
        participant2: shuffled[i + 1],
      });
    }
    setCohort({ ...cohort, breakoutPairs: newPairs });
  };

  const sendMessage = (text) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      text,
      timestamp: new Date().toLocaleString(),
      recipients: cohort.participants.length,
    };
    setCohort({
      ...cohort,
      messages: [newMessage, ...cohort.messages],
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Story Lab
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Workshop Manager
            </span>
          </div>
          <Link
            to="/story-lab/critique"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
              color: "#fff",
            }}
          >
            <MessageSquare size={16} />
            Critique Circle
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner */}
        <PageBanner cohort={cohort} onEdit={() => alert("Edit cohort details modal")} />

        {/* Tabs */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "directory" && (
          <ParticipantDirectory
            participants={cohort.participants}
            onEdit={editParticipant}
            onAdd={addParticipant}
            onDelete={deleteParticipant}
          />
        )}

        {activeTab === "schedule" && (
          <SessionSchedule
            sessions={cohort.sessions}
            participants={cohort.participants}
            onUpdateSession={updateSession}
          />
        )}

        {activeTab === "breakouts" && (
          <BreakoutAssignments
            participants={cohort.participants}
            pairs={cohort.breakoutPairs}
            onShuffle={shufflePairs}
          />
        )}

        {activeTab === "communication" && (
          <CommunicationHub
            messages={cohort.messages}
            participants={cohort.participants}
            onSendMessage={sendMessage}
          />
        )}

        {/* Quick Links */}
        <QuickLinks />
      </div>
    </div>
  );
}
