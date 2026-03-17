// src/routes/storylab/FictionRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const FictionModule = lazy(() => import("../../components/storylab/FictionModule"));

const Fallback = () => (
  <div className="min-h-[60vh] grid place-items-center">
    <div className="animate-pulse text-lg text-slate-400">Loading…</div>
  </div>
);

export default function FictionRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route index element={<FictionModule />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </Suspense>
  );
}
