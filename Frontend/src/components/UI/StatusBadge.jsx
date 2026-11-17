import React from "react";
import {
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  FileDoneOutlined,
  ContainerOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const STATUS_CONFIG = {
  "Not Calibrated": {
    icon: <ExclamationCircleOutlined />,
    color: "#DC2626",
    bg: "#FEF2F2",
    accent: "#DC2626",
  },

  Calibrated: {
    icon: <SafetyCertificateOutlined />,
    color: "#2563EB",
    bg: "#EFF6FF",
    accent: "#2563EB",
  },

  "Review Pending": {
    icon: <SyncOutlined spin />,
    color: "#EA580C",
    bg: "#FFF7ED",
    accent: "#EA580C",
  },

  "Auth Pending": {
    icon: <ClockCircleOutlined />,
    color: "#D97706",
    bg: "#FFFBEB",
    accent: "#D97706",
  },

  "Auth Approved": {
    icon: <CheckCircleOutlined />,
    color: "#059669",
    bg: "#ECFDF5",
    accent: "#059669",
  },

  // ✅ KEY DIFFERENCE STARTS HERE

  "Report Generated": {
    icon: <FileTextOutlined />,
    color: "#166534",          // darker green
    bg: "#DCFCE7",
    accent: "#22C55E",         // bright green
  },

  "Report Dispatched": {
    icon: <FileDoneOutlined />,
    color: "#1E40AF",          // strong blue
    bg: "#DBEAFE",
    accent: "#3B82F6",         // bright blue
  },

  Dispatched: {
    icon: <SendOutlined />,
    color: "#4338CA",
    bg: "#E0E7FF",
    accent: "#6366F1",
  },

  "Invoice Generated": {
    icon: <ContainerOutlined />,
    color: "#6D28D9",
    bg: "#F3E8FF",
    accent: "#8B5CF6",
  },

  "Payment Done": {
    icon: <DollarCircleOutlined />,
    color: "#9D174D",
    bg: "#FCE7F3",
    accent: "#EC4899",
  },
};
const DEFAULT_CONFIG = {
  icon: null,
  color: "#4B5563",
  bg: "#F9FAFB",
};

// 📏 Size system
const SIZE_CONFIG = {
  sm: {
    fontSize: "12px",
    padding: "3px 10px",
    iconSize: "12px",
  },
  md: {
    fontSize: "13px",
    padding: "5px 12px",
    iconSize: "13px",
  },
  lg: {
    fontSize: "14px",
    padding: "6px 14px",
    iconSize: "14px",
  },
};

const StatusBadge = ({ value, size = "md" }) => {
  const cfg = STATUS_CONFIG[value] || DEFAULT_CONFIG;
  const sz = SIZE_CONFIG[size];

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: `6px 12px 6px 14px`,
        borderRadius: "999px",
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: sz.fontSize,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
        border: `1px solid ${cfg.accent}40`,
        cursor: "default",
      }}
    >

      {/* ICON */}
      {cfg.icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: sz.iconSize,
            color: cfg.accent,
          }}
        >
          {cfg.icon}
        </span>
      )}

      {/* TEXT */}
      {value}
    </span>
  );
};

export default StatusBadge;