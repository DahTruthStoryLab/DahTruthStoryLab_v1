// src/components/AuthorSetup.tsx
// First-time author onboarding modal

import React, { useState } from "react";

interface AuthorSetupProps {
  isOpen: boolean;
  onComplete: (name: string, email?: string) => Promise<void>;
  onLoginWithEmail?: (email: string) => Promise<boolean>;
}

const theme = {
  bg: "var(--brand-bg, #f8fafc)",
  surface: "var(--brand-surface, #ffffff)",
  border: "var(--brand-border, #e2e8f0)",
  text: "var(--brand-text, #0f172a)",
  subtext: "var(--brand-subtext, #64748b)",
  accent: "var(--brand-accent, #6366f1)",
  white: "var(--brand-white, #ffffff)",
  gold: "var(--brand-gold, #facc15)",
};

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    background: theme.white,
    borderRadius: 20,
    boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)",
    maxWidth: 480,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
    color: theme.white,
    padding: "32px 28px",
    textAlign: "center" as const,
  },
  body: {
    padding: "28px",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: theme.subtext,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    background: theme.white,
    color: theme.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    borderColor: theme.accent,
    boxShadow: `0 0 0 3px rgba(99, 102, 241, 0.15)`,
  },
  btn: {
    width: "100%",
    padding: "14px 20px",
    fontSize: 15,
    fontWeight: 600,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    transition: "transform 0.1s, box-shadow 0.2s",
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${theme.accent}, #4f46e5)`,
    color: theme.white,
    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
  },
  btnSecondary: {
    background: theme.white,
    color: theme.text,
    border: `1px solid ${theme.border}`,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
};

export default function AuthorSetup({
  isOpen,
  onComplete,
  onLoginWithEmail,
}: AuthorSetupProps): JSX.Element | null {
  const [mode, setMode] = useState<"setup" | "login">("setup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  if (!isOpen) return null;
  
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      await onComplete(name.trim(), email.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    
    if (!onLoginWithEmail) {
      setError("Login not available");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const found = await onLoginWithEmail(email.trim());
      
      if (!found) {
        setError("No account found with that email. Create a new one?");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            Welcome to DahTruth StoryLab
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, opacity: 0.9 }}>
            {mode === "setup"
              ? "Let's set up your author profile to get started"
              : "Sign in with your email to access your projects"}
          </p>
        </div>
        
        {/* Body */}
        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}
          
          {mode === "setup" ? (
            <form onSubmit={handleSetup}>
              <div style={{ marginBottom: 20 }}>
                <label style={styles.label}>Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How you want to be known as an author"
                  style={styles.input}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={styles.label}>
                  Email (optional, for cross-device access)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={styles.input}
                  disabled={isLoading}
                />
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 12,
                    color: theme.subtext,
                  }}
                >
                  Add your email to access your projects from any device.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                {isLoading ? "Setting up..." : "Start Writing →"}
              </button>
              
              {onLoginWithEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    marginTop: 12,
                  }}
                >
                  I already have an account
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 24 }}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={styles.input}
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                {isLoading ? "Signing in..." : "Sign In →"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode("setup");
                  setError("");
                }}
                style={{
                  ...styles.btn,
                  ...styles.btnSecondary,
                  marginTop: 12,
                }}
              >
                Create new account
              </button>
            </form>
          )}
        </div>
        
        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            background: theme.bg,
            borderTop: `1px solid ${theme.border}`,
            textAlign: "center",
            fontSize: 11,
            color: theme.subtext,
          }}
        >
          Your data is stored securely. We never share your information.
        </div>
      </div>
    </div>
  );
}

