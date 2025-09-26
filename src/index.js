// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// (Optional) Amplify – safe configure
try {
  const { Amplify } = require("aws-amplify");
  const awsconfig = require("./aws-exports");
  Amplify.configure(awsconfig.default || awsconfig);
} catch (e) {
  console.log("Amplify not configured (ok for now)");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
