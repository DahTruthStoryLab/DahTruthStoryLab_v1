src/routes/storylab/PoetryRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PoetryLab from "../../pages/storylab/PoetryLab";

// Poetry subroutes (you already have these)
import RevisionLab from "../../components/storylab/poetry/RevisionLab";
import SequenceBuilder from "../../components/storylab/poetry/SequenceBuilder";
import CraftLab from "../../components/storylab/poetry/CraftLab";
import RemixLab from "../../components/storylab/poetry/RemixLab";
import VoiceIdentityLab from "../../components/storylab/poetry/VoiceIdentityLab";

export default function PoetryRoutes() {
  return (
    <Routes>
      {/* /story-lab/poetry */}
      <Route index element={<PoetryLab />} />

      {/* /story-lab/poetry/revision etc */}
      <Route path="revision" element={<RevisionLab />} />
      <Route path="sequence" element={<SequenceBuilder />} />
      <Route path="craft" element={<CraftLab />} />
      <Route path="remix" element={<RemixLab />} />
      <Route path="voice" element={<VoiceIdentityLab />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
