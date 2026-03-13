// src/routes/storylab/PoetryRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PoetryLab from "../../pages/storylab/PoetryLab";
import PoetryLayout from "../../components/storylab/PoetryLayout";
import CraftLab from "../../pages/storylab/poetry/CraftLab";
import RevisionLab from "../../pages/storylab/poetry/RevisionLab";
import VoiceIdentity from "../../pages/storylab/poetry/VoiceIdentity";
import SequenceBuilder from "../../pages/storylab/poetry/SequenceBuilder";
import RemixLab from "../../pages/storylab/poetry/RemixLab";

export default function PoetryRoutes() {
  return (
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
  );
}
