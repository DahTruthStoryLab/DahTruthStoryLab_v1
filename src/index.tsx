// src/main.tsx (or src/index.tsx)
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

// If you use global providers, uncomment and import them:
// import { UserProvider } from "./state/UserProvider";
// import { DndProvider } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element #root not found. Ensure public/index.html has <div id="root"></div>.');
}

createRoot(container).render(
  <React.StrictMode>
    {/* Uncomment providers here if your app expects them at the top level */}
    {/* <UserProvider> */}
    {/*   <DndProvider backend={HTML5Backend}> */}
        <Router>
          <React.Suspense fallback={<div />}>
            <App />
          </React.Suspense>
        </Router>
    {/*   </DndProvider> */}
    {/* </UserProvider> */}
  </React.StrictMode>
);
