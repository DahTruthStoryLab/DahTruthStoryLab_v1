// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

/* ---- TEMP: direct (non-lazy) imports to simplify debugging ---- */
import LandingPage          from "./components/LandingPage";
import RegistrationPage     from "./components/RegistrationPage";
import SignInPage           from "./components/SignInPage";
import Dashboard            from "./components/Dashboard";
import TOCPage              from "./components/TOCPage";
import TOCPage2             from "./components/TOCPage2";
import ProjectPage          from "./components/ProjectPage";
import WhoAmI               from "./components/WhoAmI";
import WriteSection         from "./components/WriteSection";
import StoryLab             from "./lib/storylab/StoryLab";
import StoryPromptsWorkshop from "./lib/storylab/StoryPromptsWorkshop";
import Calendar             from "./components/Calendar";
import Profile              from "./components/Profile";

/* ---- Error boundary so crashes don’t blank the screen ---- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError
