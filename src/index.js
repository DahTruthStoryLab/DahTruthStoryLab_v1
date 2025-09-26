// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // ← use HashRouter for now
import App from "./App";

// Global styles
import "./index.css";

// Optional Amplify config (safe if aws-exports is missing)
try {
  const { Amplify } = require("aws-amplify");
  const awsconfig = require("./aws-exports");
  Amplify.configure(awsconfig.default || awsconfig);
} catch {
  console.log("AWS Amplify not configured - running without backend");
}

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

