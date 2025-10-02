import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import PageShell from "./PageShell";
import AeroBanner from "./AeroBanner";

const linkStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "#0A2540",
  border: "1px solid rgba(10,37,64,0.10)",
  background: "rgba(255,255,255,0.75)",
};

const activeStyle: React.CSSProperties = {
  ...linkStyle,
  border: "2px solid #1F3A5F",
  background: "#EAF2FB",
  fontWeight: 700,
};

export default function AppLayout(): JSX.Element {
  return (
    <PageShell>
      <AeroBanner
        size="md"
        title="StoryLab"
        subtitle="Write • Format • Publish"
        action={
          <nav style={{ display: "flex", gap: 8 }}>
            <NavLink to="/" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
              Home
            </NavLink>
            <NavLink
              to="/publishing"
              style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
            >
              Publishing
            </NavLink>
          </nav>
        }
      />
      {/* All nested routes render here */}
      <Outlet />
    </PageShell>
  );
}
