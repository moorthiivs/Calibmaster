import { useContext, useEffect, useState } from "react";
import {
  Modal, Button, Upload, Table, Tag, Space, Typography,
  Spin, Alert, Steps, Tooltip, Badge, Divider, Result,
  Checkbox, Row, Col, theme,
} from "antd";
import {
  DownloadOutlined, UploadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileExcelOutlined, ToolOutlined,
  ReloadOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import ExcelJS from "exceljs";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";

const { Text, Title } = Typography;

// ── Constants ────────────────────────────────────────────────────────────────
const LAB_TYPES = ["NABL", "NON-NABL", "SERVICE"];

const BASE_COLUMNS = ["Instrument Name", "UOM", "Discipline", "Group"];

// Native save helper
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const getCellValue = (row, col) => {
  const val = row[col];
  if (val === undefined || val === null) return "";
  return String(val).trim();
};

// Build range column names for a lab type
const getRangeColumns = (labType) => [
  `${labType} Range Min`,
  `${labType} Range Max`,
  `${labType} Range Unit`,
  `${labType} Range Decimal`,
];

// ── Validate Row ─────────────────────────────────────────────────────────────
const validateRow = (row, idx, uomNames, disciplineNames, groupNames, selectedLabTypes) => {
  const errors = [];
  const name = getCellValue(row, "Instrument Name");
  const uom = getCellValue(row, "UOM");
  const discipline = getCellValue(row, "Discipline");
  const group = getCellValue(row, "Group");

  if (!name) errors.push("Instrument Name is required");
  if (!uom) errors.push("UOM is required");
  else if (!uomNames.map(n => n.toLowerCase()).includes(uom.toLowerCase()))
    errors.push(`UOM "${uom}" not found`);
  if (!discipline) errors.push("Discipline is required");
  else if (!disciplineNames.map(n => n.toLowerCase()).includes(discipline.toLowerCase()))
    errors.push(`Discipline "${discipline}" not found`);
  if (!group) errors.push("Group is required");
  else if (!groupNames.map(n => n.toLowerCase()).includes(group.toLowerCase()))
    errors.push(`Group "${group}" not found`);

  // Validate range columns for each selected lab type
  const ranges = [];
  for (const lab of selectedLabTypes) {
    const cols = getRangeColumns(lab);
    const min = getCellValue(row, cols[0]);
    const max = getCellValue(row, cols[1]);
    const unit = getCellValue(row, cols[2]);
    const decimal = getCellValue(row, cols[3]);

    // If any range field is filled, validate all of them
    if (min || max || unit || decimal) {
      if (!min) errors.push(`${lab} Range Min is required`);
      else if (isNaN(Number(min))) errors.push(`${lab} Range Min must be a number`);

      if (!max) errors.push(`${lab} Range Max is required`);
      else if (isNaN(Number(max))) errors.push(`${lab} Range Max must be a number`);

      if (min && max && !isNaN(Number(min)) && !isNaN(Number(max)) && Number(max) <= Number(min)) {
        errors.push(`${lab} Range Max must be greater than Min`);
      }

      if (!unit) errors.push(`${lab} Range Unit is required`);
      if (!decimal) errors.push(`${lab} Range Decimal is required`);
      else if (![1, 2, 3, 4, 5].includes(Number(decimal)))
        errors.push(`${lab} Range Decimal must be 1-5`);

      ranges.push({
        labtype: lab,
        min: Number(min),
        max: Number(max),
        unit: unit,
        decimalPlace: Number(decimal),
      });
    }
  }

  return {
    key: idx,
    row: idx + 2,
    name, uom, discipline, group,
    ranges,
    valid: errors.length === 0,
    errors,
  };
};

// ── Download Template ─────────────────────────────────────────────────────────
const downloadTemplate = async (uomList, disciplineList, groupList, selectedLabTypes) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Instruments");
  const hiddenSheet = workbook.addWorksheet("Lookups");
  hiddenSheet.state = "hidden";

  // Write lookup data
  const uomNames = uomList.map(u => u.uom_name);
  const disciplineNames = disciplineList.map(d => d.instrument_discipline);
  const groupNames = groupList.map(g => g.group_details);
  const uomSymbols = uomList.map(u => u.uom_printsysmbol);
  const decimalOptions = ["1", "2", "3", "4", "5"];

  // Col A = UOM names, Col B = Discipline names, Col C = Group names, Col D = UOM symbols, Col E = Decimal
  uomNames.forEach((n, i) => { hiddenSheet.getCell(`A${i + 1}`).value = n; });
  disciplineNames.forEach((n, i) => { hiddenSheet.getCell(`B${i + 1}`).value = n; });
  groupNames.forEach((n, i) => { hiddenSheet.getCell(`C${i + 1}`).value = n; });
  uomSymbols.forEach((n, i) => { hiddenSheet.getCell(`D${i + 1}`).value = n; });
  decimalOptions.forEach((n, i) => { hiddenSheet.getCell(`E${i + 1}`).value = n; });

  // Build columns
  const columns = [
    { header: "Instrument Name", key: "name", width: 28 },
    { header: "UOM", key: "uom", width: 20 },
    { header: "Discipline", key: "discipline", width: 22 },
    { header: "Group", key: "group", width: 22 },
  ];

  // Add conditional range columns per lab type
  for (const lab of selectedLabTypes) {
    columns.push(
      { header: `${lab} Range Min`, key: `${lab}_min`, width: 16 },
      { header: `${lab} Range Max`, key: `${lab}_max`, width: 16 },
      { header: `${lab} Range Unit`, key: `${lab}_unit`, width: 18 },
      { header: `${lab} Range Decimal`, key: `${lab}_decimal`, width: 18 },
    );
  }

  sheet.columns = columns;

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const isRangeCol = colNumber > 4;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isRangeCol ? "FF0D6E3F" : "FF1E3A5F" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" },
    };
  });
  headerRow.height = 26;

  // Add sample row
  const sampleData = {
    name: "Pressure Gauge",
    uom: uomNames[0] || "",
    discipline: disciplineNames[0] || "",
    group: groupNames[0] || "",
  };
  for (const lab of selectedLabTypes) {
    sampleData[`${lab}_min`] = 0;
    sampleData[`${lab}_max`] = 100;
    sampleData[`${lab}_unit`] = uomSymbols[0] || "";
    sampleData[`${lab}_decimal`] = 2;
  }
  const sampleRow = sheet.addRow(sampleData);
  sampleRow.font = { italic: true, color: { argb: "FF888888" } };

  // Data Validations (rows 2–1000)
  const uomRef = `Lookups!$A$1:$A$${Math.max(uomNames.length, 1)}`;
  const disciplineRef = `Lookups!$B$1:$B$${Math.max(disciplineNames.length, 1)}`;
  const groupRef = `Lookups!$C$1:$C$${Math.max(groupNames.length, 1)}`;
  const symbolRef = `Lookups!$D$1:$D$${Math.max(uomSymbols.length, 1)}`;
  const decimalRef = `Lookups!$E$1:$E$5`;

  for (let r = 2; r <= 1000; r++) {
    // UOM dropdown — column B
    sheet.getCell(`B${r}`).dataValidation = {
      type: "list", allowBlank: false, formulae: [uomRef],
      showErrorMessage: true, errorTitle: "Invalid UOM",
      error: "Select a valid UOM from the dropdown",
    };
    // Discipline dropdown — column C
    sheet.getCell(`C${r}`).dataValidation = {
      type: "list", allowBlank: false, formulae: [disciplineRef],
      showErrorMessage: true, errorTitle: "Invalid Discipline",
      error: "Select a valid discipline from the dropdown",
    };
    // Group dropdown — column D
    sheet.getCell(`D${r}`).dataValidation = {
      type: "list", allowBlank: false, formulae: [groupRef],
      showErrorMessage: true, errorTitle: "Invalid Group",
      error: "Select a valid group from the dropdown",
    };

    // Range column validations per lab type
    let colOffset = 5; // start after D
    for (const lab of selectedLabTypes) {
      // Unit dropdown
      const unitCol = sheet.getColumn(colOffset + 2).letter;
      sheet.getCell(`${unitCol}${r}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [symbolRef],
        showErrorMessage: true, errorTitle: "Invalid Unit",
        error: "Select a valid unit from the dropdown",
      };
      // Decimal dropdown
      const decCol = sheet.getColumn(colOffset + 3).letter;
      sheet.getCell(`${decCol}${r}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [decimalRef],
        showErrorMessage: true, errorTitle: "Invalid Decimal",
        error: "Select a decimal place (1-5)",
      };
      colOffset += 4;
    }
  }

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), "instrument_bulk_upload_template.xlsx");
};

