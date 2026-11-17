import { Modal, Form, Select, Input, DatePicker, Button, Space, Alert } from "antd";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";

const EditSRFModal = ({ isOpen, onclose, srf, onSaveSuccess }) => {
  const [form] = Form.useForm();
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    const target = e.target;
    // Only drag from modal header or title
    if (target.closest('.ant-modal-header') || target.closest('.ant-modal-title')) {
      setDragging(true);
      setRel({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.stopPropagation();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - rel.x,
        y: e.clientY - rel.y
      });
      e.stopPropagation();
      e.preventDefault();
    };

    const onMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, rel]);

  useEffect(() => {
    if (!isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({ labId: auth.labId }),
        });
        const data = await response.json();
        if (data.code === 200 || data.data) {
          setCompanies(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, auth.token, auth.labId]);

  useEffect(() => {
    if (srf) {
      form.setFieldsValue({
        customerId: srf.customer_id,
        customerDc: srf.customer_dc,
        customerDcDate: srf.customer_dc_date ? dayjs(srf.customer_dc_date) : null,
      });
      setSelectedFile(null);
    }
  }, [srf, form]);

  const handleFormSubmit = async (values) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      let uploadedFilePath = srf.customer_dc_file_path;

      // 1. Upload file if a new file is chosen
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(config.Calibmaster.URL + "/api/srf/upload-dc", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + auth.token,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.code === 200) {
          uploadedFilePath = uploadData.filename;
        } else {
          throw new Error(uploadData.message || "Failed to upload file");
        }
      }

      // 2. Submit SRF details update
      const finalCustomerDc = (values.customerDc && values.customerDc.trim()) ? values.customerDc.trim() : "NA";
      const bodyData = {
        srf_id: srf.srf_id,
        customer_id: values.customerId,
        customer_dc: finalCustomerDc,
        customer_dc_date: values.customerDcDate ? values.customerDcDate.format("YYYY-MM-DD") : null,
        customer_dc_file_path: uploadedFilePath,
      };

      const updateResponse = await fetch(config.Calibmaster.URL + "/api/srf/edit-srf-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData),
      });

      const updateData = await updateResponse.json();
      if (updateData.code === 200) {
        GlobalNotification.success({
          title: "SRF Details Updated Successfully",
        });
        onSaveSuccess();
        onclose();
      } else {
        setErrorMsg(updateData.message || "Failed to update SRF details");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error while saving SRF details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onclose}
      title={
        <div style={{ cursor: "move", width: "100%" }} className="draggable-header">
          Edit SRF Information
        </div>
      }
      footer={null}
      centered
      modalRender={(modal) => (
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
          onMouseDown={onMouseDown}
        >
          {modal}
        </div>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        className="mt-4"
      >
        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon className="mb-4" closable onClose={() => setErrorMsg("")} />
        )}

        <Form.Item
          name="customerId"
          label="Customer"
          rules={[{ required: true, message: "Please select customer" }]}
        >
          <Select
            showSearch
            placeholder="Select Customer"
            optionFilterProp="label"
            options={companies.map((c) => ({
              label: c.customer_name,
              value: c.customer_id,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="customerDc"
          label={
            <div className="flex justify-between items-center w-full">
              <span>Cust. DC (DC Number)</span>
              <button
                type="button"
                onClick={() => form.setFieldsValue({ customerDc: "NA" })}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer ml-4"
              >
                Set N/A
              </button>
            </div>
          }
        >
          <Input placeholder="Enter Customer DC Number (Default: NA)" />
        </Form.Item>

        <Form.Item
          name="customerDcDate"
          label="DC Date"
          rules={[
            { required: true, message: "Please select DC Date" },
            () => ({
              validator(_, value) {
                const maxDate = srf?.created_timestamp ? dayjs(srf.created_timestamp) : (srf?.srf_date ? dayjs(srf.srf_date) : dayjs());
                if (value && value.isAfter(maxDate, "day")) {
                  return Promise.reject(new Error("Customer DC Date cannot be after Inward/SRF date"));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            className="w-full"
            disabledDate={(current) => {
              const maxDate = srf?.created_timestamp ? dayjs(srf.created_timestamp) : (srf?.srf_date ? dayjs(srf.srf_date) : dayjs());
              return current && current.isAfter(maxDate, "day");
            }}
          />
        </Form.Item>

        <Form.Item label="DC File (PDF Only)">
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.type !== "application/pdf") {
                setErrorMsg("Only PDF files are allowed.");
                setSelectedFile(null);
              } else {
                setSelectedFile(file);
                setErrorMsg("");
              }
            }}
          />
          {srf?.customer_dc_file_path && (
            <div className="mt-1.5 text-xs text-gray-500">
              Current File:{" "}
              <a
                href={`${config.Calibmaster.URL}/dc_files/${srf.customer_dc_file_path}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-purple-600 hover:text-purple-800 font-semibold underline"
              >
                View Previous File
              </a>
            </div>
          )}
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Space>
            <Button onClick={onclose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Save Changes
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSRFModal;
