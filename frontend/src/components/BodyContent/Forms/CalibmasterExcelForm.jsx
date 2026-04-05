import { useState } from "react";
import { Card, Form, Image, Select, Upload, Button, Row, Col, Spin } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;


const getBase64 = file =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

export default function CalibmasterExcelForm({
    DropdownprocedureName,
    handleFileChange,
    handleCreateCalibmasterExcel,
}) {
    const [form] = Form.useForm();
    const [excelFile, setExcelFile] = useState(null);
    const [diagramFiles, setDiagramFiles] = useState([]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');


    const [submitting, setSubmitting] = useState(false); // ✅ submission state

    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const onFinish = async (values) => {
        try {
            setSubmitting(true); // ✅ disable button & show loader
            await handleCreateCalibmasterExcel({
                excelFile,
                masterId: values.masterId,
                DiagramImage: diagramFiles
            });
        } finally {
            setSubmitting(false); // ✅ re-enable button after finish
        }
    };

    return (
        <Card title="Add Calibmaster Excel">

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                style={{ maxWidth: "900px", margin: "auto" }}
                size="large"
            >
                {/* Select Procedure */}
                <Form.Item
                    name="masterId"
                    label="Select Procedure"
                    rules={[{ required: true, message: "Please select a procedure" }]}
                >
                    <Select
                        showSearch
                        placeholder="Select Procedure"
                        optionFilterProp="label"
                        allowClear
                        filterOption={(input, option) =>
                            option.label.toLowerCase().includes(input.toLowerCase())
                        }
                        options={DropdownprocedureName.map(item => ({
                            label: item.label || item.name, // Displayed text
                            value: item.value || item.name  // Underlying value
                        }))}
                    />
                </Form.Item>

                <Row gutter={70} style={{ marginTop: "20px" }}>
                    {/* Excel Drag-Drop Upload */}
                    <Col span={12}>
                        <Form.Item
                            label="Upload Your Excel Sheet Here"
                            name="excelFile"
                            rules={[{ required: true, message: "Please upload an Excel file" }]}
                        >
                            <Dragger
                                beforeUpload={(file) => {
                                    setExcelFile(file);
                                    handleFileChange(file);
                                    return false;
                                }}
                                listType="picture"
                                accept=".xlsx,.xls"
                                maxCount={1}
                                multiple={false}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag Excel file here</p>
                                <p className="ant-upload-hint">Only .xlsx or .xls files are allowed</p>
                            </Dragger>
                        </Form.Item>
                        {/* {error && <p className="error-text">{error}</p>} */}
                    </Col>

                    {/* Image Drag-Drop Upload */}
                    <Col span={12}>
                        <Form.Item label="Upload Diagram Images" name="diagramFiles">
                            <Dragger
                                listType="picture"
                                beforeUpload={async (file) => {
                                    const base64 = await getBase64(file); // convert to base64
                                    setDiagramFiles((prev) => [...prev, base64]); // store as string
                                    return false; // prevent auto upload
                                }}
                                accept="image/jpg,image/jpeg,image/png"
                                multiple
                                onPreview={handlePreview}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag images here</p>
                                <p className="ant-upload-hint">PNG, JPG, JPEG formats only</p>
                            </Dragger>
                        </Form.Item>
                        {/* {DiagramImageerror && (
                            <p className="error-text">{DiagramImageerror}</p>
                        )} */}

                        {previewImage && (
                            <Image
                                wrapperStyle={{ display: 'none' }}
                                preview={{
                                    visible: previewOpen,
                                    onVisibleChange: visible => setPreviewOpen(visible),
                                    afterOpenChange: visible => !visible && setPreviewImage(''),
                                }}
                                src={previewImage}
                            />
                        )}

                    </Col>
                </Row>

                {/* Submit Button */}
                <Form.Item style={{ marginTop: "30px" }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        disabled={submitting} // ✅ disable while submitting
                        loading={submitting}  // ✅ built-in AntD loader on button
                    >
                        Upload Excel
                    </Button>
                </Form.Item>

                <Spin size="large" spinning={submitting} fullscreen />
            </Form>
        </Card>
    );
}