// ── Preview Table Columns ─────────────────────────────────────────────────────
const buildPreviewColumns = (selectedLabTypes) => {
  const cols = [
    { title: "Row", dataIndex: "row", width: 60, align: "center" },
    { title: "Instrument Name", dataIndex: "name", width: 180, ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 100 },
    { title: "Discipline", dataIndex: "discipline", width: 130, ellipsis: true },
    { title: "Group", dataIndex: "group", width: 130, ellipsis: true },
  ];

  if (selectedLabTypes.length > 0) {
    cols.push({
      title: "Ranges",
      dataIndex: "ranges",
      width: 140,
      render: (ranges) =>
        ranges && ranges.length > 0
          ? ranges.map((r, i) => (
              <Tag key={i} color="blue" style={{ fontSize: 11, marginBottom: 2 }}>
                {r.labtype}: {r.min}–{r.max}
              </Tag>
            ))
          : <Text type="secondary" style={{ fontSize: 11 }}>None</Text>,
    });
  }

  cols.push({
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
  });

  return cols;
};

// ── Result Summary Columns ────────────────────────────────────────────────────
const resultCreatedCols = [
  { title: "Row", dataIndex: "row", width: 60 },
  { title: "Instrument Name", dataIndex: "instrument_name", width: 200 },
  { title: "ID", dataIndex: "instrument_id", width: 100 },
];
const resultFailedCols = [
  { title: "Row", dataIndex: "row", width: 60 },
  { title: "Instrument Name", dataIndex: "instrument_name", width: 180 },
  { title: "Errors", dataIndex: "errors", render: (errs) => errs?.join("; ") || "" },
];

