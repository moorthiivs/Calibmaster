import React, { useEffect, useState } from "react";
import { Card, Input, Button, Upload, message, Form, Row, Col, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import config from "../../../utils/config.js";


const EmployeeForm = ({ mode = "create", employeeData = null, onSubmit, setFiles }) => {
    const [form] = Form.useForm();

    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        if (mode === "edit" && employeeData) {
            form.setFieldsValue({
                empTitle: employeeData.empTitle,
                empFullName: employeeData.empFullName,
                empRole: employeeData.empRole,
            });

            if (employeeData.employee_signature) {
                setFileList([
                    {
                        uid: "-1",
                        name: "Existing Signature",
                        status: "done",
                        url: `${config.Calibmaster.URL}/${employeeData.employee_signature}`,
                    },
                ]);
            }
        }
    }, []);

    // const handleUploadChange = ({ fileList }) => {
    //     setFiles(fileList[0])
    //     setFileList(fileList);
    // };



    const handleUploadChange = ({ fileList: newFileList }) => {
        // Always keep only the last uploaded file
        const latestList = newFileList.slice(-1);

        if (latestList.length > 0) {
            const fileItem = latestList[0];

            // If user uploads a new image, show its preview instead of existing
            if (fileItem.originFileObj) {
                fileItem.url = URL.createObjectURL(fileItem.originFileObj);
                setFiles(fileItem.originFileObj);
            } else {
                // If user didn't upload new, keep existing
                setFiles(null);
            }
        } else {
            setFiles(null);
        }

        setFileList(latestList);
    };

    const handleRemove = () => {
        setFileList([]);
        setFiles(null);
    };
    return (
        <div>
            <Card title={mode === "edit" ? "Edit Employee" : "Create Employee"}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onSubmit}
                    autoComplete="off"
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            {/* <Form.Item
                                label="Employee Title"
                                name="empTitle"
                                rules={[{ required: true, message: "Employee Title is required" }]}
                            >
                                <Input placeholder="Enter Employee Title" size="large" />
                            </Form.Item> */}
                            <Form.Item
                                label="Employee Title"
                                name="empTitle"
                                rules={[{ required: true, message: "Employee Title is required" }]}
                            >
                                <Select
                                    mode="combobox"
                                    placeholder="Select or Enter Employee Title"
                                    size="large"
                                    showSearch
                                    allowClear
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option?.children?.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    <Option value="Mr.">👨‍🔬 Mr.</Option>
                                    <Option value="Ms.">👩‍🔬 Ms.</Option>
                                    <Option value="Mrs.">👩‍🔬 Mrs.</Option>
                                    <Option value="Dr.">🧪 Dr.</Option>
                                    <Option value="Er.">⚙️ Er.</Option>
                                    <Option value="Engr.">📏 Engr.</Option>
                                    <Option value="Tech.">🧑‍🏭 Tech.</Option>
                                    <Option value="Sr. Tech.">🔬 Sr. Tech.</Option>
                                    <Option value="Jr. Tech.">🧰 Jr. Tech.</Option>
                                    <Option value="QAM.">📋 QAM.</Option>
                                </Select>
                            </Form.Item>

                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Employee Full Name"
                                name="empFullName"
                                rules={[{ required: true, message: "Employee Full Name is required" }]}
                            >
                                <Input placeholder="Enter Employee Full Name" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Employee Role"
                                name="empRole"
                                rules={[{ required: true, message: "Employee Role is required" }]}
                            >
                                <Input placeholder="Enter Employee Role" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Employee Signature"
                                required
                                tooltip="Only PNG files allowed"
                                name="employee_signature"
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={handleUploadChange}
                                    onRemove={handleRemove}
                                    accept=".png"
                                    maxCount={1}
                                    listType="picture"
                                    size="large"
                                    onPreview={(file) => window.open(file.url || URL.createObjectURL(file.originFileObj))}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        {mode === "edit"
                                            ? "Update Signature (PNG)"
                                            : "Upload Signature (PNG)"}
                                    </Button>
                                </Upload>
                            </Form.Item>
                        </Col>

                        <Col span={24} style={{ textAlign: "center" }}>
                            <Button type="primary" htmlType="submit" size='large'>
                                {mode === "edit" ? "Update" : "Create"}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};

export default EmployeeForm;
