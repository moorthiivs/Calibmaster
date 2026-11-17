import { useContext, useEffect, useState } from "react";
import {
  Modal, Button, Upload, Table, Tag, Space, Typography,
  Spin, Alert, Steps, Tooltip, Badge, Divider, Result,
} from "antd";
import {
  DownloadOutlined, UploadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileExcelOutlined, UserAddOutlined,
  ReloadOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import ExcelJS from "exceljs";

// Native save helper (no file-saver dependency)
const saveAs = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";

const { Text, Title } = Typography;

// ── Constants ────────────────────────────────────────────────────────────────
// Columns exactly match the Add User form (Department is auto-derived from role)
const REQUIRED_COLUMNS = ["Name", "Email", "Password", "RBAC Role", "Title"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const getCellValue = (row, col) => {
  const val = row[col];
  if (val === undefined || val === null) return "";
  return String(val).trim();
};

const validateRow = (row, idx, roleNames) => {
  const errors = [];
  const name = getCellValue(row, "Name");
  const email = getCellValue(row, "Email");
  const password = getCellValue(row, "Password");
  const rbacRole = getCellValue(row, "RBAC Role");
  const title = getCellValue(row, "Title");

  if (!name) errors.push("Name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email required");
  if (!password || password.length < 6) errors.push("Password ≥ 6 chars");
  if (!title) errors.push("Title is required");
  if (!rbacRole) errors.push("RBAC Role is required");
  else if (roleNames.length && !roleNames.map(r => r.toLowerCase()).includes(rbacRole.toLowerCase()))
    errors.push(`Role "${rbacRole}" not found`);

  return {
    key: idx,
    row: idx + 2,
    name, email, password, rbacRole, title,
    valid: errors.length === 0,
    errors,
  };
};

// ── Download Template ─────────────────────────────────────────────────────────
// Columns: Name(A) | Email(B) | Password(C) | RBAC Role(D) | Title(E)
const downloadTemplate = async (roles) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Users");
  const hiddenSheet = workbook.addWorksheet("Lookups");
  hiddenSheet.state = "hidden";

  // ── Write role lookup data (column A of Lookups sheet) ────────────────────
  roles.forEach((r, i) => { hiddenSheet.getCell(`A${i + 1}`).value = r; });

  // ── Headers (5 columns — matches Add User form exactly) ──────────────────
  sheet.columns = [
    { header: "Name",      key: "name",     width: 24 },
    { header: "Email",     key: "email",    width: 30 },
    { header: "Password",  key: "password", width: 18 },
    { header: "RBAC Role", key: "rbacRole", width: 22 },
    { header: "Title",     key: "title",    width: 26 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" },
    };
  });
  headerRow.height = 24;

  // ── Add sample row ─────────────────────────────────────────────────────────
  const sampleRow = sheet.addRow({
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    rbacRole: roles[0] || "",
    title: "Quality Engineer",
  });
  sampleRow.font = { italic: true, color: { argb: "FF888888" } };

  // ── Data Validations (rows 2–1000) ─────────────────────────────────────────
  const roleRef = `Lookups!$A$1:$A$${Math.max(roles.length, 1)}`;

  for (let r = 2; r <= 1000; r++) {
    // RBAC Role dropdown — column D
    if (roles.length > 0) {
      sheet.getCell(`D${r}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [roleRef],
        showErrorMessage: true,
        errorTitle: "Invalid Role",
        error: "Select a valid RBAC role from the dropdown",
      };
    }
    // Email format hint — column B
    sheet.getCell(`B${r}`).dataValidation = {
      type: "custom",
      allowBlank: true,
      formulae: [`ISNUMBER(FIND("@",B${r}))`],
      showErrorMessage: true,
      errorTitle: "Invalid Email",
      error: "Please enter a valid email address",
    };
    // Password min length — column C
    sheet.getCell(`C${r}`).dataValidation = {
      type: "textLength",
      operator: "greaterThanOrEqual",
      allowBlank: false,
      formulae: [6],
      showErrorMessage: true,
      errorTitle: "Password Too Short",
      error: "Password must be at least 6 characters",
    };
  }

  // ── Freeze header ──────────────────────────────────────────────────────────
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), "user_bulk_upload_template.xlsx");
};

// ── Preview Table Columns ─────────────────────────────────────────────────────
const buildPreviewColumns = () => [
  { title: "Row", dataIndex: "row", width: 60, align: "center" },
  { title: "Name", dataIndex: "name", width: 140 },
  { title: "Email", dataIndex: "email", width: 190 },
  { title: "RBAC Role", dataIndex: "rbacRole", width: 140 },
  { title: "Title", dataIndex: "title", width: 140 },
  {
    title: "Status",
    dataIndex: "valid",
    width: 100,
    align: "center",
    render: (valid, record) =>
      valid ? (
        <Tag color="success" icon={<CheckCircleOutlined />}>Valid</Tag>
      ) : (
        <Tooltip title={record.errors.join(" | ")}>
          <Tag color="error" icon={<CloseCircleOutlined />}>Error</Tag>
        </Tooltip>
      ),
  },
];

// ── Result Summary Columns ────────────────────────────────────────────────────
const resultCreatedCols = [
  { title: "Row", dataIndex: "row", width: 60 },
  { title: "Name", dataIndex: "name", width: 160 },
  { title: "Email", dataIndex: "email" },
];
const resultFailedCols = [
  { title: "Row", dataIndex: "row", width: 60 },
  { title: "Email", dataIndex: "email", width: 200 },
  { title: "Errors", dataIndex: "errors", render: (errs) => errs.join("; ") },
];

// ── Main Component ────────────────────────────────────────────────────────────
const BulkUploadUsersModal = ({ isopen, onclose, onSuccess }) => {
  const auth = useContext(AuthContext);

  const [step, setStep] = useState(0); // 0=upload, 1=preview, 2=result
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [rawFile, setRawFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsing, setParsing] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { created, failed }

  // ── Fetch roles for this lab ─────────────────────────────────────────────
  useEffect(() => {
    if (!isopen) return;
    setLoadingRoles(true);
    fetch(config.Calibmaster.URL + "/api/roles/list", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
      body: JSON.stringify({ labId: auth.labId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) setRoles(data.data.map((r) => r.name));
      })
      .catch(() => {})
      .finally(() => setLoadingRoles(false));
  }, [isopen]);

  // ── Parse uploaded file ──────────────────────────────────────────────────
  const handleFile = async (file) => {
    setRawFile(file);
    setParsing(true);
    try {
      // Dynamically import xlsx (already in package.json via exceljs, but use xlsx for reading)
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Check required columns
      if (json.length === 0) {
        GlobalNotification.error({ title: "Empty File", description: "The Excel file has no data rows." });
        setParsing(false);
        return false;
      }
      const missing = REQUIRED_COLUMNS.filter((c) => !(c in json[0]));
      if (missing.length > 0) {
        GlobalNotification.error({
          title: "Missing Columns",
          description: `Required columns missing: ${missing.join(", ")}`,
        });
        setParsing(false);
        return false;
      }

      const validated = json.map((row, idx) => validateRow(row, idx, roles));
      setParsedRows(validated);
      setStep(1);
    } catch (err) {
      GlobalNotification.error({ title: "Parse Error", description: "Could not read the Excel file." });
    } finally {
      setParsing(false);
    }
    return false; // prevent antd auto-upload
  };

  // ── Submit to backend ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!rawFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", rawFile);
    formData.append("labId", auth.labId);

    try {
      const response = await fetch(config.Calibmaster.URL + "/api/users/bulk-upload", {
        method: "POST",
        headers: { Authorization: "Bearer " + auth.token },
        body: formData,
      });
      const data = await response.json();
      if (data.code === 200) {
        setUploadResult(data.data);
        setStep(2);
        if (data.data.created.length > 0) onSuccess && onSuccess();
      } else {
        GlobalNotification.error({ title: "Upload Failed", description: data.message });
      }
    } catch {
      GlobalNotification.error({ title: "Network Error", description: "Could not reach server." });
    } finally {
      setUploading(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(0);
    setRawFile(null);
    setParsedRows([]);
    setUploadResult(null);
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <Modal
      open={isopen}
      onCancel={onclose}
      width={980}
      footer={null}
      destroyOnClose
      title={
        <Space>
          <FileExcelOutlined style={{ color: "#217346", fontSize: 20 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Bulk Upload Users</span>
        </Space>
      }
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: "Upload File", icon: <UploadOutlined /> },
          { title: "Preview & Validate", icon: <CheckCircleOutlined /> },
          { title: "Result", icon: <UserAddOutlined /> },
        ]}
      />

      {/* ── STEP 0: Upload ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <Spin spinning={parsing || loadingRoles}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 20 }}
            message="Instructions"
            description={
              <ul style={{ margin: "8px 0 0 16px", paddingLeft: 0 }}>
                <li>Download the template — the <b>RBAC Role</b> column has a <b>dropdown</b> with all available roles.</li>
                <li>Required columns: <b>{REQUIRED_COLUMNS.join(", ")}</b>.</li>
                <li>Password must be at least 6 characters. Duplicate emails will be skipped.</li>
              </ul>
            }
          />

          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              loading={loadingTemplate || loadingRoles}
              onClick={async () => {
                setLoadingTemplate(true);
                await downloadTemplate(roles);
                setLoadingTemplate(false);
              }}
              style={{
                background: "linear-gradient(135deg, #217346 0%, #1a5c38 100%)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                borderRadius: 8,
                padding: "0 28px",
                height: 44,
                boxShadow: "0 4px 12px rgba(33,115,70,0.3)",
              }}
            >
              Download Excel Template
            </Button>
            <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>
              Column <b>D (RBAC Role)</b> has a dropdown with your lab's roles
            </div>
          </div>

          <Divider>Upload Filled Template</Divider>

          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFile}
            style={{
              background: "linear-gradient(135deg, #f0f9f4 0%, #e8f5e9 100%)",
              border: "2px dashed #217346",
              borderRadius: 12,
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 8 }}>📂</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1a5c38" }}>
              Click or drag your Excel file here
            </p>
            <p style={{ color: "#888" }}>Supports .xlsx and .xls files</p>
          </Upload.Dragger>
        </Spin>
      )}

      {/* ── STEP 1: Preview ────────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <Space style={{ marginBottom: 16 }} wrap>
            <Badge count={validCount} color="#52c41a">
              <Tag color="success">Ready to upload</Tag>
            </Badge>
            <Badge count={invalidCount} color="#ff4d4f">
              <Tag color="error">Has errors</Tag>
            </Badge>
            {invalidCount > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <InfoCircleOutlined /> Hover error tags to see details. Invalid rows will be skipped.
              </Text>
            )}
          </Space>

          <Table
            columns={buildPreviewColumns()}
            dataSource={parsedRows}
            size="small"
            scroll={{ x: 800, y: 320 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={(r) => (r.valid ? "" : "ant-table-row-error")}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>Re-upload</Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              loading={uploading}
              disabled={validCount === 0}
              onClick={handleSubmit}
              style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                border: "none",
                fontWeight: 600,
                borderRadius: 8,
              }}
            >
              Upload {validCount} Valid User{validCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}

      {/* ── STEP 2: Result ─────────────────────────────────────────────────── */}
      {step === 2 && uploadResult && (
        <>
          <Result
            status={uploadResult.failed.length === 0 ? "success" : "warning"}
            title={`${uploadResult.created.length} User${uploadResult.created.length !== 1 ? "s" : ""} Created Successfully`}
            subTitle={
              uploadResult.failed.length > 0
                ? `${uploadResult.failed.length} row(s) failed — see details below.`
                : "All rows were processed successfully!"
            }
          />

          {uploadResult.created.length > 0 && (
            <>
              <Title level={5} style={{ color: "#52c41a" }}>
                <CheckCircleOutlined /> Created ({uploadResult.created.length})
              </Title>
              <Table
                columns={resultCreatedCols}
                dataSource={uploadResult.created.map((r, i) => ({ ...r, key: i }))}
                size="small"
                pagination={false}
                scroll={{ y: 180 }}
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          {uploadResult.failed.length > 0 && (
            <>
              <Title level={5} style={{ color: "#ff4d4f" }}>
                <CloseCircleOutlined /> Failed ({uploadResult.failed.length})
              </Title>
              <Table
                columns={resultFailedCols}
                dataSource={uploadResult.failed.map((r, i) => ({ ...r, key: i }))}
                size="small"
                pagination={false}
                scroll={{ y: 180 }}
              />
            </>
          )}

          <div style={{ marginTop: 20, textAlign: "right" }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginRight: 8 }}>
              Upload Another File
            </Button>
            <Button type="primary" onClick={onclose}>Done</Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default BulkUploadUsersModal;
