// src/components/SyncStatus.tsx
// Shows the current sync status (saving, saved, error, offline)

import React, { useEffect, useState } from "react";
import type { SyncStatus as SyncStatusType } from "../types/project";

interface SyncStatusProps {
  status: SyncStatusType;
  lastSyncedAt?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  SyncStatusType,
  { icon: string; label: string; color: string; bgColor: string; animate?: boolean }
> = {
  idle: {
    icon: "○",
    label: "Ready",
    color: "#94a3b8",
    bgColor: "transparent",
  },
  syncing: {
    icon: "◐",
    label: "Saving...",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    animate: true,
  },
  saved: {
    icon: "✓",
    label: "Saved",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
  error: {
    icon: "!",
    label: "Save failed",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  offline: {
    icon: "◇",
    label: "Offline",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
};

export default function SyncStatus({
  status,
  lastSyncedAt,
  showLabel = true,
  size = "md",
}: SyncStatusProps): JSX.Element {
  const config = STATUS_CONFIG[status];
  const [rotation, setRotation] = useState(0);
  
  // Animate the syncing icon
  useEffect(() => {
    if (!config.animate) return;
    
    const interval = setInterval(() => {
      setRotation((r) => (r + 45) % 360);
    }, 150);
    
    return () => clearInterval(interval);
  }, [config.animate]);
  
  const formatLastSynced = () => {
    if (!lastSyncedAt) return "";
    
    try {
      const date = new Date(lastSyncedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };
  
  const sizeStyles = {
    sm: {
      container: {
        padding: "3px 8px",
        fontSize: 10,
        gap: 4,
      },
      icon: {
        width: 12,
        height: 12,
        fontSize: 10,
      },
    },
    md: {
      container: {
        padding: "5px 10px",
        fontSize: 11,
        gap: 6,
      },
      icon: {
        width: 16,
        height: 16,
        fontSize: 11,
      },
    },
  };
  
  const s = sizeStyles[size];
  
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        background: config.bgColor,
        border: `1px solid ${config.color}30`,
        ...s.container,
      }}
      title={
        status === "saved" && lastSyncedAt
          ? `Last saved: ${formatLastSynced()}`
          : config.label
      }
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: config.color,
          fontWeight: 700,
          transform: config.animate ? `rotate(${rotation}deg)` : undefined,
          transition: config.animate ? undefined : "transform 0.2s",
          ...s.icon,
        }}
      >
        {config.icon}
      </span>
      
      {showLabel && (
        <span
          style={{
            color: config.color,
            fontWeight: 500,
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact version for toolbars
export function SyncDot({
  status,
}: {
  status: SyncStatusType;
}): JSX.Element {
  const config = STATUS_CONFIG[status];
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    if (status === "syncing") {
      setPulse(true);
    } else {
      setPulse(false);
    }
  }, [status]);
  
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: 999,
        background: config.color,
        animation: pulse ? "pulse 1s infinite" : undefined,
      }}
      title={config.label}
    />
  );
}

