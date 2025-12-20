// src/components/storylab/WorkshopCohort.jsx
// Workshop Community - A collaborative space for writers
import React, { useEffect, useState, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  ThumbsUp,
  Eye,
  PenLine,
  Plus,
  Trash2,
  MoreVertical,
  BookOpenCheck,
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

/* ============= Storage Helpers ============= */
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
    description: "An 8-week journey through character development, from hopes and fears to a complete story arc.",
    format: "8-week",
    startDate: "2025-03-15",
    endDate: "2025-05-10",
    meetingLink: "",
    location: "Virtual",
    participants: [],
    sessions: getDefaultSessions("8-week"),
    breakoutPairs: [],
    messages: [],
    submissions: [],
  };
}

function getDefaultSessions(format) {
  const sessionTitles = [
    { title: "Hopes • Fears • Legacy", module: "HFL", weeks: "Week 1", focus: "Who is your character at their core?" },
    { title: "Hopes • Fears • Legacy", module: "HFL", weeks: "Week 2", focus: "Deep dive into character motivations" },
    { title: "Priority Cards", module: "Priorities", weeks: "Week 3", focus: "What must happen in your character's arc?" },
    { title: "Priority Cards", module: "Priorities", weeks: "Week 4", focus: "Refining the 4-5 key story beats" },
    { title: "Character Roadmap", module: "Roadmap", weeks: "Week 5", focus: "Mapping milestones to chapters" },
    { title: "Character Roadmap", module: "Roadmap", weeks: "Week 6", focus: "Building the scene-by-scene plan" },
    { title: "Clothesline", module: "Clothesline", weeks: "Week 7", focus: "Visualizing the complete journey" },
    { title: "Clothesline & Celebration", module: "Clothesline", weeks: "Week 8", focus: "Final presentations and next steps" },
  ];

  return sessionTitles.map((info, i) => ({
    id: `session-${i + 1}`,
    number: i + 1,
    title: info.title,
    week: info.weeks,
    focus: info.focus,
    date: "",
    time: "",
    duration: "2 hours",
    objectives: [],
    agenda: [],
    modules: info.module ? [info.module] : [],
    homework: "",
    attendance: [],
    status: i === 0 ? "in-progress" : "upcoming",
  }));
}

