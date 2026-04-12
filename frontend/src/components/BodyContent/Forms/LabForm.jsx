import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    Upload,
    Button,
    Checkbox,
    Typography,
    Row,
    Col,
    Card,
    Modal,
    Image,
} from "antd";
import { InboxOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import config from "../../../utils/config.js";
const { Dragger } = Upload;

const { Title } = Typography;

const LabForm = ({
    mode = "create",
    initialValues = {},
    loading = false,
    onSubmit,
}) => {
    const [form] = Form.useForm();

    // State for image preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");
    const [isDirty, setIsDirty] = useState(false);



    useEffect(() => {
        if (mode === "edit" && initialValues) {
            const convertToFileList = (fileName) => {
                if (!fileName) return [];
                // ✅ Replace with your actual image URL base
                const fileUrl = `${config.Calibmaster.URL}/images/${fileName}`;
                return [
                    {
                        uid: "-1",
                        name: fileName,
                        status: "done",
                        url: fileUrl,
                    },
                ];
            };

            const formattedValues = {
                ...initialValues,
                brandLogo: convertToFileList(initialValues.brandLogo),
                otherLogo1: convertToFileList(initialValues.otherLogo1),
                otherLogo2: convertToFileList(initialValues.otherLogo2),
                sealLogo: convertToFileList(initialValues.sealLogo),
                nablLogo: convertToFileList(initialValues.nablLogo),
                nablQr1: convertToFileList(initialValues.nablQR1),
                nablQr2: convertToFileList(initialValues.nablQR2),
            };

            form.setFieldsValue(formattedValues);
        }
    }, [mode, initialValues, form]);




    const getBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }

        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf("/") + 1));
    };

    const uploadProps = {
        beforeUpload: () => false, // prevent auto upload
        listType: "picture-card",
        maxCount: 1,
        onPreview: handlePreview,
        showUploadList: {
            showRemoveIcon: true,
            showPreviewIcon: true,
            previewIcon: <EyeOutlined />,
            removeIcon: <DeleteOutlined />,
        },
    };


    const handleFinish = async (values) => {
        try {
            const convertImage = async (fileList, originalValue) => {
                if (!fileList || fileList.length === 0) return null;

                const file = fileList[0];

                // 🆕 CASE 1: If user uploaded a new image (has originFileObj)
                if (file.originFileObj) {
                    const base64 = await getBase64(file.originFileObj);
                    return {
                        filename: file.name,
                        mimeType: file.type,
                        data: base64,
                    };
                }

                // 🆕 CASE 2: If user did not change image (existing URL only)
                // Check if it matches original image name or URL → then keep it null
                if (file.url && originalValue && originalValue[0]?.url === file.url) {
                    return null;
                }

                // Optional fallback (if something unexpected)
                return null;
            };

            // 🧠 Get original images from initialValues (used to compare)
            const original = initialValues || {};

            // 🖼 Convert only changed images to base64; unchanged = null
            const brandLogo = await convertImage(values.brandLogo, original.brandLogo);
            const otherLogo1 = await convertImage(values.otherLogo1, original.otherLogo1);
            const otherLogo2 = await convertImage(values.otherLogo2, original.otherLogo2);
            const sealLogo = await convertImage(values.sealLogo, original.sealLogo);
            const nablLogo = await convertImage(values.nablLogo, original.nablLogo);
            const nablQR1 = await convertImage(values.nablQr1, original.nablQr1);
            const nablQR2 = await convertImage(values.nablQr2, original.nablQr2);

            const finalData = {
                ...values,
                brandLogo,
                otherLogo1,
                otherLogo2,
                sealLogo,
                nablLogo,
                nablQR1,
                nablQR2,
            };

            console.log("Final Form Data:", finalData);
            onSubmit(finalData);
            setIsDirty(false);
        } catch (error) {
            console.error("Error preparing form data:", error);
        }
    };

    return (
        <>
            <Form
                layout="vertical"
                form={form}
                onFinish={handleFinish}
                initialValues={initialValues}
                onValuesChange={() => {
                    if (!isDirty) setIsDirty(true);
                }}
            >
                <Card title={`${mode === "edit" ? "Edit Lab" : "Create New Lab"}`}>
                    <Title level={4}>Lab Information</Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Lab Name"
                                name="name"
                                rules={[{ required: true, message: "Please enter lab name" }]}
                            >
                                <Input placeholder="Enter lab name" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Lab Website"
                                name="labWebsite"
                                rules={[{ required: true, message: "Please enter lab website" }]}
                            >
                                <Input placeholder="Enter website" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Address Line 1"
                                name="address1"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter address line 1" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Address Line 2" name="address2">
                                <Input placeholder="Enter address line 2" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Address Line 3" name="address3">
                                <Input placeholder="Enter address line 3" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                label="City"
                                name="city"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter city" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="State"
                                name="state"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter state" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Country"
                                name="country"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter country" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                label="GST Number"
                                name="gstNumber"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter GST Number" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                label="Pincode"
                                name="pincode"
                                rules={[{ required: true }]}
                            >
                                <Input type="number" placeholder="Enter pincode" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Contact Email"
                                name="contactEmail"
                                rules={[{ type: "email" }]}
                            >
                                <Input placeholder="Enter contact email" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Contact Number1"
                                name="contactNumber1"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter contact number1" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                label="Contact Number 2"
                                name="contactNumber2"
                                rules={[{ required: true }]}
                            >
                                <Input placeholder="Enter contact number2" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Title level={4}>Smtp  Setup</Title>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                label="Email Smtp Server Host"
                                name="emailSmtpServerHost"
                            >
                                <Input placeholder="Email Smtp Server Host" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Email Smtp Server Port"
                                name="emailSmtpServerPort"
                            >
                                <Input placeholder="Email Smtp Server Port" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                label="Sender Email"
                                name="senderEmail"
                                rules={[{ type: "email" }]}
                            >
                                <Input placeholder="Sender Email" size="large" />
                            </Form.Item>
                        </Col>


                        <Col span={6}>
                            <Form.Item
                                label="Sender Password"
                                name="senderPassword"

                            >
                                <Input placeholder="Sender Password" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>



                    <Title level={4}>Branding & Logos</Title>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Brand Logo"
                                name="brandLogo"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                                rules={[{ required: true }]}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload Brand Logo
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Other Brand Logo 1"
                                name="otherLogo1"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload Other Brand Logo 1
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Other Brand Logo 2"
                                name="otherLogo2"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload Other Brand Logo 2
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>
                    </Row>




                    <Title level={4}>Seal & NABL Logos</Title>
                    <Row gutter={16}>

                        <Col span={12}>
                            <Form.Item
                                label="Seal Logo"
                                name="sealLogo"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                                rules={[{ required: true }]}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload Seal Logo
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="NABL Logo"
                                name="nablLogo"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                                rules={[{ required: true }]}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload NABL Logo
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Title level={4}>QR Code Info</Title>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="NABL Certificate of Accreditation QR code"
                                name="nablQr1"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload Brand Logo
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>


                        <Col span={12}>
                            <Form.Item
                                label="NABL Scope of Accreditation QR Code"
                                name="nablQr2"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e.fileList}
                            >
                                <Dragger
                                    {...uploadProps}
                                    accept="image/*"
                                    onPreview={handlePreview}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        Click or drag image to upload NABL Logo
                                    </p>
                                    <p className="ant-upload-hint">Supports only one image</p>
                                </Dragger>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="NABL Certificate of Accreditation URL" name="NableURL_1">
                                <Input placeholder="Enter address line 3" size="large" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="NABL Scope of Accreditation URL" name="NableURL_2">
                                <Input placeholder="Enter address line 3" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {mode === "create" && (
                        <>
                            <Title level={4}>Admin Details</Title>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Form.Item
                                        label="Admin Name"
                                        name="adminName"
                                        rules={[{ required: true }]}
                                    >
                                        <Input placeholder="Enter admin name" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        label="Admin Email"
                                        name="adminEmail"
                                        rules={[{ required: true, type: "email" }]}
                                    >
                                        <Input placeholder="Enter admin email" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        label="Admin Password"
                                        name="adminPassword"
                                        rules={[{ required: true }]}
                                    >
                                        <Input.Password placeholder="Enter admin password" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={6} style={{ marginTop: "30px" }}>
                                    <Form.Item name="isActive" valuePropName="checked" >
                                        <Checkbox >Lab Active</Checkbox>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>

                    )}



                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                disabled={mode === "edit" && !isDirty}
                                size="large"
                            >
                                {mode === "edit" ? "Update Lab" : "Create Lab"}
                            </Button>
                        </Form.Item>
                    </div>



                </Card>
            </Form >

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <Image
                        wrapperStyle={{ display: 'none' }}
                        preview={{
                            visible: previewOpen,
                            onVisibleChange: (visible) => setPreviewOpen(visible),
                            afterOpenChange: (visible) => !visible && setPreviewImage(''),
                        }}
                        src={previewImage}
                    />
                )
            }
        </>
    );
};

export default LabForm;
