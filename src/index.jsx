// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import App from "./App";
import "./index.css";
import { AiProvider } from "./lib/AiProvider";

// Configure Amplify with your AWS settings
Amplify.configure(awsconfig);

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
              Please refresh the page. If the issue persists, check the browser console for the first red error.
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

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AiProvider>
        <App />
      </AiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
