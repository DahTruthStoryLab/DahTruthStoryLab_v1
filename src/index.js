// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // ← TEMP: HashRouter to bypass rewrite quirks
import App from "./App";
import "./index.css";

// Safe Amplify init (won’t crash if aws-exports is missing or misconfigured)
try {
  const { Amplify } = require("aws-amplify");
  const awsconfig = require("./aws-exports");
  Amplify.configure(awsconfig.default || awsconfig);
  console.log("[Amplify] configured");
} catch (e) {
  console.log("[Amplify] not configured – running without backend");
}

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
