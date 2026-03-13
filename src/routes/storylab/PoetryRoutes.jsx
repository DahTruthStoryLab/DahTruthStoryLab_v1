// src/routes/storylab/PoetryRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const PoetryLab = lazy(() => import("../../pages/storylab/PoetryLab"));
const PoetryLayout = lazy(() => import("../../components/storylab/PoetryLayout"));
const CraftLab = lazy(() => import("../../pages/storylab/poetry/CraftLab"));
const RevisionLab = lazy(() => import("../../pages/storylab/poetry/RevisionLab"));
const VoiceIdentity = lazy(() => import("../../pages/storylab/poetry/VoiceIdentity"));
const SequenceBuilder = lazy(() => import("../../pages/storylab/poetry/SequenceBuilder"));
const RemixLab = lazy(() => import("../../pages/storylab/poetry/RemixLab"));

const Fallback = () => (
  <div className="min-h-[60vh] grid place-items-center">
    <div className="animate-pulse text-lg text-slate-400">Loading…</div>
  </div>
);

export default function PoetryRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route index element={<PoetryLab />} />
        <Route element={<PoetryLayout />}>
          <Route path="craft" element={<CraftLab />} />
          <Route path="revision" element={<RevisionLab />} />
          <Route path="voice" element={<VoiceIdentity />} />
          <Route path="sequence" element={<SequenceBuilder />} />
          <Route path="remix" element={<RemixLab />} />
        </Route>
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </Suspense>
  );
}
