import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, Tag, Button, Input, Select, Space, Tooltip, Badge,
  Statistic, Row, Col, Card, message, Popconfirm, notification,
  Modal
} from "antd";
import {
  PlusOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined,
  SyncOutlined, CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined,
  CloudDownloadOutlined, LaptopOutlined, DatabaseOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/auth-context";
import config from "../../utils/config.json";
import OfflineTable from "./OfflineTable";

const { Search } = Input;
const { Option } = Select;
const BASE_URL = config.Calibmaster.URL;

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  assigned: { color: "blue", icon: <ClockCircleOutlined />, label: "Assigned" },
  in_progress: { color: "orange", icon: <PlayCircleOutlined />, label: "In Progress" },
  completed: { color: "green", icon: <CheckCircleOutlined />, label: "Completed" },
};

const SYNC_CONFIG = {
  pending: { color: "warning", text: "Pending Sync" },
  synced: { color: "success", text: "Synced" },
};

const PRIORITY_CONFIG = {
  low: { color: "green", text: "Low" },
  medium: { color: "orange", text: "Medium" },
  high: { color: "red", text: "High" },
};

export default function TaskList() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: "", search: "" });

  // Stats
  const [stats, setStats] = useState({
    total: 0, assigned: 0, in_progress: 0, completed: 0, pending_sync: 0,
  });
  const [localTasks, setLocalTasks] = useState([]);
  const [isOfflineModalVisible, setIsOfflineModalVisible] = useState(false);
  const [parsedLocalTasks, setParsedLocalTasks] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const checkLocalTasks = useCallback(async () => {
    if (window.electron?.db) {
      const locals = await window.electron.db.getAllLocalTasks();
      setLocalTasks(locals); // now contains task_id and local_count
      
      // Also prepare parsed data for the offline modal
      const parsed = locals.map(l => ({
        ...JSON.parse(l.data),
        downloaded_at: l.downloaded_at,
        local_count: l.local_count
      }));
      setParsedLocalTasks(parsed);
    }
  }, []);

  useEffect(() => {
    checkLocalTasks();
  }, [checkLocalTasks]);

  // ─── Online/Offline Detection via Heartbeat ──────────────────────────────
  useEffect(() => {
    const checkOnline = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/heartbeat/check`, {
          headers: { Authorization: "Bearer " + auth.token },
          signal: AbortSignal.timeout(4000) // 4 second timeout
        });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };

    // Instant react to browser network events
    const goOnline  = () => checkOnline();
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);

    // Poll every 10 seconds
    checkOnline();
    const interval = setInterval(checkOnline, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [auth.token]);

  const fetchTasks = useCallback(
    async (page = 1, pageSize = 10, status = "", search = "") => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: pageSize });
        if (status) params.append("status", status);
        if (search) params.append("search", search);

        const res = await fetch(`${BASE_URL}/api/tasks/all?${params}`, {
          headers: { Authorization: "Bearer " + auth.token },
        });
        const data = await res.json();

        if (res.ok) {
          const rows = data.data || [];
          setTasks(rows);
          setPagination((p) => ({ ...p, current: page, pageSize, total: data.pagination?.total || rows.length }));

          setStats({
            total: data.pagination?.total || rows.length,
            assigned: rows.filter((t) => t.status === "assigned").length,
            in_progress: rows.filter((t) => t.status === "in_progress").length,
            completed: rows.filter((t) => t.status === "completed").length,
            // Count TASKS with pending changes (not individual records)
            pending_sync: localTasks.filter(t => (t.local_count || 0) > 0).length,
          });
        } else {
          // FALLBACK TO SQLite
          if (window.electron?.db) {
            const locals = await window.electron.db.getAllLocalTasks();
            if (locals.length > 0) {
              setTasks(locals.map(l => ({ ...JSON.parse(l.data), is_offline: true })));
              message.info(`Loaded ${locals.length} tasks from local storage.`);
            } else {
              message.error(data.message || "Failed to load tasks");
            }
          } else {
            message.error(data.message || "Failed to load tasks");
          }
        }
      } catch (err) {
        // FALLBACK TO SQLite
        if (window.electron?.db) {
          const locals = await window.electron.db.getAllLocalTasks();
          if (locals.length > 0) {
            setTasks(locals.map(l => ({ ...JSON.parse(l.data), is_offline: true })));
            message.warning("Network error. Showing locally stored tasks.");
          } else {
            message.error("Network error and no local tasks found.");
          }
        } else {
          message.error("Network error while fetching tasks");
        }
      } finally {
        setLoading(false);
      }
    },
    [auth.token, localTasks]  // include localTasks so stats are always fresh
  );

  // Reactive: recompute pending_sync whenever localTasks refreshes (e.g. after offline calibration)
  useEffect(() => {
    // Show count of TASKS needing sync, not total number of records
    const tasksPending = localTasks.filter(t => (t.local_count || 0) > 0).length;
    setStats(prev => ({ ...prev, pending_sync: tasksPending }));
  }, [localTasks]);

  useEffect(() => {
    fetchTasks(1, 10, filters.status, filters.search);
  }, [fetchTasks]);

  function handleTableChange(pag) {
    fetchTasks(pag.current, pag.pageSize, filters.status, filters.search);
  }

  function handleFilterChange(key, value) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTasks(1, pagination.pageSize, newFilters.status, newFilters.search);
  }

  async function handleDelete(taskId) {
    try {
      const res = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + auth.token },
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Task deleted");
        fetchTasks(pagination.current, pagination.pageSize, filters.status, filters.search);
        if (window.electron?.db) await window.electron.db.deleteTask(taskId);
      } else {
        message.error(data.message || "Cannot delete task");
      }
    } catch {
      message.error("Network error");
    }
  }

  async function handleDownload(record) {
    if (!window.electron?.db) {
      notification.error({
        message: "Download Failed",
        description: "Desktop app required for offline storage",
      });
      return;
    }

    const hide = message.loading(`Downloading task "${record.task_name}"...`, 0);

    const syncMasterDataForOffline = async () => {
      try {
        const endpoints = {
          makes: "/api/makemodel/make",
          models: "/api/makemodel/model",
          uoms: "/api/uom/list",
          categories: "/api/instrument-types/listCategoryofInstruments",
          instrumenttypes: "/api/instrument-types/list",
          allInstrument: "/api/instrument-types/filter",
          variantTypes: `/api/instrumentvariantstype/fetch?labid=${auth.labId}`,
          assets: "/api/srf/getSrfItems"
        };

        for (const [key, path] of Object.entries(endpoints)) {
          console.log(`Syncing ${key}...`);
          const fetchOptions = {
            headers: { Authorization: "Bearer " + auth.token }
          };

          // Define which keys require POST method
          const postKeys = ["categories", "instrumenttypes", "allInstrument", "assets"];
          
          if (postKeys.includes(key)) {
            fetchOptions.method = "POST";
            fetchOptions.headers["Content-Type"] = "application/json";
            
            // Build body: categories/instrument-types use lab_id, assets uses labId
            const body = {};
            if (key === "categories" || key === "instrumenttypes" || key === "allInstrument") {
              body.lab_id = auth.labId;
            }
            if (key === "assets") {
              body.labId = auth.labId;
            }
            fetchOptions.body = JSON.stringify(body);
          }

          const res = await fetch(`${BASE_URL}${path}`, fetchOptions);
          const data = await res.json();
          console.log(`${key} response:`, data);

          if (res.ok) {
            // Some APIs return inside .data, some return directly
            const resultData = data.data || data;
            await window.electron.db.saveMasterData(key, resultData);
          }
        }
      } catch (err) {
        console.warn("Failed to backup master data:", err);
      }
    };

    try {
      // 1. Sync global master data first (makes, models, etc)
      await syncMasterDataForOffline();

      // 2. Fetch full task data (including all instruments)
      const res = await fetch(`${BASE_URL}/api/tasks/${record.task_id}`, {
        headers: { Authorization: "Bearer " + auth.token },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        await window.electron.db.saveTask(data.data);
        hide();
        notification.success({
          message: "Task Stored",
          description: `Task "${record.task_name}" is now available for offline use on your laptop.`,
          placement: "bottomRight",
        });
        checkLocalTasks();
      } else {
        hide();
        notification.error({
          message: "Download Error",
          description: data.message || "Failed to fetch task details",
        });
      }
    } catch (err) {
      console.log(err);
      hide();
      notification.error({
        message: "Network Error",
        description: "Failed to connect to server for download.",
      });
    }
  }

  async function handleSyncTasks(taskIds) {
    if (!window.electron?.db) return;
    setIsSyncing(true);
    const hide = message.loading(`Syncing ${taskIds.length} tasks...`, 0);
    
    try {
        let totalSynced = 0;
        for (const tid of taskIds) {
            const measurements = await window.electron.db.getPendingMeasurements(tid);
            const actions = await window.electron.db.getPendingActions(tid);
            
            if (measurements.length === 0 && actions.length === 0) continue;

            const payload = {
                user_id: auth.userId,
                changes: [
                    ...measurements.map(p => ({
                        type: "calibration_data",
                        client_id: `m_${p.id}`,
                        payload: { task_item_id: p.task_item_id, ...p.payload }
                    })),
                    ...actions.map(a => ({
                        type: a.type,
                        client_id: `a_${a.id}`,
                        payload: { ...a.payload, task_id: tid }
                    }))
                ],
                client_timestamp: new Date().toISOString()
            };

            const res = await fetch(`${BASE_URL}/api/sync/push`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const result = await res.json();
                await window.electron.db.markAsSynced(measurements.map(m => m.id));
                await window.electron.db.deleteActions(actions.map(a => a.id));
                
                // Update local task version to prevent mismatch on next sync
                if (result.tasks && Array.isArray(result.tasks)) {
                    for (const t of result.tasks) {
                        await window.electron.db.updateLocalTaskVersion({
                            taskId: t.task_id,
                            status: t.status,
                            version: t.version
                        });
                    }
                }
                totalSynced++;
            }
        }
        
        if (totalSynced > 0) {
            message.success(`Successfully synced ${totalSynced} tasks.`);
            fetchTasks(pagination.current, pagination.pageSize, filters.status, filters.search);
            checkLocalTasks();
            setSelectedRowKeys([]);
        } else {
            message.info("No pending changes to sync for selection.");
        }
    } catch (err) {
        console.error("Sync error:", err);
        message.error("Network error during sync.");
    } finally {
        hide();
        setIsSyncing(false);
    }
  }

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      title: "#",
      key: "index",
      width: 55,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: "Task Name",
      dataIndex: "task_name",
      key: "task_name",
      render: (name, rec) => (
        <div>
          <div
            style={{ fontWeight: 600, color: "#1f3864", cursor: "pointer" }}
            onClick={() => navigate(`/dashboard/tasks/${rec.task_id}`)}
          >
            {name}
          </div>
          {rec.description && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {rec.description.substring(0, 60)}…
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Engineer",
      key: "engineer",
      render: (_, rec) => (
        <span>{rec.engineer?.name || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || {};
        return (
          <Tag icon={cfg.icon} color={cfg.color} style={{ fontWeight: 600 }}>
            {cfg.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Sync",
      dataIndex: "sync_status",
      key: "sync_status",
      width: 140,
      render: (sync, rec) => {
        const local = localTasks.find(lt => lt.task_id === rec.task_id);
        // Show pending only if we have ACTUAL offline changes stored locally
        if (local && local.local_count > 0) {
          return (
            <Tooltip title={`${local.local_count} offline record(s) waiting to be pushed to server (calibrations + status changes)`}>
              <Badge status="warning" text={`Pending Sync`} />
            </Tooltip>
          );
        }
        // If downloaded locally but no pending changes, or completed online: show Synced
        if (!local || local.local_count === 0) {
          return <Badge status="success" text="Synced" />;
        }
        const cfg = SYNC_CONFIG[sync] || {};
        return <Badge status={cfg.color} text={cfg.text || sync} />;
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 90,
      render: (p) => {
        const cfg = PRIORITY_CONFIG[p] || {};
        return <Tag color={cfg.color}>{cfg.text || p}</Tag>;
      },
    },
    {
      title: "Instruments",
      dataIndex: "item_count",
      key: "item_count",
      width: 110,
      render: (count) => (
        <span style={{ fontWeight: 600, color: "#2e75b6" }}>{count ?? "—"}</span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      width: 120,
      render: (d) => {
        if (!d) return <span style={{ color: "#bbb" }}>—</span>;
        const date = new Date(d);
        const isOverdue = date < new Date() && true;
        return (
          <span style={{ color: isOverdue ? "#cf1322" : "inherit", fontWeight: isOverdue ? 600 : 400 }}>
            {date.toLocaleDateString("en-IN")}
          </span>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 130,
      render: (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, rec) => (
        <Space>
          <Tooltip title="View Detail">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/dashboard/tasks/${rec.task_id}`)}
            />
          </Tooltip>

          {(() => {
            const localInfo = localTasks.find(lt => lt.task_id === rec.task_id);
            const hasLocalChanges = localInfo && localInfo.local_count > 0;
            
            return (
              <Space>
                {localInfo ? (
                  <Tooltip title={
                    !isOnline
                      ? "No internet connection. Connect to network to sync."
                      : hasLocalChanges
                        ? `Click to push ${localInfo.local_count} offline record(s) to server`
                        : "Stored locally"
                  }>
                    <Button 
                      type="link" 
                      icon={hasLocalChanges ? <SyncOutlined spin={isSyncing} /> : <LaptopOutlined />} 
                      style={{ color: hasLocalChanges ? (isOnline ? "#fa8c16" : "#aaa") : "#52c41a" }} 
                      disabled={!isOnline && hasLocalChanges}
                      onClick={hasLocalChanges && isOnline ? () => handleSyncTasks([rec.task_id]) : undefined}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Download for Offline">
                    <Button
                      type="link"
                      icon={<CloudDownloadOutlined />}
                      onClick={() => handleDownload(rec)}
                    />
                  </Tooltip>
                )}
              </Space>
            );
          })()}

          {auth.department?.toLowerCase() === "admin" && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete this task?"
                description="This cannot be undone if no calibration data exists."
                onConfirm={() => handleDelete(rec.task_id)}
                okText="Delete"
                okType="danger"
              >
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1f3864" }}>
          Task Management
        </h2>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Tooltip
              title={!isOnline ? "No internet connection. Please connect to the network before syncing." : ""}
            >
              <Button
                type="primary"
                icon={<SyncOutlined spin={isSyncing} />}
                onClick={() => handleSyncTasks(selectedRowKeys)}
                loading={isSyncing}
                disabled={!isOnline}
                style={{ backgroundColor: isOnline ? "#fa8c16" : undefined, borderColor: isOnline ? "#fa8c16" : undefined }}
              >
                Sync Selected ({selectedRowKeys.length})
              </Button>
            </Tooltip>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchTasks(pagination.current, pagination.pageSize, filters.status, filters.search)}
          >
            Refresh
          </Button>
          {(auth.department?.toLowerCase() === "admin" || auth.department?.toLowerCase() === "manager") && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/dashboard/tasks/create")}
              style={{ backgroundColor: "#1f3864", borderColor: "#1f3864" }}
            >
              Create Task
            </Button>
          )}
          {(auth.department?.toLowerCase() !== "admin" && auth.department?.toLowerCase() !== "manager") && window.electron?.db && (
            <Button
              icon={<DatabaseOutlined />}
              onClick={() => setIsOfflineModalVisible(true)}
            >
              Offline Data ({localTasks.length})
            </Button>
          )}
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { label: "Total Tasks", value: stats.total, color: "#1f3864", prefix: null },
          { label: "Assigned", value: stats.assigned, color: "#1677ff", prefix: <ClockCircleOutlined /> },
          { label: "In Progress", value: stats.in_progress, color: "#fa8c16", prefix: <PlayCircleOutlined /> },
          { label: "Completed", value: stats.completed, color: "#52c41a", prefix: <CheckCircleOutlined /> },
          { label: "Pending Sync", value: stats.pending_sync, color: "#faad14", prefix: <SyncOutlined spin={stats.pending_sync > 0} /> },
        ].map((s) => (
          <Col xs={24} sm={12} md={8} lg={4} key={s.label}>
            <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
              <Statistic
                title={<span style={{ fontSize: 12 }}>{s.label}</span>}
                value={s.value}
                prefix={s.prefix}
                valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onSearch={(v) => handleFilterChange("search", v)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="Filter by Status"
          value={filters.status || undefined}
          onChange={(v) => handleFilterChange("status", v || "")}
          allowClear
          style={{ width: 180 }}
        >
          <Option value="assigned">Assigned</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={tasks}
        rowKey="task_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tasks`,
        }}
        onChange={handleTableChange}
        size="middle"
        scroll={{ x: 900 }}
        rowClassName={(rec) =>
          rec.sync_status === "pending" ? "task-row-pending" : ""
        }
      />
      <OfflineTable
        open={isOfflineModalVisible}
        onCancel={() => setIsOfflineModalVisible(false)}
        data={parsedLocalTasks}
        onRefresh={checkLocalTasks}
      />
      <style>{`
        .task-row-pending { background-color: #fffbe6 !important; }
        .task-row-pending:hover td { background-color: #fff7cc !important; }
      `}</style>
    </div>
  );
}
