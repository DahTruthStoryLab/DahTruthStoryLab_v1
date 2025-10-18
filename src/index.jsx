// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AiProvider } from "./lib/AiProvider";

// Import Amplify BEFORE configuring
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";

// NOW configure it
Amplify.configure(awsconfig);

// Optional: Enable debug logging for auth issues
import { Logger } from 'aws-amplify';
Logger.LOG_LEVEL = 'DEBUG';

/** Simple error boundary to avoid blank white screen */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: 520 }}>
            <h1 style={{ margin: 0 }}>Something went wrong.</h1>
            <p style={{ color: "#64748b" }}>
              Please refresh the page. If the issue persists, check the browser console.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Ensure root element exists
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element #root not found.');
}

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AiProvider>
        <App />
      </AiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
