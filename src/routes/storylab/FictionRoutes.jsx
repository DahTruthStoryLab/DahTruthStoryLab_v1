src/routes/storylab/FictionRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Use your existing module component
import FictionModule from "../../components/storylab/FictionModule";

export default function FictionRoutes() {
  return (
    <Routes>
      {/* /story-lab/fiction */}
      <Route index element={<FictionModule />} />

      {/* If you later add fiction subroutes, put them here */}
      {/* <Route path="characters" element={<CharacterLab />} /> */}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
