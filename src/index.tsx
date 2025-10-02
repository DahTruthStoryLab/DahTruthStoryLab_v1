import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element #root not found. Make sure public/index.html has <div id="root"></div>.');
}

const root = ReactDOM.createRoot(rootEl as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
