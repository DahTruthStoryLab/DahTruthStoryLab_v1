import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PoetryLab from "../../pages/storylab/PoetryLab";

export default function PoetryRoutes() {
  return (
    <Routes>
      {/* /story-lab/poetry */}
      <Route index element={<PoetryLab />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

