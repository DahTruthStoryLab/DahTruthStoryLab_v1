// src/components/storylab/WorkshopCohort.jsx
import React, { useState, useEffect } from "react";
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
  Pin,
  Sparkles,
  Layers,
  BookOpen,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

/* ============= Helpers ============= */
const STORAGE_KEY = "dahtruth-workshop-cohort";
const glass = "bg-white/50 backdrop-blur-xl border border-white/60";
const glassLight = "bg-white/40 backdrop-blur-xl border border-white/50";

function getDefaultSessions(format) {
  const count = format === "8-week" ? 8 : 10;
  const sessions = [];
  for (let i = 1; i <= count; i++) {
    sessions.push({
      id: `session-${i}`,
      number: i,
      title: `Session ${i}`,
      date: "",
      time: "",
      duration: "2 hours",
      objectives: [],
      agenda: [],
      modules: [],
      homework: "",
      attendance: [],
      status: "upcoming",
    });
  }
  return sessions;
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

/* ============= UI Blocks ============= */

// Banner
const CohortBanner = ({ cohort, onEdit }) => {
  const enrolled = cohort.participants.length;
  const maxParticipants = 20;
  const currentSession = cohort.sessions.findIndex((s) => s.status === "in-progress") + 1 || 1;
  const totalSessions = cohort.sessions.length;

  const avgAttendance =
    cohort.sessions.reduce((acc, s) => {
      if (s.attendance.length === 0) return acc;
      return acc + s.attendance.filter((a) => a.attended).length / s.attendance.length;
    }, 0) /
      (cohort.sessions.filter((s) => s.attendance.length > 0).length || 1);

  return (
    <div className="mb-8">
      <div className="mx-auto max-w-5xl">
        <div className={`${glass} rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-2 rounded-lg border border-white/60 bg-white/40 px-3 py-1">
                  <Users className="h-4 w-4 text-ink/70" />
                  <span className="text-xs font-semibold text-ink/80">Workshop Cohort</span>
                </div>
                <h1 className="text-3xl font-bold text-ink">{cohort.name}</h1>
                <p className="text-sm text-ink/70 mt-1">
                  {cohort.format === "8-week" ? "8-Week Virtual Workshop" : "10-Day Intensive Retreat"}
                </p>
              </div>
              <button
                onClick={onEdit}
                className="rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-ink hover:bg-white inline-flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`${glassLight} rounded-xl p-3`}>
                <div className="text-2xl font-bold text-ink">
                  {enrolled}/{maxParticipants}
                </div>
                <div className="text-xs text-ink/60">Participants</div>
              </div>
              <div className={`${glassLight} rounded-xl p-3`}>
                <div className="text-2xl font-bold text-ink">Session {currentSession}</div>
                <div className="text-xs text-ink/60">of {totalSessions}</div>
              </div>
              <div className={`${glassLight} rounded-xl p-3`}>
                <div className="text-2xl font-bold text-ink">{Math.round(avgAttendance * 100)}%</div>
                <div className="text-xs text-ink/60">Avg Attendance</div>
              </div>
              <div className={`${glassLight} rounded-xl p-3`}>
                <div className="text-2xl font-bold text-ink">{cohort.startDate}</div>
                <div className="text-xs text-ink/60">Start Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Participant directory + modal
const ParticipantDirectory = ({ participants, onEdit, onAdd, onDelete }) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  return (
    <div className={`${glass} rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/60 bg-white/60 p-2">
            <Users className="h-5 w-5 text-ink/80" />
          </div>
          <h2 className="text-xl font-semibold text-ink">Participant Directory</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 shadow hover:shadow-md inline-flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Participant
          </button>
          <button className="rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-ink hover:bg-white inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-12 text-ink/60">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No participants yet. Add your first participant to get started.</p>
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
      className={`${glass} rounded-xl p-4 text-left transition hover:shadow-lg hover:scale-[1.02] group`}
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-white/60"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg border-2 border-white/60">
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-ink text-center mb-1">{participant.name}</h3>
        {participant.genre && (
          <span className="text-xs px-2 py-1 rounded-full bg-white/60 border border-white/60 text-ink/70">
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => onSave(formData);

  const initials = formData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`${glass} rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-ink">Edit Profile</h3>
          <button onClick={onClose} className="text-ink/60 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-white/60"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-amber-400 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/60">
                  {initials}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Upload className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-ink/60 mt-2">Click to upload photo</p>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Genre/Focus</label>
            <select
              value={formData.genre || ""}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none"
            >
              <option value="">Select genre...</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Poetry">Poetry</option>
              <option value="Memoir">Memoir</option>
              <option value="Young Adult">Young Adult</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Bio / What I'm Working On</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none resize-none"
              placeholder="Tell us about your writing project..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/40">
          <button
            onClick={() => {
              if (window.confirm("Remove this participant?")) onDelete();
            }}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove Participant
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/60 bg-white/70 px-4 py-2 text-sm text-ink hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 shadow hover:shadow-md inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Session Schedule
const SessionSchedule = ({ sessions, participants, onUpdateSession }) => {
  const [expandedSession, setExpandedSession] = useState(null);

  const moduleIcons = {
    Clothesline: Pin,
    Prompts: Sparkles,
    Roadmap: Layers,
    Priorities: CheckCircle,
    Critique: MessageSquare,
    HFL: BookOpen,
  };

  return (
    <div className={`${glass} rounded-2xl p-6 mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg border border-white/60 bg-white/60 p-2">
          <Calendar className="h-5 w-5 text-ink/80" />
        </div>
        <h2 className="text-xl font-semibold text-ink">Session Schedule</h2>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            participants={participants}
            moduleIcons={moduleIcons}
            isExpanded={expandedSession === session.id}
            onToggle={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            onUpdate={onUpdateSession}
          />
        ))}
      </div>
    </div>
  );
};

const SessionCard = ({ session, participants, moduleIcons, isExpanded, onToggle, onUpdate }) => {
  const statusColors = {
    upcoming: "bg-slate-500/20 text-slate-800 border-slate-600/40",
    "in-progress": "bg-sky-500/20 text-sky-800 border-sky-600/40",
    completed: "bg-emerald-500/20 text-emerald-800 border-emerald-600/40",
  };

  const attendanceCount = session.attendance.filter((a) => a.attended).length;
  const totalParticipants = participants.length;

  return (
    <div className={`${glassLight} rounded-xl p-4 transition hover:shadow`}>
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-400 flex items-center justify-center text-white font-bold flex-shrink-0">
              {session.number}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink mb-1">{session.title}</h3>
              {session.date && (
                <p className="text-sm text-ink/70">
                  {session.date} • {session.time} • {session.duration}
                </p>
              )}
              {session.modules.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {session.modules.map((mod) => {
                    const Icon = moduleIcons[mod] || BookOpen;
                    return (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/60 border border-white/60 text-ink/70"
                      >
                        <Icon className="h-3 w-3" />
                        {mod}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[session.status]}`}>
              {session.status.replace("-", " ")}
            </span>
            {session.status === "completed" && totalParticipants > 0 && (
              <span className="text-xs text-ink/60">✓ {attendanceCount}/{totalParticipants}</span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/40 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-ink mb-2">Objectives</h4>
            {session.objectives.length > 0 ? (
              <ul className="space-y-1 text-sm text-ink/80">
                {session.objectives.map((obj, i) => (
                  <li key={i}>• {obj}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/60">No objectives set</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink mb-2">Agenda</h4>
            {session.agenda.length > 0 ? (
              <div className="space-y-2">
                {session.agenda.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-ink/60 font-mono">{item.time}</span>
                    <span className="text-ink/80">{item.activity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/60">No agenda items</p>
            )}
          </div>

          {session.homework && (
            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Homework</h4>
              <p className="text-sm text-ink/80">{session.homework}</p>
            </div>
          )}

          <button
            onClick={() => onUpdate(session)}
            className="w-full rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-ink hover:bg-white inline-flex items-center justify-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit Session Details
          </button>
        </div>
      )}
    </div>
  );
};

// Breakouts
const BreakoutAssignments = ({ participants, pairs, onShuffle }) => {
  return (
    <div className={`${glass} rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/60 bg-white/60 p-2">
            <Users className="h-5 w-5 text-ink/80" />
          </div>
          <h2 className="text-xl font-semibold text-ink">Breakout Assignments</h2>
        </div>
        <button
          onClick={onShuffle}
          className="rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-ink hover:bg-white inline-flex items-center gap-2"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle Pairs
        </button>
      </div>

      {participants.length < 2 ? (
        <div className="text-center py-8 text-ink/60">
          <p>Need at least 2 participants to create breakout pairs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pairs.map((pair, idx) => (
            <div key={idx} className={`${glassLight} rounded-xl p-4`}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-ink">{pair.participant1.name}</p>
                  <p className="text-xs text-ink/60">{pair.participant1.genre}</p>
                </div>
                <div className="text-ink/40">↔</div>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{pair.participant2.name}</p>
                  <p className="text-xs text-ink/60">{pair.participant2.genre}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Communication
const CommunicationHub = ({ messages, participants, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText("");
  };

  return (
    <div className={`${glass} rounded-2xl p-6 mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg border border-white/60 bg-white/60 p-2">
          <Mail className="h-5 w-5 text-ink/80" />
        </div>
        <h2 className="text-xl font-semibold text-ink">Communication Hub</h2>
      </div>

      <div className={`${glassLight} rounded-xl p-4 mb-4`}>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Compose message to all participants..."
          rows={3}
          className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-ink focus:border-violet-400 outline-none resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/60">To: All Participants ({participants.length})</span>
          <button
            onClick={handleSend}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 shadow hover:shadow-md inline-flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Email
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-ink/60 py-4">No messages sent yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`${glassLight} rounded-xl p-3`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-ink">Group Message</span>
                <span className="text-xs text-ink/60">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-ink/80">{msg.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ============= Main ============= */
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
    setCohort({ ...cohort, participants: [...cohort.participants, newParticipant] });
  };

  const editParticipant = (updated) => {
    setCohort({
      ...cohort,
      participants: cohort.participants.map((p) => (p.id === updated.id ? updated : p)),
    });
  };

  const deleteParticipant = (id) => {
    setCohort({ ...cohort, participants: cohort.participants.filter((p) => p.id !== id) });
  };

  const updateSession = (session) => {
    // placeholder: hook up a modal later
    alert("Session editing modal would open here");
  };

  const shufflePairs = () => {
    const shuffled = [...cohort.participants].sort(() => Math.random() - 0.5);
    const newPairs = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newPairs.push({ participant1: shuffled[i], participant2: shuffled[i + 1] });
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
    setCohort({ ...cohort, messages: [...cohort.messages, newMessage] });
  };

  const tabs = [
    { key: "directory", label: "Participant Directory", icon: Users },
    { key: "schedule", label: "Session Schedule", icon: Calendar },
    { key: "breakouts", label: "Breakout Pairs", icon: Shuffle },
    { key: "communication", label: "Communication", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/story-lab")}
              className="rounded-xl px-3 py-2 text-sm hover:shadow inline-flex items-center gap-2 border border-white/60 bg-white/70"
              title="Back to StoryLab"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="rounded-lg px-3 py-1 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 shadow">
              Workshop Cohort Manager
            </div>
          </div>
          <Link
            to="/story-lab/critique"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm text-ink hover:bg-white"
          >
            Open Critique Circle
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <CohortBanner cohort={cohort} onEdit={() => alert("Edit cohort details modal")} />

        {/* Tabs */}
        <div className={`${glass} rounded-2xl p-2 flex flex-wrap gap-2 mb-6`}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm border inline-flex items-center gap-2 ${
                  active ? "bg-white shadow font-semibold" : "bg-white/60 hover:bg-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

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
        <div className={`${glass} rounded-2xl p-6`}>
          <h3 className="text-lg font-semibold text-ink mb-4">Quick Links to Modules</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/story-lab/workshop/clothesline"
              className={`${glassLight} rounded-xl p-4 text-center hover:shadow transition`}
            >
              <Pin className="h-6 w-6 mx-auto mb-2 text-ink/70" />
              <span className="text-sm font-medium text-ink">Clothesline</span>
            </Link>
            <Link
              to="/story-lab/prompts"
              className={`${glassLight} rounded-xl p-4 text-center hover:shadow transition`}
            >
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-ink/70" />
              <span className="text-sm font-medium text-ink">Story Prompts</span>
            </Link>
            <Link
              to="/story-lab/workshop/roadmap"
              className={`${glassLight} rounded-xl p-4 text-center hover:shadow transition`}
            >
              <Layers className="h-6 w-6 mx-auto mb-2 text-ink/70" />
              <span className="text-sm font-medium text-ink">Roadmap</span>
            </Link>
            <Link
              to="/story-lab/workshop/priorities"
              className={`${glassLight} rounded-xl p-4 text-center hover:shadow transition`}
            >
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-ink/70" />
              <span className="text-sm font-medium text-ink">Priority Cards</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
