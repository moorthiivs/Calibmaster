import { useState, useEffect, useMemo, useContext } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import Swal from "sweetalert2";
import { Card, Space, Button, Tooltip, Row, Typography, Col, Input, Select, Spin, message, Tabs, Form } from "antd";
import { CloseCircleFilled, CloseOutlined, PlusOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import DraggableToken from "./DraggableToken";
import DropTargetArea from "./DropTargetArea";
import CertificatePreview from "./CertificatePreview";

const { Title } = Typography;

const CertificateFormatCreator = () => {
  const auth = useContext(AuthContext);
  const [formatTemplate, setFormatTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [extraFields, setExtraFields] = useState([]);
  const [extraValues, setExtraValues] = useState({});
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const [isLoading, setisLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("creator");

  // For Format No Configuration
  const [certificateFormatNo, setCertificateFormatNo] = useState("");
  const [observationFormatNo, setObservationFormatNo] = useState("");

  const [certificateFormatNoNABL, setCertificateFormatNoNABL] = useState("");
  const [certificateFormatNoNonNABL, setCertificateFormatNoNonNABL] = useState("");
  const [observationFormatNoNABL, setObservationFormatNoNABL] = useState("");
  const [observationFormatNoNonNABL, setObservationFormatNoNonNABL] = useState("");


  const staticTokens = [
    "labCode",
    "labType",
    "year",
    "yearRange",
    "srf",
    "itemCount",
    "month",
    "monthCustomer",
    "RunningNo"
  ];

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
      setFormatTemplate("")
      setPreview("")
      setExtraFields([])
      setExtraValues({})
      setCertificateFormatNoNABL("");
      setCertificateFormatNoNonNABL("");
      setObservationFormatNoNABL("");
      setObservationFormatNoNonNABL("");
      setIsEdit(false)
      return
    }

    try {

      setisLoading(true)
      const response = await fetch(
        `${config.Calibmaster.URL}/api/certificate-format/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      const res = await response.json();
      console.log(res);

      if (res) {
        setFormatTemplate(res.format_template || "");
        setExtraFields(res.required_fields.map((f) => f.name));
        setPreview(res.preview);
        const mapValues = {};
        res.required_fields.forEach((f) => (mapValues[f.name] = f.value));
        setExtraValues(mapValues);
        const { certificate_format_no, observation_format_no } = res?.format_no
        setCertificateFormatNoNABL(certificate_format_no?.nabl || "");
        setCertificateFormatNoNonNABL(certificate_format_no?.nonNabl || "");

        setObservationFormatNoNABL(observation_format_no?.nabl || "");
        setObservationFormatNoNonNABL(observation_format_no?.nonNabl || "");

        setIsEdit(true);
      }
    } catch (err) {
      console.log("No existing format");
    } finally {
      setisLoading(false)
    }
  };

  useEffect(() => {
    fetchExisting(labId);
  }, [labId]);

  const handleSave = async () => {
    if (!labId || !formatTemplate) return alert("Fill in all required fields.");

    setisLoading(true)
    try {
      const allTokens = Array.from(
        new Set(
          (formatTemplate.match(/{{(.*?)}}/g) || []).map((m) =>
            m.replace(/[{}]/g, "")
          )
        )
      );

      const fields = allTokens.map((key) => ({
        name: key,
        value: extraValues[key] || "",
      }));

      const allData = {
        labId,
        formatTemplate,
        requiredFields: fields,
        preview,
      };

      const response = await fetch(
        `${config.Calibmaster.URL}/api/certificate-format/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify(allData),
        }
      );

      const result = await response.json();


      if (response.ok) {
        //alert(result.message || "Format saved!");
        message.success("Format Saved SuccessFully")
      } else {
        alert(result.message || "Error saving format.");
        message.error(result.message || "Error saving format.")
      }
    } catch (err) {
      console.error(err);
      alert("Error saving format.");
    } finally {
      setisLoading(false)
    }
  };

  const promptTokenInput = async (token) => {
    if (token === "labType") {
      const { value: selected } = await Swal.fire({
        title: `Select value for '{{${token}}}'`,
        input: "select",
        inputOptions: {
          CAL: "CAL",
          TEST: "TEST",
        },
        inputPlaceholder: "Select lab type",
        showCancelButton: true,
      });
      return selected || null;
    }
    if (token === "year") {
      const years = Array.from({ length: 6 }, (_, i) => 2022 + i);
      const yearOptions = {};
      years.forEach((year) => {
        yearOptions[year.toString()] = `${year} (full)`;
        yearOptions[year.toString().slice(-2)] = `${year
          .toString()
          .slice(-2)} (short)`;
      });

      const { value: selected } = await Swal.fire({
        title: `Select year for '{{${token}}}'`,
        input: "select",
        inputOptions: yearOptions,
        inputPlaceholder: "Select year format",
        showCancelButton: true,
      });
      return selected || null;
    }
    if (["srf", "itemCount", "monthCustomer"].includes(token)) {
      return defaultValues[token] ?? `{{${token}}}`;
    }
    const { value: result } = await Swal.fire({
      title: `Enter value for '{{${token}}}'`,
      input: "text",
      inputPlaceholder: `Enter ${token} value`,
      showCancelButton: true,
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
      title: `Enter new field name`,
      input: "text",
      inputPlaceholder: "Enter token key (e.g., batchCode)",
      showCancelButton: true,
    });

    if (!token || !token.trim()) return;
    if (staticTokens.includes(token) || extraFields.includes(token)) return;

    setExtraFields((prev) => [...prev, token]);
    setExtraValues((prev) => ({ ...prev, [token]: "" }));
  };

  const removeExtraField = (key) => {
    setExtraFields((prev) => prev.filter((k) => k !== key));
    setExtraValues((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setFormatTemplate((prev) => {
      const updated = prev.replaceAll(`{{${key}}}`, "");
      console.log(updated, "Updated formatTemplate after removal");
      return updated;
    });
  };


  const tokenList = useMemo(() => {
    return Array.from(new Set([...staticTokens, ...extraFields]));
  }, [extraFields, staticTokens]);

  const disabledTokens = useMemo(() => {
    return tokenList.filter((token) => formatTemplate.includes(`{{${token}}}`));
  }, [formatTemplate, tokenList]);

  const fetchConfig = async () => {
    try {
      let response = await fetch(
        config.Calibmaster.URL + "/api/cms-setting/fetch-cms-certificate",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      response = await response.json();
      if (response?.result?.length > 0) {
        const { labList } = response;
        let newArray = [{ value: "", label: "Choose a Laboratory" }];
        labList.forEach((item, index) => {
          newArray[index + 1] = {
            value: item.lab_id,
            label: item.lab_name,
          };
        });
        setLabs(newArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const hasValidFields = Object.values(extraValues).some(
    (val) => val !== null && val !== undefined && val !== ""
  );

  const disableList = ["srf", "itemCount", "monthCustomer"];

  const saveFormatNoConfig = async () => {
    if (!labId)
      return message.warning("Please select a lab before saving format numbers");

    try {
      setisLoading(true);
      const payload = {
        labId,
        certificateFormatNo: {
          nabl: certificateFormatNoNABL,
          nonNabl: certificateFormatNoNonNABL,
        },
        observationFormatNo: {
          nabl: observationFormatNoNABL,
          nonNabl: observationFormatNoNonNABL,
        }
      };

      const response = await fetch(
        `${config.Calibmaster.URL}/api/certificate-format/format-no-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (response.ok) message.success("Format numbers saved successfully");
      else message.error(result.message || "Error saving format numbers");
    } catch (err) {
      console.error(err);
      message.error("Error saving format numbers");
    } finally {
      setisLoading(false);
    }
  };

  const tabItems = [
    {
      key: "creator",
      label: "Certificate Format Creator",
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card>
            <Title level={5} style={{ textAlign: "left" }}> <SettingOutlined /> Select Laboratory</Title>
            <Select
              defaultValue="Choose a Laboratory"
              options={labs}
              style={{ width: "99%" }}
              onChange={(e) => {
                console.log(e);
                setLabId(e)
              }}
              size="large"
              allowClear={true}
            />
          </Card>
          <Space direction="vertical" size={16} >

            <Card title="Token Library " extra={<>
              <Tooltip title="Add New Field" >
                <Button icon={<PlusOutlined />} onClick={addExtraField} variant="solid" type="primary" />
              </Tooltip>
            </>} >

              <div style={{ display: "flex", flexWrap: "wrap", padding: 10 }}>
                {tokenList.map((token) => (
                  <DraggableToken
                    key={token}
                    token={token}
                    disabled={disabledTokens.includes(token)}
                  />
                ))}
              </div>

            </Card>


            <Card>
              <DropTargetArea
                template={formatTemplate}
                setTemplate={setFormatTemplate}
                onTokenDrop={onTokenDrop}
              />

            </Card>




            {hasValidFields && isEdit && (
              <Card style={{ marginTop: 24 }}>
                <Title level={5}>✍ Edit Token Values</Title>
                {Object.keys(extraValues).map((field) => (
                  <Row gutter={12} align="middle" style={{ marginBottom: 12 }} key={field}>
                    <Col flex="auto">
                      <Input
                        addonBefore={`{{${field}}}`}
                        value={extraValues[field] || ""}
                        onChange={(e) => setExtraValues({ ...extraValues, [field]: e.target.value })}
                        disabled={disableList.includes(field)}
                        size="large"
                        addonAfter={<><Tooltip title="Remove Field">
                          <Button danger type="text" icon={<CloseCircleFilled style={{ fontSize: "20px" }} />} onClick={() => removeExtraField(field)} />
                        </Tooltip></>}
                      />
                    </Col>
                    <Col>

                    </Col>
                  </Row>
                ))}
              </Card>
            )}




            <CertificatePreview
              preview={preview}
              formatTemplate={formatTemplate}
              handleSave={handleSave}
              isLoading={isLoading}
            />

          </Space>
          <Spin fullscreen={true} size="large" spinning={isLoading} />
        </Space>
      ),
    },
    {
      key: "formatno",
      label: "Format No Configuration",
      children: (
        <Card>
          <Form layout="vertical">
            <Title level={5}>
              <SettingOutlined /> Format No Configuration
            </Title>

            <Form.Item label="Select Laboratory" required>
              <Select
                options={labs}
                style={{ width: "100%" }}
                value={labId}
                onChange={(e) => setLabId(e)}
              />
            </Form.Item>

            <Form.Item label="Certificate Format No (NABL)">
              <Input
                placeholder="e.g. LAB/F/25/Rev:07"
                value={certificateFormatNoNABL}
                onChange={(e) => setCertificateFormatNoNABL(e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Certificate Format No (Non-NABL)">
              <Input
                placeholder="e.g. LAB/F/25/Rev:07-A"
                value={certificateFormatNoNonNABL}
                onChange={(e) => setCertificateFormatNoNonNABL(e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Observation Format No (NABL)">
              <Input
                placeholder="e.g. LAB/F/25A/Rev:04"
                value={observationFormatNoNABL}
                onChange={(e) => setObservationFormatNoNABL(e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Observation Format No (Non-NABL)">
              <Input
                placeholder="e.g. LAB/F/25A/Rev:04-A"
                value={observationFormatNoNonNABL}
                onChange={(e) => setObservationFormatNoNonNABL(e.target.value)}
              />
            </Form.Item>


            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveFormatNoConfig}
              loading={isLoading}
            >
              Save Configuration
            </Button>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ maxWidth: 800, margin: "auto" }}>
        <h1 >Certificate Format Creator</h1>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </div>
    </DndProvider>
  );
};

export default CertificateFormatCreator;
