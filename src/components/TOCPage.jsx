// src/components/TOCPage.jsx
import React from "react";
import ComposePage from "./ComposePage";

/**
 * Thin wrapper so /toc goes to the same experience as /compose,
 * with Chapter Grid acting as the Table of Contents.
 */
export default function TOCPage() {
  return <ComposePage />;
}
