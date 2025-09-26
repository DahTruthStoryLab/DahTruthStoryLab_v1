// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe Amplify init (won’t crash if aws-exports.js is missing)
try {
  const { Amplify } = require("aws-amplify");
  const awsconfig = require("./aws-exports");
  Amplify.configure(awsconfig.default || awsconfig);
} catch (e) {
  console.log("Amplify not configured - continuing without backend");
}

const rootEl = document.getElementById("root");
const root = createRoot(rootEl);
root.render(<App />);
