// src/components/storylab/StoryLabLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

function DarkModeToggle() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("theme-dark")
  );
  
