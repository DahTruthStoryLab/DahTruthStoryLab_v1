// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App";
import "./index.css";
import { AiProvider } from "./lib/AiProvider";

// ---- Configure Amplify (safe) ----
try {
  // If aws-exports exists and is valid, this will work.
  // If not, we'll log a warning but keep the app running.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const awsconfig = require("./aws-exports").default || require("./aws-exports");
  if (awsconfig) {
    Amplify.configure(awsconfig);
    // Optional: log once so we know configuration happened
    // console.info("Amplify configured.");
  }
} catch (err) {
  console.warn(
    "[Amplify] aws-exports not found or invalid. Skipping Amplify.configure().",
    err
  );
}

// src/index.jsx (after Amplify.configure(awsconfig))
import { Auth, Logger } from 'aws-amplify';
Logger.LOG_LEVEL = 'DEBUG'; // TEMP: shows detailed auth logs in browser console

function describeAuthError(e) {
  const code = e?.code || e?.name || 'AuthError';
  switch (code) {
    case 'UserNotConfirmedException':
      return 'Your account is not confirmed. Check email for code.';
    case 'NotAuthorizedException':
      return 'Incorrect email or password.';
    case 'UserNotFoundException':
      return 'No account found for that email.';
    case 'PasswordResetRequiredException':
      return 'Password reset required.';
    default:
      return e?.message || 'Authentication failed.';
  }
}

async function testSignIn(email, password) {
  try {
    const user = await Auth.signIn(email, password);
    console.log('Signed in OK:', user);
    alert('Sign-in OK');
  } catch (e) {
    console.error('SIGN-IN ERROR:', e);
    alert(describeAuthError(e));
  }
}

// make available in the devtools console
window.testSignIn = testSignIn;

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

// Ensure root element exists
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element #root not found. Make sure public/index.html has <div id="root"></div>.');
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