// ── Main Component ────────────────────────────────────────────────────────────
const BulkUploadInstrumentModal = ({ isopen, onclose, onSuccess }) => {
  const auth = useContext(AuthContext);
  const { token } = theme.useToken();

  const [step, setStep] = useState(0); // 0=configure, 1=preview, 2=result
  const [loading, setLoading] = useState(false);

  // Lookup data
  const [uomList, setUomList] = useState([]);
  const [disciplineList, setDisciplineList] = useState([]);
  const [groupList, setGroupList] = useState([]);

  // Lab type selection
  const [selectedLabTypes, setSelectedLabTypes] = useState([]);

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsing, setParsing] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // ── Fetch lookup data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isopen) return;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        };

        const [uomRes, discRes, groupRes] = await Promise.all([
          fetch(config.Calibmaster.URL + "/api/uom/list", { method: "GET", headers }).then(r => r.json()),
          fetch(config.Calibmaster.URL + "/api/instrument-discipline/list", { method: "GET", headers }).then(r => r.json()),
          fetch(config.Calibmaster.URL + "/api/instrument-groups/list", { method: "GET", headers }).then(r => r.json()),
        ]);

        setUomList(uomRes.data || []);
        setDisciplineList(discRes.data || []);
        setGroupList(groupRes.data || []);
      } catch {
        GlobalNotification.error({ title: "Failed to load lookup data" });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isopen]);

  // ── Parse uploaded file ──────────────────────────────────────────────────
  const handleFile = async (file) => {
    setRawFile(file);
    setParsing(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const buf = await file.arrayBuffer();
      await workbook.xlsx.load(buf);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet || worksheet.rowCount < 2) {
        GlobalNotification.error({ title: "Empty File", description: "The Excel file has no data rows." });
        setParsing(false);
        return false;
      }

      // Extract headers from first row
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value ? String(cell.value).trim() : "";
      });

      // Convert rows to JSON objects
      const json = [];
      for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowObj = {};
        let hasData = false;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            const val = cell.value;
            rowObj[header] = val !== null && val !== undefined ? String(val).trim() : "";
            if (rowObj[header]) hasData = true;
          }
        });
        // Also fill missing headers with empty string
        headers.forEach(h => {
          if (h && !(h in rowObj)) rowObj[h] = "";
        });
        if (hasData) json.push(rowObj);
      }

      if (json.length === 0) {
        GlobalNotification.error({ title: "Empty File", description: "The Excel file has no data rows." });
        setParsing(false);
        return false;
      }

      // Check for required base columns
      const missing = BASE_COLUMNS.filter(c => !(c in json[0]));
      if (missing.length > 0) {
        GlobalNotification.error({
          title: "Missing Columns",
          description: `Required columns missing: ${missing.join(", ")}`,
        });
        setParsing(false);
        return false;
      }

      // Detect which lab types are in the file from column headers
      const fileHeaders = Object.keys(json[0]);
      const detectedLabTypes = LAB_TYPES.filter(lab => {
        const cols = getRangeColumns(lab);
        return cols.some(c => fileHeaders.includes(c));
      });

      if (detectedLabTypes.length > 0 && selectedLabTypes.length === 0) {
        setSelectedLabTypes(detectedLabTypes);
      }

      const uomNames = uomList.map(u => u.uom_name);
      const disciplineNames = disciplineList.map(d => d.instrument_discipline);
      const groupNames = groupList.map(g => g.group_details);

      const validated = json.map((row, idx) =>
        validateRow(row, idx, uomNames, disciplineNames, groupNames, detectedLabTypes.length > 0 ? detectedLabTypes : selectedLabTypes)
      );
      setParsedRows(validated);
      setStep(1);
    } catch (err) {
      console.error("Parse error:", err);
      GlobalNotification.error({ title: "Parse Error", description: "Could not read the Excel file." });
    } finally {
      setParsing(false);
    }
    return false;
  };


  // ── Submit to backend ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setUploading(true);
    try {
      const validRows = parsedRows.filter(r => r.valid);

      const instruments = validRows.map(r => ({
        _rowNum: r.row,
        instrument_name: r.name,
        uom_name: r.uom,
        discipline_name: r.discipline,
        group_name: r.group,
        ranges: r.ranges || [],
      }));

      const response = await fetch(config.Calibmaster.URL + "/api/instrument/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ instruments, lab_id: auth.labId }),
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

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <Modal
      open={isopen}
      onCancel={onclose}
      width={1060}
      footer={null}
      destroyOnClose
      title={
        <Space>
          <FileExcelOutlined style={{ color: "#217346", fontSize: 20 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Bulk Upload Instruments</span>
        </Space>
      }
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: "Configure & Download", icon: <DownloadOutlined /> },
          { title: "Preview & Validate", icon: <CheckCircleOutlined /> },
          { title: "Result", icon: <ToolOutlined /> },
        ]}
      />

      {/* ── STEP 0: Configure & Download ───────────────────────────────────── */}
      {step === 0 && (
        <Spin spinning={loading || parsing}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 20 }}
            message="Instructions"
            description={
              <ul style={{ margin: "8px 0 0 16px", paddingLeft: 0 }}>
                <li>Select the <b>Lab Type(s)</b> below — range columns will be included in the template for each selected type.</li>
                <li>Download the template — <b>UOM</b>, <b>Discipline</b>, and <b>Group</b> columns have <b>dropdown</b> with all available options.</li>
                <li>Fill in the data and upload. Duplicate instrument names will be skipped.</li>
              </ul>
            }
          />

          {/* Lab Type Selection */}
          <div style={{
            background: token.colorFillAlter,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 10,
            padding: "16px 24px",
            marginBottom: 24,
          }}>
            <Text strong style={{ display: "block", marginBottom: 12, fontSize: 14 }}>
              Select Lab Type(s) for Accept Range Columns:
            </Text>
            <Checkbox.Group
              value={selectedLabTypes}
              onChange={setSelectedLabTypes}
            >
              <Row gutter={16}>
                {LAB_TYPES.map(lt => (
                  <Col key={lt}>
                    <Checkbox
                      value={lt}
                      style={{
                        padding: "8px 20px",
                        border: selectedLabTypes.includes(lt) ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
                        borderRadius: 8,
                        background: selectedLabTypes.includes(lt) ? token.colorPrimaryBg : token.colorBgContainer,
                        fontWeight: selectedLabTypes.includes(lt) ? 600 : 400,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {lt}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
            {selectedLabTypes.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Template will include range columns: {selectedLabTypes.map(l =>
                    <Tag key={l} color="processing" style={{ fontSize: 11 }}>{l}: Min, Max, Unit, Decimal</Tag>
                  )}
                </Text>
              </div>
            )}
          </div>

          {/* Download Template Button */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              loading={loadingTemplate || loading}
              disabled={uomList.length === 0}
              onClick={async () => {
                setLoadingTemplate(true);
                await downloadTemplate(uomList, disciplineList, groupList, selectedLabTypes);
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
              UOM, Discipline & Group columns have <b>dropdowns</b> with your lab's data
              {selectedLabTypes.length > 0 && (
                <> • Range unit & decimal columns also have dropdowns</>
              )}
            </div>
          </div>

          <Divider>Upload Filled Template</Divider>

          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFile}
            style={{
              background: token.colorFillQuaternary,
              border: `2px dashed ${token.colorSuccess}`,
              borderRadius: 12,
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 8 }}>📂</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>
              Click or drag your Excel file here
            </p>
            <p style={{ color: token.colorTextSecondary }}>Supports .xlsx and .xls files</p>
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
            columns={buildPreviewColumns(selectedLabTypes)}
            dataSource={parsedRows}
            size="small"
            scroll={{ x: 900, y: 360 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={(r) => (r.valid ? "" : "ant-table-row-error")}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>Re-upload</Button>
            <Button
              type="primary"
              icon={<ToolOutlined />}
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
              Create {validCount} Instrument{validCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}

      {/* ── STEP 2: Result ─────────────────────────────────────────────────── */}
      {step === 2 && uploadResult && (
        <>
          <Result
            status={uploadResult.failed.length === 0 ? "success" : "warning"}
            title={`${uploadResult.created.length} Instrument${uploadResult.created.length !== 1 ? "s" : ""} Created Successfully`}
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

export default BulkUploadInstrumentModal;
