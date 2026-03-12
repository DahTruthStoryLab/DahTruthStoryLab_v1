// src/routes/storylab/PoetryRoutes.jsx
import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const PoetryLab = lazy(() => import("../../pages/storylab/PoetryLab"));
const PoetryLayout = lazy(() => import("../../components/storylab/PoetryLayout"));
const CraftLab = lazy(() => import("../../pages/storylab/poetry/CraftLab"));
const RevisionLab = lazy(() => import("../../pages/storylab/poetry/RevisionLab"));
const VoiceIdentity = lazy(() => import("../../pages/storylab/poetry/VoiceIdentity"));
const SequenceBuilder = lazy(() => import("../../pages/storylab/poetry/SequenceBuilder"));
const RemixLab = lazy(() => import("../../pages/storylab/poetry/RemixLab"));

export default function PoetryRoutes() {
  return (
    <Routes>
      {/* /story-lab/poetry — landing hub */}
      <Route index element={<PoetryLab />} />

      {/* Sub-tools with sidebar layout */}
      <Route element={<PoetryLayout />}>
        <Route path="craft" element={<CraftLab />} />
        <Route path="revision" element={<RevisionLab />} />
        <Route path="voice" element={<VoiceIdentity />} />
        <Route path="sequence" element={<SequenceBuilder />} />
        <Route path="remix" element={<RemixLab />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

