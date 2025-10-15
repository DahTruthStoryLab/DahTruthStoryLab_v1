import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
// If you *actually* use a user context, keep this import; otherwise delete the next line.
import { UserProvider } from "./state/UserProvider";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element #root not found. Make sure public/index.html has <div id="root"></div>.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* If you do NOT have a UserProvider, remove this wrapper */}
      <UserProvider>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
