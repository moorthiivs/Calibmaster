import { useState, useEffect, useMemo, useContext } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import Swal from "sweetalert2";
import { Button, Tooltip, Input, Select, Spin, message, Tabs, Form } from "antd";
import { CloseCircleFilled, PlusOutlined, SaveOutlined, SettingOutlined, ExperimentOutlined, FileTextOutlined } from "@ant-design/icons";
import DraggableToken from "./DraggableToken";
import DropTargetArea from "./DropTargetArea";
import CertificatePreview from "./CertificatePreview";



const CertificateFormatCreator = () => {
  const auth = useContext(AuthContext);
  const [formatTemplate, setFormatTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [extraFields, setExtraFields] = useState([]);
  const [extraValues, setExtraValues] = useState({});
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("creator");

  const [certificateFormatNoNABL, setCertificateFormatNoNABL] = useState("");
  const [certificateFormatNoNonNABL, setCertificateFormatNoNonNABL] = useState("");
  const [observationFormatNoNABL, setObservationFormatNoNABL] = useState("");
  const [observationFormatNoNonNABL, setObservationFormatNoNonNABL] = useState("");

  const staticTokens = ["labCode", "labType", "year", "yearRange", "srf", "itemCount", "month", "monthCustomer", "RunningNo"];

  const defaultValues = () => {
    const now = new Date();
    const currentYear = parseInt("2025") || now.getFullYear();
    const yearShort = currentYear.toString().slice(-2);
    return {
      labCode: "",
      labType: "",
      year: yearShort,
      yearRange: "",
      month: "",
      srf: `{{SRF}}`,
      itemCount: `{{ItemCount}}`,
      monthCustomer: `{{MonthCustomer}}`,
      ...extraValues,
    };
  };

  const replaceTemplate = (template, data) =>
    template.replace(/{{(.*?)}}/g, (_, key) => data[key] ?? `{{${key}}}`);

  useEffect(() => {
    const dummy = defaultValues();
    setPreview(replaceTemplate(formatTemplate, dummy));
  }, [formatTemplate, extraValues]);

  const fetchExisting = async (id) => {
    if (!id) {
      setFormatTemplate(""); setPreview(""); setExtraFields([]); setExtraValues({});
      setCertificateFormatNoNABL(""); setCertificateFormatNoNonNABL("");
      setObservationFormatNoNABL(""); setObservationFormatNoNonNABL("");
      setIsEdit(false); return;
    }
    try {
      setisLoading(true);
      const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
      });
      const res = await response.json();
      if (res) {
        setFormatTemplate(res.format_template || "");
        setExtraFields(res.required_fields.map((f) => f.name));
        setPreview(res.preview);
        const mapValues = {};
        res.required_fields.forEach((f) => (mapValues[f.name] = f.value));
        setExtraValues(mapValues);
        const { certificate_format_no, observation_format_no } = res?.format_no;
        setCertificateFormatNoNABL(certificate_format_no?.nabl || "");
        setCertificateFormatNoNonNABL(certificate_format_no?.nonNabl || "");
        setObservationFormatNoNABL(observation_format_no?.nabl || "");
        setObservationFormatNoNonNABL(observation_format_no?.nonNabl || "");
        setIsEdit(true);
      }
    } catch (err) {
      console.log("No existing format");
    } finally {
      setisLoading(false);
    }
  };

  useEffect(() => { fetchExisting(labId); }, [labId]);

  const handleSave = async () => {
    if (!labId || !formatTemplate) return alert("Fill in all required fields.");
    setisLoading(true);
    try {
      const allTokens = Array.from(new Set((formatTemplate.match(/{{(.*?)}}/g) || []).map((m) => m.replace(/[{}]/g, ""))));
      const fields = allTokens.map((key) => ({ name: key, value: extraValues[key] || "" }));
      const allData = { labId, formatTemplate, requiredFields: fields, preview };
      const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
        body: JSON.stringify(allData),
      });
      const result = await response.json();
      if (response.ok) message.success("Format Saved Successfully");
      else { alert(result.message || "Error saving format."); message.error(result.message || "Error saving format."); }
    } catch (err) {
      console.error(err); alert("Error saving format.");
    } finally {
      setisLoading(false);
    }
  };

  const promptTokenInput = async (token) => {
    if (token === "labType") {
      const { value: selected } = await Swal.fire({
        title: `Select value for '{{${token}}}'`, input: "select",
        inputOptions: { CAL: "CAL", TEST: "TEST" }, inputPlaceholder: "Select lab type", showCancelButton: true,
      });
      return selected || null;
    }
    if (token === "year") {
      const years = Array.from({ length: 6 }, (_, i) => 2022 + i);
      const yearOptions = {};
      years.forEach((year) => {
        yearOptions[year.toString()] = `${year} (full)`;
        yearOptions[year.toString().slice(-2)] = `${year.toString().slice(-2)} (short)`;
      });
      const { value: selected } = await Swal.fire({
        title: `Select year for '{{${token}}}'`, input: "select",
        inputOptions: yearOptions, inputPlaceholder: "Select year format", showCancelButton: true,
      });
      return selected || null;
    }
    if (["srf", "itemCount", "monthCustomer"].includes(token)) {
      return defaultValues[token] ?? `{{${token}}}`;
    }
    const { value: result } = await Swal.fire({
      title: `Enter value for '{{${token}}}'`, input: "text",
      inputPlaceholder: `Enter ${token} value`, showCancelButton: true,
    });
    return result || null;
  };

  const onTokenDrop = async (token) => {
    const value = await promptTokenInput(token, defaultValues);
    if (value === null) return null;
    setExtraValues((prev) => ({ ...prev, [token]: value }));
    return value;
  };

  const addExtraField = async () => {
    const { value: token } = await Swal.fire({
      title: `Enter new field name`, input: "text",
      inputPlaceholder: "Enter token key (e.g., batchCode)", showCancelButton: true,
    });
    if (!token || !token.trim()) return;
    if (staticTokens.includes(token) || extraFields.includes(token)) return;
    setExtraFields((prev) => [...prev, token]);
    setExtraValues((prev) => ({ ...prev, [token]: "" }));
  };

  const removeExtraField = (key) => {
    setExtraFields((prev) => prev.filter((k) => k !== key));
    setExtraValues((prev) => { const updated = { ...prev }; delete updated[key]; return updated; });
    setFormatTemplate((prev) => prev.replaceAll(`{{${key}}}`, ""));
  };

  const tokenList = useMemo(() => Array.from(new Set([...staticTokens, ...extraFields])), [extraFields, staticTokens]);
  const disabledTokens = useMemo(() => tokenList.filter((token) => formatTemplate.includes(`{{${token}}}`)), [formatTemplate, tokenList]);
  const hasValidFields = Object.values(extraValues).some((val) => val !== null && val !== undefined && val !== "");
  const disableList = ["srf", "itemCount", "monthCustomer"];

  const fetchConfig = async () => {
    try {
      let response = await fetch(config.Calibmaster.URL + "/api/cms-setting/fetch-cms-certificate", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
      });
      response = await response.json();
      if (response?.result?.length > 0) {
        const { labList } = response;
        let newArray = [{ value: "", label: "Choose a Laboratory" }];
        labList.forEach((item, index) => { newArray[index + 1] = { value: item.lab_id, label: item.lab_name }; });
        setLabs(newArray);
      }
    } catch (error) { console.log(error); }
  };

  useEffect(() => { fetchConfig(); }, []);

  const saveFormatNoConfig = async () => {
    if (!labId) return message.warning("Please select a lab before saving format numbers");
    try {
      setisLoading(true);
      const payload = {
        labId,
        certificateFormatNo: { nabl: certificateFormatNoNABL, nonNabl: certificateFormatNoNonNABL },
        observationFormatNo: { nabl: observationFormatNoNABL, nonNabl: observationFormatNoNonNABL },
      };
      const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/format-no-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) message.success("Format numbers saved successfully");
      else message.error(result.message || "Error saving format numbers");
    } catch (err) {
      console.error(err); message.error("Error saving format numbers");
    } finally {
      setisLoading(false);
    }
  };

  // ── Tab: Certificate Format Creator ─────────────────────────
  const CreatorTab = (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="flex flex-col gap-3 h-full">

      {/* ── Lab Selector ── */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <SettingOutlined className="text-blue-500 text-lg" />
        <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Select Laboratory</span>
        <Select
          defaultValue=""
          options={labs}
          className="flex-1"
          onChange={(e) => setLabId(e)}
          size="large"
          allowClear
          placeholder="Choose a Laboratory"
          style={{ minWidth: 200 }}
        />
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={isLoading}
          size="large"
          className="!rounded-lg !font-semibold !px-6"
          disabled={!labId || !formatTemplate}
        >
          Save Format
        </Button>
      </div>

      {/* ── Main Split Panel ── */}
      <div className="flex gap-3 flex-1" style={{ height: "calc(100vh - 220px)", overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: "42%", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Token Library */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ExperimentOutlined className="text-indigo-500" />
                <span className="text-sm font-semibold text-gray-700">Token Library</span>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                  {tokenList.length} tokens
                </span>
              </div>
              <Tooltip title="Add Custom Token">
                <Button
                  icon={<PlusOutlined />}
                  onClick={addExtraField}
                  type="primary"
                  size="small"
                  className="!rounded-lg"
                />
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {tokenList.map((token) => (
                <DraggableToken
                  key={token}
                  token={token}
                  disabled={disabledTokens.includes(token)}
                />
              ))}
            </div>
          </div>

          {/* Format Builder / Drop Zone */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
              <FileTextOutlined className="text-emerald-500" />
              <span className="text-sm font-semibold text-gray-700">Format Builder</span>
              <span className="text-xs text-gray-400 ml-1">drag tokens above into the editor</span>
            </div>
            <div className="p-3">
              <DropTargetArea
                template={formatTemplate}
                setTemplate={setFormatTemplate}
                onTokenDrop={onTokenDrop}
              />
            </div>
          </div>

          {/* Edit Token Values — always fully visible, scrolls internally if many fields */}
          {hasValidFields && isEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm flex-shrink-0">
              <div className="px-4 py-2 border-b border-amber-200">
                <span className="text-sm font-semibold text-amber-700">✍ Edit Token Values</span>
              </div>
              <div className="p-3 flex flex-col gap-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {Object.keys(extraValues).map((field) => (
                  <Input
                    key={field}
                    addonBefore={
                      <span className="text-xs font-mono text-indigo-600">{`{{${field}}}`}</span>
                    }
                    value={extraValues[field] || ""}
                    onChange={(e) => setExtraValues({ ...extraValues, [field]: e.target.value })}
                    disabled={disableList.includes(field)}
                    size="middle"
                    addonAfter={
                      <Tooltip title="Remove Field">
                        <Button
                          danger type="text" size="small"
                          icon={<CloseCircleFilled style={{ fontSize: "16px" }} />}
                          onClick={() => removeExtraField(field)}
                        />
                      </Tooltip>
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Preview ── */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">📄 Live Preview</span>
            {preview && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                {preview}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CertificatePreview
              preview={preview}
              formatTemplate={formatTemplate}
              handleSave={handleSave}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <Spin fullscreen size="large" spinning={isLoading} />
    </div>
  );

  // ── Tab: Format No Configuration ─────────────────────────────
  const FormatNoTab = (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <SettingOutlined className="text-blue-500 text-lg" />
        <h2 className="text-base font-bold text-gray-700 m-0">Format No Configuration</h2>
      </div>

      {/* Lab Select */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          Select Laboratory <span className="text-red-500">*</span>
        </label>
        <Select
          options={labs}
          className="w-full"
          value={labId}
          onChange={(e) => setLabId(e)}
          size="large"
          placeholder="Choose a Laboratory"
        />
      </div>

      {/* 2-column grid for format nos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-blue-700 m-0">📋 Certificate Format No</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">NABL</label>
            <Input
              size="large"
              placeholder="e.g. LAB/F/25/Rev:07"
              value={certificateFormatNoNABL}
              onChange={(e) => setCertificateFormatNoNABL(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Non-NABL</label>
            <Input
              size="large"
              placeholder="e.g. LAB/F/25/Rev:07-A"
              value={certificateFormatNoNonNABL}
              onChange={(e) => setCertificateFormatNoNonNABL(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-emerald-700 m-0">📊 Observation Format No</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">NABL</label>
            <Input
              size="large"
              placeholder="e.g. LAB/F/25A/Rev:04"
              value={observationFormatNoNABL}
              onChange={(e) => setObservationFormatNoNABL(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Non-NABL</label>
            <Input
              size="large"
              placeholder="e.g. LAB/F/25A/Rev:04-A"
              value={observationFormatNoNonNABL}
              onChange={(e) => setObservationFormatNoNonNABL(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={saveFormatNoConfig}
        loading={isLoading}
        size="large"
        className="!rounded-xl !font-semibold self-start !px-8"
      >
        Save Configuration
      </Button>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{ fontFamily: "'Inter', sans-serif", height: "100vh" }}
        className="flex flex-col bg-gray-50 px-4 pt-4 pb-2"
      >
        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <FileTextOutlined className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 m-0 leading-tight">Certificate Format Creator</h1>
            <p className="text-xs text-gray-400 m-0">Drag tokens to build your certificate number format</p>
          </div>
        </div>

        {/* ── Custom Tab Bar ── */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("creator")}
            style={{
              fontFamily: "'Inter', sans-serif",
              padding: "10px 22px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              background: activeTab === "creator"
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "#e5e7eb",
              color: activeTab === "creator" ? "#ffffff" : "#6b7280",
              boxShadow: activeTab === "creator"
                ? "0 4px 14px rgba(37, 99, 235, 0.35)"
                : "none",
            }}
          >
            <FileTextOutlined />
            Certificate Format Creator
          </button>

          <button
            onClick={() => setActiveTab("formatno")}
            style={{
              fontFamily: "'Inter', sans-serif",
              padding: "10px 22px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              background: activeTab === "formatno"
                ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                : "#e5e7eb",
              color: activeTab === "formatno" ? "#ffffff" : "#6b7280",
              boxShadow: activeTab === "formatno"
                ? "0 4px 14px rgba(37, 99, 235, 0.35)"
                : "none",
            }}
          >
            <SettingOutlined />
            Format No Configuration
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "creator" ? CreatorTab : FormatNoTab}
        </div>
      </div>
    </DndProvider>
  );
};

export default CertificateFormatCreator;
