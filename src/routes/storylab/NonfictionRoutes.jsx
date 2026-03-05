src/routes/storylab/NonfictionRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import NonFictionModule from "../../components/storylab/NonFictionModule";

export default function NonfictionRoutes() {
  return (
    <Routes>
      {/* /story-lab/nonfiction */}
      <Route index element={<NonFictionModule />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
