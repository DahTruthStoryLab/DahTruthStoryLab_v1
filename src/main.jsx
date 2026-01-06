import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from "./components/ToastProvider.jsx";
import { initStorage } from "./lib/storage";

// Initialize storage before rendering the app
// This ensures IndexedDB data is loaded into memory cache
initStorage().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </React.StrictMode>
  );
}).catch((err) => {
  console.error("Storage init failed:", err);
  // Render anyway - localStorage will still work
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </React.StrictMode>
  );
});
