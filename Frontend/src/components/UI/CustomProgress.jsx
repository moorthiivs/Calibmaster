import React from 'react';
import { Steps, ConfigProvider } from 'antd';
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  AuditOutlined,
  FileProtectOutlined,
  FilePdfOutlined,
  TruckOutlined,
  MailOutlined,
  SolutionOutlined,
  DollarOutlined,
} from '@ant-design/icons';

// Per-status color palette — each status has its own identity
const STATUS_COLOR = {
  "Not Calibrated": { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B", icon: "#EF4444" },
  "Calibrated": { bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A", icon: "#3B82F6" },
  "Review Pending": { bg: "#FFEDD5", border: "#F97316", text: "#7C2D12", icon: "#F97316" },
  "Auth Pending": { bg: "#FEF9C3", border: "#EAB308", text: "#713F12", icon: "#EAB308" },
  "Auth Approved": { bg: "#D1FAE5", border: "#10B981", text: "#064E3B", icon: "#10B981" },
  "Report Generated": { bg: "#DCFCE7", border: "#22C55E", text: "#14532D", icon: "#22C55E" },
  "Dispatched": { bg: "#E0E7FF", border: "#6366F1", text: "#312E81", icon: "#6366F1" },
  "Report Dispatched": { bg: "#CFFAFE", border: "#06B6D4", text: "#164E63", icon: "#06B6D4" },
  "Invoice Generated": { bg: "#F3E8FF", border: "#A855F7", text: "#4C1D95", icon: "#A855F7" },
  "Payment Done": { bg: "#FCE7F3", border: "#EC4899", text: "#831843", icon: "#EC4899" },
};

const DEFAULT_COLOR = { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151", icon: "#9CA3AF" };

const getIcon = (status) => {
  switch (status) {
    case "Not Calibrated": return <ExperimentOutlined />;
    case "Calibrated": return <SafetyCertificateOutlined />;
    case "Review Pending": return <FileSearchOutlined />;
    case "Auth Pending": return <AuditOutlined />;
    case "Auth Approved": return <FileProtectOutlined />;
    case "Report Generated": return <FilePdfOutlined />;
    case "Dispatched": return <TruckOutlined />;
    case "Report Dispatched": return <MailOutlined />;
    case "Invoice Generated": return <SolutionOutlined />;
    case "Payment Done": return <DollarOutlined />;
    default: return null;
  }
};

const CustomProgress = ({ current, options }) => {
  const currentStep = options.indexOf(current);

  const items = options.map((status, idx) => {
    const isActive = status === current;
    const isDone = idx < currentStep;
    const isPending = idx > currentStep;

    // Each status always gets its own color
    const col = STATUS_COLOR[status] || DEFAULT_COLOR;

    return {
      title: (
        <span
          style={{
            fontSize: "13px",
            fontWeight: isActive ? 700 : isDone ? 600 : 500,
            color: isActive ? col.text : isDone ? col.text : "#94A3B8",
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.4,
            opacity: isPending ? 0.75 : 1,
          }}
        >
          {status}
        </span>
      ),
      description: isActive ? (
        <span
          style={{
            display: "inline-block",
            marginTop: 4,
            fontSize: "10.5px",
            fontWeight: 700,
            color: col.icon,
            backgroundColor: col.bg,
            border: `1px solid ${col.border}`,
            borderRadius: "999px",
            padding: "3px 10px",
            letterSpacing: "0.06em",
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          ● ACTIVE
        </span>
      ) : null,
      icon: (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            // Active: bright filled, Done: tinted with its own color, Pending: muted gray
            backgroundColor: isActive ? col.bg : isDone ? col.bg : "#F8FAFC",
            border: `2px solid ${isActive ? col.border : isDone ? col.border : "#CBD5E1"}`,
            color: isActive ? col.icon : isDone ? col.icon : "#94A3B8",
            // Active gets a colored glow ring
            boxShadow: isActive
              ? `0 0 0 4px ${col.border}28, 0 2px 8px 0 ${col.border}30`
              : isDone
                ? `0 1px 4px 0 ${col.border}25`
                : "none",
            transition: "all 0.25s ease",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {getIcon(status)}
        </div>
      ),
    };
  });

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%)",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 24px 0 rgba(30,58,138,0.07)",
        padding: "20px 24px 18px",
        margin: "16px 0",
        overflowX: "auto",
      }}
    >
      {/* Header label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#64748B",
          fontFamily: "'Inter', sans-serif",
          marginBottom: 18,
        }}
      >
        <span style={{ display: "inline-block", width: 10, height: 2, background: "#D1D5DB", borderRadius: 4 }} />
        Calibration Workflow
        <span style={{ display: "inline-block", flex: 1, height: 1, background: "#F3F4F6" }} />
      </div>

      <ConfigProvider
        theme={{
          token: {
            fontFamily: "'Inter', sans-serif",
            colorPrimary: "#1677ff",
          },
          components: {
            Steps: {
              titleLineHeight: 1.4,
              descriptionMaxWidth: 150,
            },
          },
        }}
      >
        <Steps
          current={currentStep}
          labelPlacement="vertical"
          responsive={false}
          items={items}
          style={{ minWidth: options.length * 100 }}
        />
      </ConfigProvider>
    </div>
  );
};

export default CustomProgress;
