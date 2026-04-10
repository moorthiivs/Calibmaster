import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form, Input, Select, DatePicker, Button, Card, Table, Checkbox,
  message, Spin, Tag, Steps, Divider, Badge, Alert
} from "antd";
import {
  ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined,
  FileSearchOutlined, TeamOutlined, CheckSquareOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../context/auth-context";
import config from "../../utils/config.json";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const BASE_URL = config.Calibmaster.URL;

// ─── Step config ─────────────────────────────────────────────────────────────
const STEPS = [
  { title: "Task Details",   icon: <TeamOutlined />,         description: "Name, assign user, due date" },
  { title: "Select SRF",     icon: <FileSearchOutlined />,   description: "Pick the source SRF" },
  { title: "Pick Instruments",icon: <CheckSquareOutlined />, description: "Select instruments to calibrate" },
];

export default function CreateTask() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);

  // ─── RBAC Check ────────────────────────────────────────────────────────────
  useEffect(() => {
    const role = auth.department?.toLowerCase();
    if (role !== "admin" && role !== "manager") {
      message.error("Access Denied: You do not have permission to create tasks.");
      navigate("/dashboard/tasks");
    }
  }, [auth.department, navigate]);

  // Step 1 data
  const [users, setUsers]           = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Step 2 data
  const [srfs, setSrfs]               = useState([]);
  const [loadingSrfs, setLoadingSrfs] = useState(false);
  const [selectedSrf, setSelectedSrf] = useState(null);

  // Step 3 data
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [itemNotes, setItemNotes]       = useState({});       // { srf_item_id: note }
  const [itemCalibRequired, setItemCalibRequired] = useState({}); // { srf_item_id: bool }

  // ─── Load users (Step 1) ───────────────────────────────────────────────────
  useEffect(() => {
    setLoadingUsers(true);
    // Passing labId to get filtered user list similar to main Users list
    const params = new URLSearchParams();
    if (auth.labId) params.append("lab_id", auth.labId);

    fetch(`${BASE_URL}/api/tasks/users?${params}`, {
      headers: { Authorization: "Bearer " + auth.token }
    })
      .then(r => r.json())
      .then(d => { if (d?.data) setUsers(d.data); })
      .catch(() => message.error("Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, [auth.token, auth.labId]);

  // ─── Load SRFs (Step 2) ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 1) return;
    setLoadingSrfs(true);
    const params = new URLSearchParams();
    if (auth.labId) params.append("lab_id", auth.labId);

    fetch(`${BASE_URL}/api/tasks/srf-picker?${params}`, {
      headers: { Authorization: "Bearer " + auth.token }
    })
      .then(r => r.json())
      .then(d => { if (d?.data) setSrfs(d.data); })
      .catch(() => message.error("Failed to load SRFs"))
      .finally(() => setLoadingSrfs(false));
  }, [step, auth.token, auth.labId]);

  // ─── Load Instrument Types (Step 3) ────────────────────────────────────────
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [loadingInsTypes, setLoadingInsTypes] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    setLoadingInsTypes(true);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ lab_id: auth.labId }),
    };

    fetch(`${BASE_URL}/api/instrument-types/list`, requestOptions)
      .then(r => r.json())
      .then(d => {
        if (d?.data) {
          setInstrumentTypes(d.data);
          // Default: all calibration_required = true
          const defaultCalib = {};
          d.data.forEach(i => { defaultCalib[i.instrument_type_id] = true; });
          setItemCalibRequired(defaultCalib);
        }
      })
      .catch(() => message.error("Failed to load instrument types"))
      .finally(() => setLoadingInsTypes(false));
  }, [step, auth.token, auth.labId]);

  function handleSrfSelect(srfId) {
    const srf = srfs.find(s => String(s.srf_id) === String(srfId));
    setSelectedSrf(srf || null);
    setSelectedRowKeys([]);
    setItemNotes({});
    setItemCalibRequired({});
  }

  // ─── Step navigation ──────────────────────────────────────────────────────
  async function goToStep2() {
    try {
      await form.validateFields(["task_name", "user_id"]);
      setStep(1);
    } catch {
      // validation failed — antd shows inline errors
    }
  }

  function goToStep3() {
    if (!selectedSrf) { message.warning("Please select an SRF first"); return; }
    setStep(2);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (selectedRowKeys.length === 0) {
      message.error("Please select at least one instrument from the Master List");
      return;
    }
    try {
      // PROACTIVELY VALIDATE: Ensure Task Name and User (Step 1) are present
      await form.validateFields();

      const values = form.getFieldsValue();
      console.log(values, "values");
      const payload = {
        user_id:     values.user_id,
        task_name:   values.task_name,
        description: values.description || null,
        srf_id:      selectedSrf.srf_id,
        due_date:    values.due_date ? values.due_date.toISOString() : null,
        priority:    values.priority || "medium",
        items: selectedRowKeys.map(instrument_type_id => {
          const type = instrumentTypes.find(t => t.instrument_type_id === instrument_type_id);
          return {
            instrument_type_id,
            calibration_required: itemCalibRequired[instrument_type_id] !== false,
            notes: itemNotes[instrument_type_id] || null,
            lab_type: type?.labtype || null,
            category: type?.instrument_type_spec || null
          };
        })
      };

      const res = await fetch(`${BASE_URL}/api/tasks/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        message.success(`Task "${data.data?.task_name}" created — ${selectedRowKeys.length} instruments assigned`);
        navigate("/dashboard/tasks");
      } else {
        message.error(data.message || "Failed to create task");
      }
    } catch {
      message.error("Network error while creating task");
    } finally {
      setLoading(false);
    }
  }

  // ─── Instrument Types table columns (Step 3) ──────────────────────────────
  const insTypeColumns = [
    {
      title: "Instrument Description",
      key: "description",
      render: (_, rec) => (
        <div>
          <div style={{ fontWeight: 600, color: "#1f3864" }}>{rec.instrument_full_name}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{rec.instrument_name}</div>
        </div>
      )
    },
    {
      title: "Type / Variant",
      dataIndex: "type",
      width: 150,
      render: v => v || <span style={{ color: "#ccc" }}>—</span>
    },
    {
      title: "Calib. Required",
      width: 130,
      render: (_, rec) => (
        <Checkbox
          checked={itemCalibRequired[rec.instrument_type_id] !== false}
          onChange={e => setItemCalibRequired(p => ({ ...p, [rec.instrument_type_id]: e.target.checked }))}
          disabled={!selectedRowKeys.includes(rec.instrument_type_id)}
        />
      )
    },
    {
      title: "Notes",
      width: 250,
      render: (_, rec) => (
        <Input
          size="small"
          value={itemNotes[rec.instrument_type_id] || ""}
          placeholder="Optional notes"
          disabled={!selectedRowKeys.includes(rec.instrument_type_id)}
          onChange={e => setItemNotes(p => ({ ...p, [rec.instrument_type_id]: e.target.value }))}
        />
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
    getCheckboxProps: rec => ({ name: String(rec.instrument_type_id) })
  };

  function handleHeaderBack() {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate("/dashboard/tasks");
    }
  }

  return (
    <div style={{ padding: 24, width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleHeaderBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1f3864" }}>
          Create Calibration Task
        </h2>
      </div>

      {/* Steps indicator */}
      <Steps
        current={step}
        items={STEPS}
        style={{ marginBottom: 28 }}
        size="small"
      />

      <Form form={form} layout="vertical" preserve={true}>

        {/* ══ STEP 0 — Task Details ══════════════════════════════════════════ */}
        <div style={{ display: step === 0 ? "block" : "none" }}>
          <Card title={<span style={{ fontWeight: 600, color: "#1f3864" }}>Step 1 — Task Details</span>}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Form.Item
                label="Task Name"
                name="task_name"
                rules={[{ required: true, message: "Task name is required" }]}
              >
                <Input placeholder="e.g., Quarterly Calibration — Press Shop" size="large" />
              </Form.Item>

              <Form.Item
                label="Assign To (User)"
                name="user_id"
                rules={[{ required: true, message: "Please select a user" }]}
              >
                <Select
                  placeholder="Select user to assign"
                  size="large"
                  showSearch
                  loading={loadingUsers}
                  optionFilterProp="children"
                >
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                      <span style={{ color: "#888", marginLeft: 8, fontSize: 12 }}>
                        [{u.department}]
                      </span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Due Date" name="due_date">
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  disabledDate={d => d && d < dayjs().startOf("day")}
                  placeholder="Select due date"
                />
              </Form.Item>

              <Form.Item label="Priority" name="priority" initialValue="medium">
                <Select size="large">
                  <Option value="low">  <Tag color="green">Low</Tag></Option>
                  <Option value="medium"><Tag color="orange">Medium</Tag></Option>
                  <Option value="high"> <Tag color="red">High</Tag></Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item label="Description (optional)" name="description">
              <TextArea rows={2} placeholder="Brief description of this calibration task..." />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={goToStep2}
                style={{ backgroundColor: "#1f3864", borderColor: "#1f3864" }}
              >
                Next: Select SRF
              </Button>
            </div>
          </Card>
        </div>

        {/* ══ STEP 1 — Select SRF ═══════════════════════════════════════════ */}
        <div style={{ display: step === 1 ? "block" : "none" }}>
          <Card title={<span style={{ fontWeight: 600, color: "#1f3864" }}>Step 2 — Select SRF</span>}>
            {loadingSrfs ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin tip="Loading SRFs..." />
              </div>
            ) : (
              <>
                <Form.Item
                  label="Select Service Request Form (SRF)"
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    placeholder="Choose an SRF to load instruments from..."
                    size="large"
                    showSearch
                    value={selectedSrf ? String(selectedSrf.srf_id) : undefined}
                    onChange={handleSrfSelect}
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                    allowClear
                    onClear={() => { setSelectedSrf(null); setSrfItems([]); setSelectedRowKeys([]); }}
                  >
                    {srfs.map(s => (
                      <Option key={s.srf_id} value={String(s.srf_id)}>
                        <span style={{ fontWeight: 600 }}>{s.srf_number}</span>
                        <span style={{ color: "#888", marginLeft: 8, fontSize: 12 }}>
                          {s.srf_type} — {s.srf_date ? new Date(s.srf_date).toLocaleDateString("en-IN") : ""}
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* SRF Preview Table Removed per request */}

                <Divider />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Button icon={<ArrowLeftOutlined />} onClick={() => setStep(0)}>Back</Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRightOutlined />}
                    onClick={goToStep3}
                    disabled={!selectedSrf}
                    style={{ backgroundColor: "#1f3864", borderColor: "#1f3864" }}
                  >
                    Next: Pick Instruments
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ══ STEP 2 — Pick Instruments ═════════════════════════════════════ */}
        <div style={{ display: step === 2 ? "block" : "none" }}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, color: "#1f3864" }}>
                  Step 3 — Select Instruments to Calibrate
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#888" }}>instruments selected:</span>
                  <Badge
                    count={selectedRowKeys.length}
                    showZero
                    style={{ backgroundColor: selectedRowKeys.length > 0 ? "#52c41a" : "#d9d9d9" }}
                    overflowCount={999}
                  />
                </div>
              </div>
            }
          >
            <Alert
              type="info"
              showIcon
              message={`Task Instruments — Sourced from Template List`}
              description={`Selecting instruments for SRF ${selectedSrf?.srf_number}. Only selected instruments will be added to the task.`}
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={instrumentTypes}
              columns={insTypeColumns}
              rowKey="instrument_type_id"
              rowSelection={rowSelection}
              loading={loadingInsTypes}
              size="middle"
              pagination={{ pageSize: 15 }}
              scroll={{ y: 360 }}
              locale={{ emptyText: "No instruments found in Template List." }}
              rowClassName={rec =>
                selectedRowKeys.includes(rec.instrument_type_id)
                  ? "task-item-row-selected"
                  : "task-item-row-dimmed"
              }
            />

            <Divider />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setStep(1)}>Back</Button>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {selectedRowKeys.length > 0 && (
                  <span style={{ color: "#52c41a", fontWeight: 600 }}>
                    ✓ {selectedRowKeys.length} instrument{selectedRowKeys.length > 1 ? "s" : ""} selected
                  </span>
                )}
                <Button size="large" onClick={() => navigate("/dashboard/tasks")}>Cancel</Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={selectedRowKeys.length === 0}
                  style={{ backgroundColor: "#1f3864", borderColor: "#1f3864" }}
                >
                  Create Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Form>

      <style>{`
        .task-item-row-selected td { background: #f0f5ff !important; }
        .task-item-row-dimmed  td { opacity: 0.65; }
      `}</style>
    </div>
  );
}
