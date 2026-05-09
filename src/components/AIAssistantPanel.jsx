// src/components/AIAssistantPanel.jsx
//
// Standalone AI Assistant panel for the Compose page.
// Slides up from the bottom of the editor area, takes 50% height when open.
// Handles conversation persistence to S3, history sidebar, and send-to-compose.
//
// Props:
//   isOpen          — boolean, whether the panel is visible
//   onClose         — function, called when user clicks X
//   projectId       — string, current project ID (for S3 paths)
//   chapterTitle    — string, title of the current chapter (for AI context)
//   chapterText     — string, plain text of the current chapter (for AI context)
//   provider        — "anthropic" | "openai", which AI to use
//   onSendToCompose — function(text), called when user clicks "Send to Compose"

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  Clock,
  ChevronLeft,
  Copy,
  FileEdit,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

import {
  runAssistant,
  listConversations,
  loadConversation,
  saveConversation,
  deleteConversation,
  generateConversationId,
  generateConversationTitle,
} from "../lib/api";

import { rateLimiter } from "../utils/rateLimiter";

/* ----------------------------- Helpers ----------------------------- */

function getUserId() {
  try {
    const authUser = localStorage.getItem("dt_auth_user");
    if (authUser) {
      const parsed = JSON.parse(authUser);
      return parsed.id || parsed.username || "default";
    }
  } catch {}
  return "default";
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  try {
    const then = new Date(isoString);
    const now = new Date();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return then.toLocaleDateString();
  } catch {
    return "";
  }
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function AIAssistantPanel({
  isOpen,
  onClose,
  projectId,
  chapterTitle = "",
  chapterText = "",
  provider = "anthropic",
  onSendToCompose,
}) {
  // Conversation state
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationList, setConversationList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  // Toast for confirmations
  const [toast, setToast] = useState(null);

  // Refs for auto-save debounce and scrolling
  const saveTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Derived: messages from current conversation
  const chatMessages = currentConversation?.messages || [];

  /* ----------------------- Toast helper ----------------------- */

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* ----------------------- Load conversation list ----------------------- */

  const loadConversationList = useCallback(async () => {
    if (!projectId) return;
    try {
      const userId = getUserId();
      const list = await listConversations(projectId, userId);
      setConversationList(list || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setConversationList([]);
    }
  }, [projectId]);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadConversationList();
    }
  }, [isOpen, projectId, loadConversationList]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !showHistory) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, showHistory]);

  /* ----------------------- Conversation management ----------------------- */

  const handleNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setShowHistory(false);
    setChatInput("");
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, []);

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
    loadConversationList();
  }, [loadConversationList]);

  const handleLoadConversation = useCallback(
    async (conversationId) => {
      if (!projectId || !conversationId) return;
      setConversationLoading(true);
      try {
        const userId = getUserId();
        const conv = await loadConversation(projectId, conversationId, userId);
        if (conv) {
          setCurrentConversation(conv);
          setShowHistory(false);
        } else {
          showToast("Conversation not found", "error");
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
        showToast("Failed to load conversation", "error");
      } finally {
        setConversationLoading(false);
      }
    },
    [projectId, showToast]
  );

  const handleDeleteConversation = useCallback(
    async (conversationId, e) => {
      if (e) e.stopPropagation();
      if (!projectId || !conversationId) return;
      if (!window.confirm("Delete this conversation? This cannot be undone.")) return;

      try {
        const userId = getUserId();
        await deleteConversation(projectId, conversationId, userId);
        setConversationList((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
        }
        showToast("Conversation deleted");
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        showToast("Failed to delete conversation", "error");
      }
    },
    [projectId, currentConversation, showToast]
  );

  /* ----------------------- Auto-save (debounced) ----------------------- */

  const scheduleConversationSave = useCallback(
    (conversation) => {
      if (!projectId || !conversation) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const userId = getUserId();
          await saveConversation(projectId, conversation, userId);
          // Update list metadata
          setConversationList((prev) => {
            const filtered = prev.filter((c) => c.id !== conversation.id);
            return [
              {
                id: conversation.id,
                title: conversation.title,
                model: conversation.model,
                messageCount: conversation.messages?.length || 0,
                updatedAt: new Date().toISOString(),
                createdAt: conversation.createdAt,
              },
              ...filtered,
            ];
          });
        } catch (err) {
          console.error("Failed to save conversation:", err);
        }
      }, 2000);
    },
    [projectId]
  );

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /* ----------------------- Send to Compose ----------------------- */

  const handleSendToCompose = useCallback(
    (text) => {
      if (!text || !onSendToCompose) return;
      try {
        onSendToCompose(text);
        showToast("Sent to Compose");
      } catch (err) {
        console.error("Failed to send to Compose:", err);
        showToast("Failed to send to Compose", "error");
      }
    },
    [onSendToCompose, showToast]
  );

  const handleCopy = useCallback(
    (text) => {
      navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    },
    [showToast]
  );

  /* ----------------------- Send a message ----------------------- */

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };

    // Build or extend conversation
    let workingConv = currentConversation;
    if (!workingConv) {
      workingConv = {
        id: generateConversationId(),
        title: generateConversationTitle(text),
        messages: [userMessage],
        model: provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      workingConv = {
        ...workingConv,
        messages: [...(workingConv.messages || []), userMessage],
        updatedAt: new Date().toISOString(),
      };
    }

    setCurrentConversation(workingConv);
    setChatInput("");
    setChatBusy(true);

    try {
      const snippet = (chapterText || "").slice(0, 1500);
      const instructionsText = [
        `You are the DahTruth StoryLab writing assistant.`,
        `The user is working on a chapter titled "${chapterTitle || "Untitled Chapter"}".`,
        `When you suggest edits, please quote or clearly separate your suggested text so it can be copy-pasted into the manuscript.`,
        snippet
          ? `Here is an excerpt of the chapter for context:\n\n${snippet}`
          : `There is no chapter text yet; answer based on the question only.`,
      ].join("\n\n");

      const res = await rateLimiter.addToQueue(() =>
        runAssistant(text, "clarify", instructionsText, provider)
      );

      const replyText =
        (res && (res.result || res.text || res.output || res.data)) || "";

      const assistantMessage = {
        role: "assistant",
        content:
          replyText ||
          "I couldn't generate a response. Please try asking your question in a different way.",
        timestamp: new Date().toISOString(),
        id: Date.now() + 1,
      };

      const updatedConv = {
        ...workingConv,
        messages: [...workingConv.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      };

      setCurrentConversation(updatedConv);
      scheduleConversationSave(updatedConv);
    } catch (err) {
      console.error("Assistant chat error:", err);
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, there was an error reaching the assistant. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        id: Date.now() + 2,
      };
      const erroredConv = {
        ...workingConv,
        messages: [...workingConv.messages, errorMessage],
        updatedAt: new Date().toISOString(),
      };
      setCurrentConversation(erroredConv);
    } finally {
      setChatBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ----------------------- Render ----------------------- */

  if (!isOpen) return null;

  return (
    <>
      <section
        className="flex flex-col bg-white border-t-2 border-slate-300 shadow-lg overflow-hidden"
        style={{
          flex: "1 1 50%",
          minHeight: "300px",
        }}
      >
        {/* HEADER BAR */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2 min-w-0">
            {showHistory ? (
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 flex-shrink-0"
              >
                <ChevronLeft size={14} />
                Back to Chat
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 flex-shrink-0"
                  title="Start a new conversation"
                >
                  <Plus size={14} />
                  New
                </button>
                <button
                  type="button"
                  onClick={handleShowHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 flex-shrink-0"
                  title="View conversation history"
                >
                  <Clock size={14} />
                  History
                  {conversationList.length > 0 && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      {conversationList.length}
                    </span>
                  )}
                </button>
              </>
            )}
            {currentConversation && !showHistory && (
              <span className="ml-3 text-sm font-semibold text-slate-700 truncate">
                {currentConversation.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              {provider === "anthropic" ? "Claude" : "GPT"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Close assistant"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT: chat OR history */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {showHistory ? (
            /* HISTORY VIEW */
            <div className="flex-1 overflow-y-auto p-4">
              {conversationLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading conversation...</p>
                </div>
              ) : conversationList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No saved conversations yet</p>
                  <p className="text-xs mt-1">
                    Start chatting to create your first one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-w-4xl mx-auto">
                  {conversationList.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv.id)}
                      className="cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition group flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {conv.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>{conv.messageCount} messages</span>
                          <span>·</span>
                          <span>{conv.model === "anthropic" ? "Claude" : "GPT"}</span>
                          {conv.updatedAt && (
                            <>
                              <span>·</span>
                              <span>{formatRelativeTime(conv.updatedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-rose-100 transition ml-2"
                        title="Delete conversation"
                      >
                        <X size={14} className="text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* CHAT VIEW */
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="max-w-4xl mx-auto w-full space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare
                        size={32}
                        className="mx-auto mb-3 opacity-30"
                      />
                      <p className="text-sm font-medium mb-3">
                        Start a conversation
                      </p>
                      <div className="text-xs space-y-1.5 max-w-md mx-auto text-slate-400">
                        <p>"Help me tighten this opening."</p>
                        <p>"Is this dialogue natural?"</p>
                        <p>"Suggest a stronger ending."</p>
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={
                        msg.role === "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[75%] rounded-2xl rounded-tr-sm bg-indigo-50 border border-indigo-100 px-4 py-2.5 text-sm"
                            : "max-w-[75%] rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm"
                        }
                      >
                        <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                          {msg.content}
                        </div>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleSendToCompose(msg.content)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition font-medium"
                              title="Insert this text into your manuscript"
                            >
                              <FileEdit size={12} />
                              Send to Compose
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.content)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatBusy && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* INPUT AREA */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="border-t border-slate-200 p-3 flex-shrink-0 bg-slate-50/50"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="Ask a question or paste text to discuss..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={chatBusy}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatBusy}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                    >
                      {chatBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Send
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Enter to send · Shift+Enter for new line
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
          style={{
            animation: "slideUpFade 0.2s ease-out",
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} />
          ) : (
            <Check size={16} />
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}