/* ============= Beautiful Header Banner ============= */
const WorkshopBanner = ({ cohort, currentSession }) => {
  const enrolled = cohort.participants.length;
  const totalSessions = cohort.sessions.length;
  const completedSessions = cohort.sessions.filter((s) => s.status === "completed").length;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-8"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 50%, ${BRAND.mauve} 100%)`,
      }}
    >
      {/* Main Banner Content */}
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full bg-white/20 px-4 py-1.5">
              <Users className="h-4 w-4 text-white/90" />
              <span className="text-sm font-medium text-white/90">Workshop Community</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {cohort.name}
            </h1>
            <p className="text-white/80 max-w-xl">
              {cohort.description}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Calendar size={16} />
              <span>{cohort.startDate} — {cohort.endDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <MapPin size={16} />
              <span>{cohort.location || "Virtual"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        className="px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <div>
          <div className="text-2xl font-bold text-white">{enrolled}</div>
          <div className="text-xs text-white/70">Writers Enrolled</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-300">
            Week {currentSession?.number || 1}
          </div>
          <div className="text-xs text-white/70">Current Session</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{completedSessions}/{totalSessions}</div>
          <div className="text-xs text-white/70">Sessions Complete</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{cohort.submissions?.length || 0}</div>
          <div className="text-xs text-white/70">Writing Submissions</div>
        </div>
      </div>

      {/* Current Session Focus */}
      {currentSession && (
        <div
          className="px-8 py-4 flex items-center justify-between"
          style={{ background: `${BRAND.gold}20` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-white/80">This Week's Focus</div>
              <div className="font-semibold text-white">{currentSession.title}: {currentSession.focus}</div>
            </div>
          </div>
          <Link
            to={`/story-lab/workshop/${currentSession.modules[0]?.toLowerCase() || 'hfl'}`}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            Open Module →
          </Link>
        </div>
      )}
    </div>
  );
};

/* ============= Tab Navigation ============= */
const TabNavigation = ({ activeTab, setActiveTab, submissionCount }) => {
  const tabs = [
    { key: "submissions", label: "Writing Workshop", icon: PenLine, badge: submissionCount },
    { key: "directory", label: "Members", icon: Users },
    { key: "schedule", label: "Sessions", icon: Calendar },
    { key: "pairs", label: "Critique Pairs", icon: Shuffle },
    { key: "messages", label: "Announcements", icon: Mail },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all relative"
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
            {tab.badge > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                style={{ background: BRAND.gold }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ============= Writing Submissions Section ============= */
const WritingWorkshop = ({ submissions, participants, onAddSubmission, onAddComment, onDeleteSubmission }) => {
  const [showNewSubmission, setShowNewSubmission] = useState(false);
  const [newSubmission, setNewSubmission] = useState({ title: "", content: "", authorId: "" });
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (!newSubmission.title.trim() || !newSubmission.content.trim()) return;
    onAddSubmission({
      id: `sub-${Date.now()}`,
      ...newSubmission,
      authorName: participants.find(p => p.id === newSubmission.authorId)?.name || "Anonymous",
      createdAt: new Date().toISOString(),
      comments: [],
      likes: 0,
    });
    setNewSubmission({ title: "", content: "", authorId: "" });
    setShowNewSubmission(false);
  };

  const handleAddComment = (submissionId) => {
    if (!newComment.trim()) return;
    onAddComment(submissionId, {
      id: `comment-${Date.now()}`,
      text: newComment,
      authorName: "Facilitator", // In real app, this would be current user
      createdAt: new Date().toISOString(),
    });
    setNewComment("");
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 100%)` }}
          >
            <PenLine size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>
              Writing Workshop
            </h2>
            <p className="text-sm text-slate-500">Share excerpts for feedback from your cohort</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewSubmission(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <Plus size={18} />
          Submit Writing
        </button>
      </div>

      {/* New Submission Form */}
      {showNewSubmission && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: `${BRAND.gold}08`, border: `1px solid ${BRAND.gold}30` }}
        >
          <h3 className="font-semibold mb-4" style={{ color: BRAND.navy }}>
            Submit Writing for Workshop
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
                Author
              </label>
              <select
                value={newSubmission.authorId}
                onChange={(e) => setNewSubmission({ ...newSubmission, authorId: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${BRAND.navy}20` }}
              >
                <option value="">Select participant...</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
                Title / Scene Name
              </label>
              <input
                type="text"
                value={newSubmission.title}
                onChange={(e) => setNewSubmission({ ...newSubmission, title: e.target.value })}
                placeholder="e.g., Chapter 3: The Confrontation"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${BRAND.navy}20` }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>
                Writing Excerpt
              </label>
              <textarea
                value={newSubmission.content}
                onChange={(e) => setNewSubmission({ ...newSubmission, content: e.target.value })}
                placeholder="Paste your writing excerpt here (aim for 500-1500 words)..."
                rows={10}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none font-mono"
                style={{ border: `1px solid ${BRAND.navy}20` }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewSubmission(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium"
                style={{ background: "#f1f5f9" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newSubmission.title || !newSubmission.content || !newSubmission.authorId}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
              >
                <Send size={16} />
                Submit for Workshop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${BRAND.mauve}15` }}
          >
            <FileText size={40} style={{ color: BRAND.mauve }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: BRAND.navy }}>
            No Writing Submitted Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            Be the first to share an excerpt! Workshop submissions are a great way to get feedback from your cohort.
          </p>
          <button
            onClick={() => setShowNewSubmission(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              background: `${BRAND.gold}20`,
              color: BRAND.navy,
              border: `1px solid ${BRAND.gold}40`,
            }}
          >
            <Plus size={16} />
            Submit First Excerpt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const isExpanded = expandedSubmission === submission.id;
            return (
              <div
                key={submission.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "white", border: `1px solid ${BRAND.navy}15` }}
              >
                {/* Submission Header */}
                <button
                  onClick={() => setExpandedSubmission(isExpanded ? null : submission.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.mauve})` }}
                      >
                        {submission.authorName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: BRAND.navy }}>
                          {submission.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          by {submission.authorName} • {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <MessageCircle size={14} />
                        {submission.comments?.length || 0}
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Writing Content */}
                    <div className="p-5 bg-slate-50">
                      <div
                        className="prose prose-sm max-w-none font-serif leading-relaxed whitespace-pre-wrap"
                        style={{ color: "#374151" }}
                      >
                        {submission.content}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="p-4 border-t border-slate-100">
                      <h4 className="text-sm font-semibold mb-3" style={{ color: BRAND.navy }}>
                        Feedback & Comments ({submission.comments?.length || 0})
                      </h4>

                      {/* Existing Comments */}
                      {submission.comments && submission.comments.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {submission.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-lg p-3"
                              style={{ background: `${BRAND.mauve}10` }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium" style={{ color: BRAND.navy }}>
                                  {comment.authorName}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic mb-4">
                          No comments yet. Be the first to give feedback!
                        </p>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add feedback or encouragement..."
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                          style={{ border: `1px solid ${BRAND.navy}15` }}
                          onKeyPress={(e) => e.key === "Enter" && handleAddComment(submission.id)}
                        />
                        <button
                          onClick={() => handleAddComment(submission.id)}
                          disabled={!newComment.trim()}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          style={{ background: BRAND.navy }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this submission?")) {
                            onDeleteSubmission(submission.id);
                          }
                        }}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Delete Submission
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============= Member Directory ============= */
const MemberDirectory = ({ participants, onEdit, onAdd, onDelete }) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        border: `1px solid ${BRAND.navy}10`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.mauve}20` }}
          >
            <Users size={24} style={{ color: BRAND.mauve }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>
              Workshop Members
            </h2>
            <p className="text-sm text-slate-500">{participants.length} writers in this cohort</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${BRAND.mauve}15` }}
          >
            <Users size={32} style={{ color: BRAND.mauve }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: BRAND.navy }}>
            No Members Yet
          </h3>
          <p className="text-sm text-slate-500">Add workshop participants to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => {
            const initials = participant.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <button
                key={participant.id}
                onClick={() => setSelectedParticipant(participant)}
                className="rounded-xl p-4 text-left transition-all hover:shadow-lg group"
                style={{ background: "white", border: `1px solid ${BRAND.navy}10` }}
              >
                <div className="flex items-center gap-3">
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: `2px solid ${BRAND.gold}40` }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.mauve})`,
                        border: `2px solid ${BRAND.gold}40`,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: BRAND.navy }}>
                      {participant.name}
                    </h3>
                    {participant.email && (
                      <p className="text-xs text-slate-500 truncate">{participant.email}</p>
                    )}
                    {participant.genre && (
                      <span
                        className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${BRAND.mauve}20`, color: BRAND.navy }}
                      >
                        {participant.genre}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
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

/* ============= Participant Modal ============= */
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

  const initials = formData.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: BRAND.navy }}>Edit Member</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" style={{ border: `3px solid ${BRAND.gold}` }} />
              ) : (
                <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.mauve})`, border: `3px solid ${BRAND.gold}` }}>
                  {initials}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Upload className="h-5 w-5 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Fields */}
          {[
            { key: "name", label: "Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "tel" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>{label}</label>
              <input
                type={type}
                value={formData[key] || ""}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${BRAND.navy}20` }}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>Genre</label>
            <select
              value={formData.genre || ""}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            >
              <option value="">Select...</option>
              {["Urban Fiction", "Literary Fiction", "Romance", "Mystery/Thriller", "Fantasy", "Sci-Fi", "Memoir", "Non-Fiction", "Young Adult", "Poetry"].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.navy }}>Bio</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ border: `1px solid ${BRAND.navy}20` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button onClick={() => window.confirm("Remove member?") && onDelete()} className="text-sm text-red-500">
            Remove
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm bg-slate-100">Cancel</button>
            <button onClick={() => onSave(formData)} className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: BRAND.gold }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============= Session Schedule ============= */
const SessionSchedule = ({ sessions, onUpdateSession }) => {
  const [expandedSession, setExpandedSession] = useState(null);

  const moduleColors = {
    HFL: BRAND.mauve,
    Priorities: BRAND.gold,
    Roadmap: BRAND.navy,
    Clothesline: "#6366f1",
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}10` }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.gold}20` }}>
          <Calendar size={24} style={{ color: BRAND.gold }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>8-Week Session Schedule</h2>
          <p className="text-sm text-slate-500">Your character development journey</p>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const color = moduleColors[session.modules[0]] || BRAND.navy;

          return (
            <div key={session.id} className="rounded-xl" style={{ background: "white", border: `1px solid ${color}20` }}>
              <button onClick={() => setExpandedSession(isExpanded ? null : session.id)} className="w-full p-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: color }}>
                    {session.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: BRAND.navy }}>{session.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{session.week}</span>
                    </div>
                    <p className="text-sm text-slate-500">{session.focus}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${session.status === "completed" ? "bg-green-100 text-green-700" : session.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {session.status === "in-progress" ? "Current" : session.status}
                  </span>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
                  {session.objectives.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.navy }}>Objectives</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {session.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5" />{obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button onClick={() => onUpdateSession(session)} className="w-full rounded-xl px-4 py-2 text-sm font-medium" style={{ background: `${BRAND.navy}08`, color: BRAND.navy, border: `1px solid ${BRAND.navy}15` }}>
                    <Edit3 size={16} className="inline mr-2" />Edit Session
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

/* ============= Critique Pairs ============= */
const CritiquePairs = ({ participants, pairs, onShuffle }) => (
  <div className="rounded-2xl p-6" style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}10` }}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.navy}15` }}>
          <Shuffle size={24} style={{ color: BRAND.navy }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>Critique Pairs</h2>
          <p className="text-sm text-slate-500">Feedback partners for this session</p>
        </div>
      </div>
      <button onClick={onShuffle} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}>
        <Shuffle size={16} />Shuffle
      </button>
    </div>

    {participants.length < 2 ? (
      <p className="text-center text-slate-500 py-8">Need at least 2 members to create pairs.</p>
    ) : pairs.length === 0 ? (
      <p className="text-center text-slate-500 py-8">Click "Shuffle" to generate critique pairs.</p>
    ) : (
      <div className="grid md:grid-cols-2 gap-4">
        {pairs.map((pair, idx) => (
          <div key={idx} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "white", border: `1px solid ${BRAND.mauve}30` }}>
            <div className="flex-1 text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-sm" style={{ background: BRAND.navy }}>
                {pair.participant1.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <p className="text-sm font-medium" style={{ color: BRAND.navy }}>{pair.participant1.name}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${BRAND.gold}20` }}>
              <span style={{ color: BRAND.gold }}>↔</span>
            </div>
            <div className="flex-1 text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-sm" style={{ background: BRAND.mauve }}>
                {pair.participant2.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <p className="text-sm font-medium" style={{ color: BRAND.navy }}>{pair.participant2.name}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ============= Announcements ============= */
const Announcements = ({ messages, participants, onSendMessage }) => {
  const [text, setText] = useState("");

  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}10` }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.gold}20` }}>
          <Mail size={24} style={{ color: BRAND.gold }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>Announcements</h2>
          <p className="text-sm text-slate-500">Messages to all workshop members</p>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: `${BRAND.navy}05`, border: `1px solid ${BRAND.navy}10` }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write an announcement..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3" style={{ border: `1px solid ${BRAND.navy}15` }} />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">To: All Members ({participants.length})</span>
          <button onClick={() => { if (text.trim()) { onSendMessage(text); setText(""); } }} disabled={!text.trim()} className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: BRAND.gold }}>
            <Send size={16} className="inline mr-1" />Send
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No announcements yet</p>
        ) : messages.map((msg) => (
          <div key={msg.id} className="rounded-xl p-4" style={{ background: "white", border: `1px solid ${BRAND.navy}10` }}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Announcement</span>
              <span className="text-xs text-slate-400">{msg.timestamp}</span>
            </div>
            <p className="text-sm text-slate-600">{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============= Quick Links to Modules ============= */
const ModuleQuickLinks = () => {
  const links = [
    { to: "/story-lab/workshop/hfl", title: "Hopes • Fears • Legacy", icon: Heart, color: BRAND.mauve, desc: "Weeks 1-2" },
    { to: "/story-lab/workshop/priorities", title: "Priority Cards", icon: Target, color: BRAND.gold, desc: "Weeks 3-4" },
    { to: "/story-lab/workshop/roadmap", title: "Character Roadmap", icon: Layers, color: BRAND.navy, desc: "Weeks 5-6" },
    { to: "/story-lab/workshop/clothesline", title: "Clothesline", icon: LayoutGrid, color: "#6366f1", desc: "Weeks 7-8" },
  ];

  return (
    <div className="rounded-2xl p-6 mt-8" style={{ background: `linear-gradient(135deg, ${BRAND.navy}05 0%, ${BRAND.mauve}10 100%)`, border: `1px solid ${BRAND.navy}10` }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: BRAND.navy }}>Story Journey Modules</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="rounded-xl p-4 text-center transition-all hover:shadow-md hover:scale-105" style={{ background: "white", border: `1px solid ${link.color}20` }}>
            <link.icon size={28} className="mx-auto mb-2" style={{ color: link.color }} />
            <span className="block text-sm font-medium" style={{ color: BRAND.navy }}>{link.title}</span>
            <span className="text-xs text-slate-500">{link.desc}</span>
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
  const [activeTab, setActiveTab] = useState("submissions");

  useEffect(() => {
    saveCohortData(cohort);
  }, [cohort]);

  const currentSession = cohort.sessions.find((s) => s.status === "in-progress") || cohort.sessions[0];

  // Handlers
  const addParticipant = () => {
    setCohort({
      ...cohort,
      participants: [...cohort.participants, {
        id: `p-${Date.now()}`,
        name: "New Member",
        email: "",
        phone: "",
        genre: "",
        bio: "",
        avatar: "",
      }],
    });
  };

  const editParticipant = (updated) => {
    setCohort({
      ...cohort,
      participants: cohort.participants.map((p) => p.id === updated.id ? updated : p),
    });
  };

  const deleteParticipant = (id) => {
    setCohort({
      ...cohort,
      participants: cohort.participants.filter((p) => p.id !== id),
    });
  };

  const shufflePairs = () => {
    const shuffled = [...cohort.participants].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push({ participant1: shuffled[i], participant2: shuffled[i + 1] });
    }
    setCohort({ ...cohort, breakoutPairs: pairs });
  };

  const sendMessage = (text) => {
    setCohort({
      ...cohort,
      messages: [{ id: `msg-${Date.now()}`, text, timestamp: new Date().toLocaleString() }, ...cohort.messages],
    });
  };

  const addSubmission = (submission) => {
    setCohort({
      ...cohort,
      submissions: [submission, ...(cohort.submissions || [])],
    });
  };

  const addComment = (submissionId, comment) => {
    setCohort({
      ...cohort,
      submissions: (cohort.submissions || []).map((s) =>
        s.id === submissionId ? { ...s, comments: [...(s.comments || []), comment] } : s
      ),
    });
  };

  const deleteSubmission = (id) => {
    setCohort({
      ...cohort,
      submissions: (cohort.submissions || []).filter((s) => s.id !== id),
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/story-lab" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} />
              Story Lab
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Workshop Community</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner */}
        <WorkshopBanner cohort={cohort} currentSession={currentSession} />

        {/* Tabs */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} submissionCount={cohort.submissions?.length || 0} />

        {/* Content */}
        {activeTab === "submissions" && (
          <WritingWorkshop
            submissions={cohort.submissions || []}
            participants={cohort.participants}
            onAddSubmission={addSubmission}
            onAddComment={addComment}
            onDeleteSubmission={deleteSubmission}
          />
        )}

        {activeTab === "directory" && (
          <MemberDirectory participants={cohort.participants} onEdit={editParticipant} onAdd={addParticipant} onDelete={deleteParticipant} />
        )}

        {activeTab === "schedule" && (
          <SessionSchedule sessions={cohort.sessions} onUpdateSession={(s) => alert("Edit: " + s.title)} />
        )}

        {activeTab === "pairs" && (
          <CritiquePairs participants={cohort.participants} pairs={cohort.breakoutPairs} onShuffle={shufflePairs} />
        )}

        {activeTab === "messages" && (
          <Announcements messages={cohort.messages} participants={cohort.participants} onSendMessage={sendMessage} />
        )}

        {/* Module Quick Links */}
        <ModuleQuickLinks />
      </div>
    </div>
  );
}
