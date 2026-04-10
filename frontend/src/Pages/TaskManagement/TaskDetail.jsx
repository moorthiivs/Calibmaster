import React, { useContext, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Tag, Button, Descriptions, Table, Steps, Badge,
  message, Spin, Divider, Select, Tooltip, Space, Modal, Timeline
} from "antd";
import {
  ArrowLeftOutlined, SyncOutlined, EditOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/auth-context";
import config from "../../utils/config.json";
import TaskCalibrationDrawer from "./TaskCalibrationDrawer";

const { Option } = Select;
const BASE_URL = config.Calibmaster.URL;

const STATUS_STEPS = [
  { key: "assigned",    title: "Assigned",     icon: <ClockCircleOutlined /> },
  { key: "in_progress", title: "In Progress",  icon: <PlayCircleOutlined /> },
  { key: "completed",   title: "Completed",    icon: <CheckCircleOutlined /> },
];

const STATUS_TRANSITIONS = {
  assigned:    ["in_progress"],
  in_progress: ["completed"],
  completed:   [],
};

const CALIBRATION_STATUS_COLOR = {
  pending:     "default",
  in_progress: "processing",
  completed:   "success",
};

export default function TaskDetail() {
  const { task_id } = useParams();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localCounts, setLocalCounts] = useState(0);

  // Calibration Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchLocalMeasurements = useCallback(async () => {
    if (window.electron?.db) {
       const counts = await window.electron.db.getPendingMeasurements(task_id);
       setLocalCounts(counts.length);
    }
  }, [task_id]);

  useEffect(() => {
    fetchLocalMeasurements();
  }, [fetchLocalMeasurements]);

  // ─── Load task ─────────────────────────────────────────────────────────────
  const loadTask = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/tasks/${task_id}`, {
        headers: { Authorization: "Bearer " + auth.token },
      });
      const data = await res.json();
      if (res.ok) {
        setTask(data.data);
      } else {
        if (window.electron?.db) {
           const localData = await window.electron.db.getTask(task_id);
           if (localData) {
              setTask(localData);
              message.info("Working from Local Offline Data");
           } else {
              message.error("Task not found online or locally");
           }
        } else {
           message.error(data.message || "Failed to load task");
        }
      }
    } catch {
       if (window.electron?.db) {
          const localData = await window.electron.db.getTask(task_id);
          if (localData) {
             setTask(localData);
             message.warning("Network offline. Loaded from Local Storage.");
          } else {
             message.error("Network error and no local data found.");
          }
       } else {
          message.error("Network error while loading task");
       }
    } finally {
      setLoading(false);
    }
  }, [task_id, auth.token]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // ─── Status update ─────────────────────────────────────────────────────────
  async function handleStatusUpdate(newStatus) {
    Modal.confirm({
      title: `Move task to "${newStatus.replace("_", " ")}"?`,
      icon: <ExclamationCircleOutlined />,
      content: "This will update the task status and mark it as pending sync.",
      okText: "Update",
      onOk: async () => {
        setStatusUpdating(true);
        try {
          const res = await fetch(`${BASE_URL}/api/tasks/${task_id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            },
            body: JSON.stringify({ status: newStatus, version: task.version }),
          });
          const data = await res.json();
          if (res.ok) {
            message.success(`Task moved to ${newStatus.replace("_", " ")}`);
            setTask(data.data);
          } else {
            message.error(data.message || "Status update failed");
          }
        } catch {
          message.error("Network error");
        } finally {
          setStatusUpdating(false);
        }
      },
    });
  }

  // ─── Sync ──────────────────────────────────────────────────────────────────
  async function handleSync() {
    if (!window.electron?.db) {
        message.error("Desktop app required for SQLite sync");
        return;
    }
    
    setSyncing(true);
    try {
      const pending = await window.electron.db.getPendingMeasurements(task_id);
      
      if (pending.length === 0) {
        message.info("No local measurements to sync");
        return;
      }

      const payload = {
        user_id: auth.userId,
        changes: pending.map(p => ({
            task_item_id: p.task_item_id,
            calibration_data: p.payload
        }))
      };

      const res = await fetch(`${BASE_URL}/api/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const ids = pending.map(p => p.id);
        await window.electron.db.markAsSynced(ids);
        
        message.success(`Successfully synced ${pending.length} records to server`);
        loadTask();
        fetchLocalMeasurements();
      } else {
        const errorData = await res.json();
        message.error(errorData.message || "Sync failed");
      }
    } catch (err) {
      console.error("Sync error:", err);
      message.error("Network error during synchronization");
    } finally {
      setSyncing(false);
    }
  }

  // ─── Task items table columns ──────────────────────────────────────────────
  const itemColumns = [
    {
      title: "#",
      render: (_, __, i) => i + 1,
      width: 50,
    },
    {
      title: "Instrument",
      key: "instrument",
      render: (_, rec) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {rec.instrumentType?.instrument_full_name || rec.srfItem?.instrument_name || `ID: ${rec.instrument_type_id}`}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            S/N: {rec.srfItem?.serial_no || "—"} | Model: {rec.srfItem?.model || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Calibration Required",
      dataIndex: "calibration_required",
      width: 160,
      render: (v) => (
        <Tag color={v ? "blue" : "default"}>{v ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Calibration Status",
      dataIndex: "calibration_status",
      width: 150,
      render: (s) => (
        <Badge
          status={CALIBRATION_STATUS_COLOR[s] || "default"}
          text={s ? s.replace("_", " ") : "—"}
          style={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (n) => n || <span style={{ color: "#bbb" }}>—</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => {
        const canCalibrate = task.status === "in_progress" && record.calibration_status !== "completed";
        return (
          <Button
            type="link"
            icon={<EditOutlined />}
            disabled={!canCalibrate}
            onClick={() => {
              setSelectedItem(record);
              setDrawerVisible(true);
            }}
          >
            {record.calibration_status === "completed" ? "Edit" : "Calibrate"}
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" tip="Loading task..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/tasks")}>
          Back to Tasks
        </Button>
        <p style={{ marginTop: 24, color: "#cf1322" }}>Task not found.</p>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === task.status);
  const allowedNextStatuses = STATUS_TRANSITIONS[task.status] || [];
  const completedItems = (task.items || []).filter((i) => i.calibration_status === "completed").length;
  const totalItems = (task.items || []).length;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      {/* Back + Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/tasks")}>
            Back
          </Button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1f3864" }}>
            {task.task_name}
          </h2>
        </div>

        <Space>
          {/* Status Transition Buttons */}
          {allowedNextStatuses.map((s) => (
            <Button
              key={s}
              type="primary"
              icon={s === "completed" ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
              loading={statusUpdating}
              onClick={() => handleStatusUpdate(s)}
              style={{
                backgroundColor: s === "completed" ? "#52c41a" : "#fa8c16",
                borderColor: s === "completed" ? "#52c41a" : "#fa8c16",
              }}
            >
              Mark {s.replace("_", " ")}
            </Button>
          ))}

          {/* Sync Button */}
          <Button
            type="primary"
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            disabled={task.sync_status === "synced" && localCounts === 0}
            style={
              localCounts > 0
                ? { borderColor: "#faad14", color: "#faad14" }
                : {}
            }
          >
            {localCounts > 0 ? `Sync Now (${localCounts})` : "Synced"}
          </Button>
        </Space>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: 20 }}>
        <Steps
          current={currentStepIndex}
          items={STATUS_STEPS.map((s) => ({ title: s.title, icon: s.icon }))}
        />
      </Card>

      {/* Task Details */}
      <Card title="Task Details" style={{ marginBottom: 20 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Task ID">#{task.task_id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={
                task.status === "completed"
                  ? "green"
                  : task.status === "in_progress"
                  ? "orange"
                  : "blue"
              }
              style={{ fontWeight: 600 }}
            >
              {task.status?.replace("_", " ").toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Assigned Engineer">
            {task.engineer?.name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Sync Status">
            <Badge
              status={task.sync_status === "synced" ? "success" : "warning"}
              text={task.sync_status === "synced" ? "Synced" : "Pending Sync"}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag
              color={
                task.priority === "high"
                  ? "red"
                  : task.priority === "medium"
                  ? "orange"
                  : "green"
              }
            >
              {task.priority?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Version">v{task.version}</Descriptions.Item>
          <Descriptions.Item label="Assigned Date">
            {task.assigned_date ? new Date(task.assigned_date).toLocaleString("en-IN") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {task.due_date ? (
              <span
                style={{
                  color: new Date(task.due_date) < new Date() && task.status !== "completed"
                    ? "#cf1322"
                    : "inherit",
                  fontWeight: new Date(task.due_date) < new Date() ? 600 : 400,
                }}
              >
                {new Date(task.due_date).toLocaleDateString("en-IN")}
              </span>
            ) : (
              "—"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {task.description || <span style={{ color: "#bbb" }}>No description</span>}
          </Descriptions.Item>
          <Descriptions.Item label="Calibration Progress" span={2}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  height: 12,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%`,
                    backgroundColor: "#52c41a",
                    borderRadius: 6,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <span style={{ fontWeight: 600, color: "#1f3864", whiteSpace: "nowrap" }}>
                {completedItems} / {totalItems} done
              </span>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Instruments Table */}
      <Card
        title={
          <span style={{ fontWeight: 600, color: "#1f3864" }}>
            Instruments ({totalItems})
          </span>
        }
        style={{ marginBottom: 20 }}
      >
        <Table
          dataSource={task.items || []}
          columns={itemColumns}
          rowKey="task_item_id"
          size="middle"
          pagination={false}
          locale={{ emptyText: "No instruments in this task." }}
        />
      </Card>

      {/* Calibration Data */}
      {task.calibration_data && task.calibration_data.length > 0 && (
        <Card title="Calibration Data Recorded" style={{ marginBottom: 20 }}>
          <Table
            dataSource={task.calibration_data}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: "ID", dataIndex: "id", width: 70 },
              {
                title: "Reading Value",
                dataIndex: "reading_value",
                render: (v) => (
                  <pre style={{ margin: 0, fontSize: 11 }}>
                    {v ? JSON.stringify(v, null, 2) : "—"}
                  </pre>
                ),
              },
              { title: "Remarks", dataIndex: "remarks", render: (v) => v || "—" },
              {
                title: "Date",
                dataIndex: "calibration_date",
                render: (d) => (d ? new Date(d).toLocaleString("en-IN") : "—"),
              },
              {
                title: "Synced",
                dataIndex: "is_synced",
                render: (v) => (
                  <Badge status={v ? "success" : "warning"} text={v ? "Yes" : "Pending"} />
                ),
              },
            ]}
          />
        </Card>
      )}



      {/* Calibration Drawer */}
      <TaskCalibrationDrawer
        visible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSaveSuccess={() => {
          loadTask();
        }}
      />
    </div>
  );
}
