import { useState, useEffect, useContext } from "react";
import { Modal, Table, Tag, Space, Card, Alert, Button } from "antd";
import {
  HistoryOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileSearchOutlined,
  ToolOutlined,
  CarryOutOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  FileProtectOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { convertDateFormat, formatDateTime } from "../../../utils/filters";
import StatusBadge from "../../UI/StatusBadge";

const ItemAuditModal = ({ open, onClose, item }) => {
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [auditTrail, setAuditTrail] = useState(null);
  const [error, setError] = useState(null);

  const srfItemId = item?.srf_item_id;

  const fetchAuditTrail = async () => {
    if (!srfItemId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${config.Calibmaster.URL}/api/srf/item-audit-trail/${srfItemId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth?.token,
        },
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        setAuditTrail(data.data);
      } else {
        throw new Error(data?.message || "Failed to load audit trail");
      }
    } catch (err) {
      console.error("Failed to load audit trail:", err);
      setError(err.message || "Failed to load audit trail data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && srfItemId) {
      fetchAuditTrail();
    } else {
      setAuditTrail(null);
      setError(null);
    }
  }, [open, srfItemId]);

  const columns = [
    {
      title: "Milestone Stage",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (title, record) => {
        let icon = <InfoCircleOutlined className="text-slate-400" />;
        let iconBg = "bg-slate-100 text-slate-600 border-slate-200";

        if (record.key === "srf_created") {
          icon = <FileSearchOutlined />;
          iconBg = "bg-blue-50 text-blue-600 border-blue-200";
        } else if (record.key === "item_added") {
          icon = <ToolOutlined />;
          iconBg = "bg-teal-50 text-teal-600 border-teal-200";
        } else if (record.key === "result_entry") {
          icon = <CarryOutOutlined />;
          iconBg = "bg-amber-50 text-amber-600 border-amber-200";
        } else if (record.key === "certificate_generated") {
          icon = <SafetyCertificateOutlined />;
          iconBg = "bg-purple-50 text-purple-600 border-purple-200";
        } else if (record.key === "certificate_review") {
          icon = <AuditOutlined />;
          iconBg = "bg-indigo-50 text-indigo-600 border-indigo-200";
        } else if (record.key === "certificate_authorization") {
          icon = <FileProtectOutlined />;
          iconBg = "bg-emerald-50 text-emerald-600 border-emerald-200";
        }

        return (
          <div className="flex items-start gap-3 py-1">
            <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-sm mt-0.5 ${iconBg}`}>
              {icon}
            </span>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 text-[13px] block leading-tight">{title}</span>
              <span className="text-[12px] text-slate-500 block mt-0.5 leading-snug">{record.description}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Selected Date (Operational)",
      dataIndex: "operational_date",
      key: "operational_date",
      width: 175,
      align: "center",
      render: (date) =>
        date ? (
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[13px] font-medium text-slate-700 bg-slate-100/90 border border-slate-200/90 px-2.5 py-0.5 rounded-md shadow-2xs">
              {convertDateFormat(date)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 font-normal">Operational Date</span>
          </div>
        ) : (
          <span className="text-[13px] text-slate-400">-</span>
        ),
    },
    {
      title: "Real-Time System Timestamp",
      dataIndex: "system_datetime",
      key: "system_datetime",
      width: 250,
      align: "center",
      render: (dt) =>
        dt ? (
          <div className="flex flex-col items-center justify-center py-1">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-900 bg-indigo-50/90 border border-indigo-200/90 px-3 py-1 rounded-md shadow-2xs">
              <ClockCircleOutlined className="text-indigo-600 text-xs" />
              {formatDateTime(dt)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200/60">
              <CheckCircleOutlined className="text-[10px]" /> Exact Server Clock
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-slate-400 italic">Not recorded / Pending</span>
        ),
    },
    {
      title: "Action By",
      dataIndex: "user_name",
      key: "user_name",
      width: 165,
      align: "center",
      render: (user) =>
        user && user !== "N/A" ? (
          <div className="inline-flex items-center gap-1.5 text-[13px] text-slate-700 font-medium">
            <UserOutlined className="text-slate-400 text-xs" />
            <span>{user}</span>
          </div>
        ) : (
          <span className="text-[13px] text-slate-400">-</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (status, record) => {
        let tagClass = "bg-slate-100 text-slate-600 border-slate-200";
        let label = status;

        if (status === "COMPLETED" || status === "APPROVED") {
          tagClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          label = status === "APPROVED" ? "Approved" : "Completed";
        } else if (status === "REJECTED") {
          tagClass = "bg-rose-50 text-rose-700 border-rose-200";
          label = "Rejected";
        } else if (status === "PENDING" || status === "IN_PROGRESS") {
          tagClass = "bg-amber-50 text-amber-700 border-amber-200";
          label = "Pending";
        } else if (status === "NOT_REACHED") {
          tagClass = "bg-slate-100 text-slate-600 border-slate-200";
          label = "Upcoming";
        }

        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`inline-block text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${tagClass}`}>
              {label}
            </span>
            {record.attempts && record.attempts.length > 1 && (
              <span className="text-[11px] text-amber-600 font-medium">
                ({record.attempts.length} attempts)
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const instrumentName =
    item?.intrument_type?.instrument?.instrument_name ||
    item?.instrument_name ||
    item?.intrument_type?.instrument_full_name ||
    "Instrument";

  const srfNumber = item?.srf?.srf_number || item?.srf_number || "-";
  const inwardNo = item?.inward_no || "-";
  const serialNo = item?.serial_no || "-";
  const status = item?.status || "Not Calibrated";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      maskClosable={false}
      wrapClassName="audit-modal-wrap"
      getContainer={() => document.body}
      footer={[
        <Button key="refresh" icon={<SyncOutlined />} onClick={fetchAuditTrail} loading={loading} className="font-medium text-[13px] h-9 rounded-lg">
          Refresh
        </Button>,
        <Button key="close" type="primary" onClick={onClose} className="font-semibold text-[13px] h-9 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 border-none shadow-sm">
          Close
        </Button>,
      ]}
      width={1040}
      centered
      destroyOnClose
      title={
        <div className="flex items-center justify-between flex-wrap gap-2 pr-6 py-0.5">
          <Space align="center" size="middle">
            <span className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-lg shadow-2xs">
              <HistoryOutlined />
            </span>
            <div>
              <span className="text-[16px] font-bold text-slate-900 block leading-tight">
                Lifecycle Audit Trail & System Timestamps
              </span>
              <span className="text-[12px] text-slate-500 font-normal">
                Real-time server clock vs. operational dates for ISO/IEC 17025 compliance
              </span>
            </div>
          </Space>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs">
            <ClockCircleOutlined /> Format: DD/MM/YYYY hh:mm A
          </span>
        </div>
      }
    >
      {/* Container with stopped event propagation to prevent text selection from scrolling background table */}
      <div
        className="audit-modal-content-wrapper py-2 space-y-4"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Item Context Metadata Bar */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 items-center">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">SRF Number</span>
              <span className="font-semibold text-slate-900 text-[13px] block mt-0.5">{srfNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Inward No</span>
              <span className="font-semibold text-blue-600 text-[13px] block mt-0.5">{inwardNo}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Instrument</span>
              <span className="font-semibold text-slate-900 text-[13px] truncate block mt-0.5" title={instrumentName}>
                {instrumentName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Serial No</span>
              <span className="font-medium text-slate-700 text-[13px] block mt-0.5">{serialNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">Status</span>
              <div className="mt-1">
                {item?.status ? (
                  <StatusBadge value={item.status} size="sm" />
                ) : (
                  <span className="text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            message="Error Loading Audit Trail"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" danger onClick={fetchAuditTrail}>
                Retry
              </Button>
            }
          />
        )}

        {/* Milestone Stages Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
          <Table
            size="small"
            bordered
            pagination={false}
            loading={loading}
            dataSource={auditTrail?.milestones || []}
            rowKey="key"
            columns={columns}
            className="audit-trail-custom-table"
          />
        </div>

        {/* Workflow Activity Log & Past Cycles (if any) */}
        {auditTrail?.history && auditTrail.history.length > 0 && (
          <Card
            size="small"
            className="border-slate-200 rounded-xl bg-slate-50/50 shadow-2xs"
            title={
              <span className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                <ExclamationCircleOutlined className="text-amber-500" />
                Workflow Activity Log & Past Approval Cycles ({auditTrail.history.length})
              </span>
            }
          >
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditTrail.history.map((h, i) => (
                <div
                  key={h.id || i}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag
                        color={h.action === "APPROVED" ? "green" : h.action === "REJECTED" ? "red" : "blue"}
                        className="text-[10px] font-semibold uppercase m-0 px-2 py-0.5 rounded-full"
                      >
                        {h.action}
                      </Tag>
                      <span className="font-semibold text-slate-800 text-[12px]">{h.stage}</span>
                      <span className="text-slate-500 text-[12px]">by {h.actedByUser?.name || "System"}</span>
                    </div>
                    {h.remarks && (
                      <div className="text-slate-600 text-[12px] bg-slate-50 px-2.5 py-1 rounded border border-slate-100 mt-1">
                        <span className="font-medium text-slate-700">Remarks: </span>
                        {h.remarks}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] font-medium text-slate-700 block">
                      {formatDateTime(h.createdAt)}
                    </span>
                    <span className="text-[10px] text-slate-400">Exact System Clock</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <style>{`
        /* Prevent background scroll when clicking or dragging to select text */
        .audit-modal-wrap {
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
          touch-action: pan-y !important;
        }

        .audit-modal-wrap .ant-modal-mask {
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        .audit-modal-content-wrapper {
          user-select: text !important;
          -webkit-user-select: text !important;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          letter-spacing: -0.01em;
        }

        .audit-modal-content-wrapper * {
          font-family: inherit !important;
        }

        /* Clean Table Styling */
        .audit-trail-custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 10px 14px !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }

        .audit-trail-custom-table .ant-table-tbody > tr > td {
          padding: 10px 14px !important;
          font-size: 13px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .audit-trail-custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc !important;
        }
      `}</style>
    </Modal>
  );
};

export default ItemAuditModal;
