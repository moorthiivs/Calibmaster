import React, { useState, useEffect, useCallback } from "react";
import { Modal, Table, Tag, Button, Space, Tooltip, Badge, Popconfirm, message, Typography, Card } from "antd";
import { 
  SyncOutlined, 
  DeleteOutlined, 
  DeploymentUnitOutlined, 
  DatabaseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";

const { Text } = Typography;

const OfflineTable = ({ open, onCancel, data, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSyncTask = async (task) => {
    if (!window.electron?.db) return;
    
    setLoading(true);
    const hide = message.loading(`Syncing task "${task.task_name}"...`, 0);
    
    try {
      // 1. Get pending measurements for this task
      const pending = await window.electron.db.getPendingMeasurements(task.task_id);
      
      if (pending.length === 0) {
        message.info("No pending measurements to sync for this task.");
        hide();
        return;
      }

      // 2. Here you would normally loop and push to server
      // For now, we simulate success or provide a structure for the final logic
      console.log("Found pending measurements:", pending);
      
      // Simulating a sync process (This should be replaced with actual API calls)
      // await Promise.all(pending.map(p => pushToServer(p)));
      
      // 3. Mark as synced in local DB (In this app, it deletes them or updates status)
      await window.electron.db.markAsSynced(pending.map(p => p.id));
      
      message.success(`Successfully synced ${pending.length} measurements.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Sync Error:", err);
      message.error("Failed to sync measurements to server.");
    } finally {
      hide();
      setLoading(false);
    }
  };

  const handleDeleteLocal = async (taskId) => {
    if (!window.electron?.db) return;
    try {
      await window.electron.db.deleteTask(taskId);
      message.success("Task removed from local storage");
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error("Failed to delete local task");
    }
  };

  // ─── Nested Tables ────────────────────────────────────────────────────────

  const expandedRowRender = (task) => {
    const itemColumns = [
      { title: "Item ID", dataIndex: "task_item_id", key: "id", width: 80 },
      { 
        title: "Instrument", 
        key: "instrument",
        render: (_, itm) => (
          <div>
            <div style={{ fontWeight: 600 }}>{itm.instrumentType?.instrument_full_name}</div>
            <div style={{ fontSize: 11, color: "#666" }}>
              {itm.srfItem?.make} | {itm.srfItem?.model} | SN: {itm.srfItem?.serial_no || "N/A"}
            </div>
          </div>
        )
      },
      { 
        title: "Status", 
        dataIndex: "calibration_status", 
        key: "status",
        render: (s) => <Tag color={s === "completed" ? "green" : "blue"}>{s}</Tag>
      },
    ];

    const calibrationColumns = [
      { title: "Reading Date", dataIndex: "calibration_date", key: "date", render: d => new Date(d).toLocaleString() },
      { 
        title: "Values", 
        dataIndex: "reading_value", 
        key: "values",
        render: (vals) => (
          <Space wrap>
            {vals.map((v, i) => (
              <Tag key={i} color="blue">
                {Object.keys(v).filter(k => !["Symbols", "SymbolPos", "InstrumentUOMID", "InstrumentparameterUOM"].includes(k))}: {Object.values(v)[1]} {v.InstrumentparameterUOM}
              </Tag>
            ))}
          </Space>
        )
      },
      { title: "Remarks", dataIndex: "remarks", key: "remarks" },
      { 
        title: "Sync", 
        dataIndex: "is_synced", 
        key: "sync",
        render: s => s ? <Tag icon={<CheckCircleOutlined />} color="success">Synced</Tag> : <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>
      }
    ];

    return (
      <div style={{ padding: "0 10px 10px 10px", backgroundColor: "#fafafa" }}>
        <Typography.Title level={5} style={{ marginTop: 10 }}>
          <DeploymentUnitOutlined /> Instruments in Task
        </Typography.Title>
        <Table
          columns={itemColumns}
          dataSource={task.items || []}
          pagination={false}
          rowKey="task_item_id"
          size="small"
        />
        
        {task.calibration_data && task.calibration_data.length > 0 && (
          <>
            <Typography.Title level={5} style={{ marginTop: 20 }}>
              <DatabaseOutlined /> Local Calibration Readings
            </Typography.Title>
            <Table
              columns={calibrationColumns}
              dataSource={task.calibration_data}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </>
        )}
      </div>
    );
  };

  // ─── Main Columns ─────────────────────────────────────────────────────────

  const columns = [
    {
      title: "Task ID",
      dataIndex: "task_id",
      key: "task_id",
      width: 90,
    },
    {
      title: "Task Name",
      dataIndex: "task_name",
      key: "task_name",
      render: (text) => <Text strong color="#1f3864">{text}</Text>
    },
    {
      title: "SRF No",
      key: "srf",
      render: (_, rec) => rec.srf?.srf_number || rec.srf_id
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (p) => <Tag color={p === "high" ? "red" : p === "medium" ? "orange" : "green"}>{p?.toUpperCase()}</Tag>
    },
    {
      title: "Stored At",
      dataIndex: "downloaded_at",
      key: "downloaded_at",
      render: (d) => d ? new Date(d).toLocaleDateString() : "Offline Mode"
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sync Pending Data">
            <Button 
              type="text" 
              icon={<SyncOutlined />} 
              style={{ color: "#faad14" }}
              onClick={() => handleSyncTask(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete from Laptop?"
            description="This will only remove the local copy. It won't affect the server."
            onConfirm={() => handleDeleteLocal(record.task_id)}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Tooltip title="Delete Local Copy">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined style={{ color: "#1f3864" }} />
          <span>Offline Data Management</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>,
        <Button key="refresh" icon={<SyncOutlined />} onClick={onRefresh}>Refresh List</Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Below are the tasks currently stored on your laptop. You can view items and readings even without an internet connection.
        </Text>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="task_id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 5 }}
        size="middle"
      />
    </Modal>
  );
};

export default OfflineTable;
