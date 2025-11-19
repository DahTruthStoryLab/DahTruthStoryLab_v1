import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const {
      type = "error", // "error" | "success" | "info"
      duration = 5000,
    } = options;

    setToasts((prev) => [...prev, { id, message, type }]);

    // auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - bottom right */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm rounded-lg border px-4 py-3 shadow-lg text-sm text-white
              ${
                toast.type === "error"
                  ? "bg-red-600/90 border-red-400/80"
                  : ""
              }
              ${
                toast.type === "success"
                  ? "bg-emerald-600/90 border-emerald-400/80"
                  : ""
              }
              ${
                toast.type === "info"
                  ? "bg-slate-700/90 border-slate-400/80"
                  : ""
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
