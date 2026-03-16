// src/routes/storylab/NonfictionRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NonfictionLayout from "../../components/storylab/NonfictionLayout";

const NonfictionLab = lazy(() => import("../../pages/storylab/NonfictionLab"));
const EssayBuilder = lazy(() => import("../../pages/storylab/nonfiction/EssayBuilder"));
const MemoirSceneMap = lazy(() => import("../../pages/storylab/nonfiction/MemoirSceneMap"));
const ResearchNotes = lazy(() => import("../../pages/storylab/nonfiction/ResearchNotes"));
const ArgumentThesis = lazy(() => import("../../pages/storylab/nonfiction/ArgumentThesis"));
const ChapterOutliner = lazy(() => import("../../pages/storylab/nonfiction/ChapterOutliner"));

const Fallback = () => (
  <div className="min-h-[60vh] grid place-items-center">
    <div className="animate-pulse text-lg text-slate-400">Loading…</div>
  </div>
);

export default function NonfictionRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route index element={<NonfictionLab />} />
        <Route element={<NonfictionLayout />}>
          <Route path="essay" element={<EssayBuilder />} />
          <Route path="memoir" element={<MemoirSceneMap />} />
          <Route path="research" element={<ResearchNotes />} />
          <Route path="argument" element={<ArgumentThesis />} />
          <Route path="chapter" element={<ChapterOutliner />} />
        </Route>
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </Suspense>
  );
}


