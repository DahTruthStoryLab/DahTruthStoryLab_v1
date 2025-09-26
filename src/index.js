// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// ✅ Amplify
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports"; // make sure this file exists
Amplify.configure(awsconfig);

// Optional: global styles
// import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
