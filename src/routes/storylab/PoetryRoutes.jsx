// src/routes/storylab/PoetryRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PoetryLayout from "../../components/storylab/PoetryLayout";

const PoetryLab = lazy(() => import("../../pages/storylab/PoetryLab"));
const CraftLab = lazy(() => import("../../pages/storylab/poetry/CraftLab"));
const RevisionLab = lazy(() => import("../../pages/storylab/poetry/RevisionLab"));
const VoiceIdentity = lazy(() => import("../../pages/storylab/poetry/VoiceIdentity"));
const SequenceBuilder = lazy(() => import("../../pages/storylab/poetry/SequenceBuilder"));
const RemixLab = lazy(() => import("../../pages/storylab/poetry/RemixLab"));

export default function PoetryRoutes() {
  return (
    <Suspense fallback={<div style={{padding:32}}>Loading...</div>}>
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
