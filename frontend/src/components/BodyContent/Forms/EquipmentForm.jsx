import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Card,
    Spin,
    Upload,
    message
} from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const DEFAULT_INITIAL_DATA = {};

const EquipmentForm = ({
    mode = "create",
    initialData = DEFAULT_INITIAL_DATA,
    onSubmit,
    Discipline = [],
    Group = [],
    equipmentStatus = [],
    disciplineHandler,
    handleFileChange,
    isselectedDiscipline,
    makes,
    models,
    isLoading = false
}) => {
    const [form] = Form.useForm();
    const [isDirty, setIsDirty] = useState(false);
    const [selectedDiscipline, setSelectedDiscipline] = useState(initialData.discipline || "");
    const [originalData, setOriginalData] = useState(initialData);

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
            if (initialData.discipline) setSelectedDiscipline(initialData.discipline);
            setOriginalData(initialData);
        }
    }, [initialData, form]);

    const handleFieldsChange = (_, allFields) => {
        const hasChanges = allFields.some(field => {
            const originalValue = originalData[field.name[0]];
            return field.value !== originalValue;
        });
        setIsDirty(hasChanges);
    };

    // const handleFieldsChange = () => {
    //     if (mode === "edit") {
    //         const touched = form.isFieldsTouched(true);
    //         setIsDirty(touched);
    //     }
    // };


    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
    ];

    const draggerProps = {
        name: "file",
        multiple: false,
        beforeUpload: (file) => {
            if (!allowedTypes.includes(file.type)) {
                message.error("Please select a JPEG, PNG, or PDF file.");
                return Upload.LIST_IGNORE; // don't show invalid file
            }
            if (file.size > 2 * 1024 * 1024) {
                message.error("File size must be less than 2MB.");
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        onChange(info) {
            const validFiles = info.fileList.filter(
                (f) => allowedTypes.includes(f.type)
            );
            if (validFiles.length !== info.fileList.length) {
                message.error("Invalid file removed from list.");
            }
            info.fileList = validFiles;

            handleFileChange({ ...info, fileList: validFiles });
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };



    return (
        <Card title={mode === "edit" ? "Edit Equipment" : "Add Master List of Equipments"}>
            <Form
                layout="vertical"
                form={form}
                onFinish={onSubmit}
                initialValues={initialData}
                onFieldsChange={handleFieldsChange}
                size="large"
            >
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Select Discipline"
                            name="discipline"
                            rules={[{ required: true, message: "Please select discipline" }]}
                        >
                            <Select
                                labelInValue
                                placeholder="Select Discipline Name"
                                allowClear
                                onChange={(selected) => {
                                    setSelectedDiscipline(selected.label);
                                    disciplineHandler(selected.value);
                                }}

                            >
                                {Discipline.map((disc) => (
                                    <Option key={disc.value} value={disc.value}>
                                        {disc.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Select Group"
                            name="group"
                            rules={[{ required: true, message: "Please select group" }]}
                        >
                            <Select placeholder="Select Group" allowClear>
                                {Group.map(doc => (
                                    <Option key={doc.value} value={doc.value}>
                                        {doc.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Standard Maintained"
                            name="standardMaintained"
                            rules={[{ required: true, message: "Please enter Standard Maintained" }]}
                        >
                            <Input placeholder="Enter Standard Maintained" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Name Of Equipment"
                            name="nameOfEquipment"
                            rules={[{ required: true, message: "Please enter Name of Equipment" }]}
                        >
                            <Input placeholder="Name Of Equipment" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="UID" name="uid">
                            <Input placeholder="Enter UID" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Type Of Facility" name="typeOfFacility">
                            <Input placeholder="Type Of Facility" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        {/* <Form.Item label="Make" name="make" rules={[{ required: true, message: "Please enter Make" }]}>
                            <Input placeholder="Make" />
                        </Form.Item> */}

                        <Form.Item label="Make" name="make" rules={[{ required: true, message: "Please enter Make" }]} validateTrigger="onChange">
                            <Select options={makes && makes.map((v) => ({ value: v.name, label: v.name }))} allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                        </Form.Item>

                    </Col>

                    <Col xs={24} md={12}>
                        {/* <Form.Item label="Model Type" name="modelType" rules={[{ required: true, message: "Please enter Model Type" }]}>
                            <Input placeholder="Model Type" />
                        </Form.Item> */}

                        <Form.Item label="Model Type" name="modelType" rules={[{ required: true, message: "Please enter Model Type" }]} validateTrigger="onChange">
                            <Select options={models && models.map((v) => ({ value: v.name, label: v.name }))} allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        {/* <Form.Item label="Year Of Make" name="yearOfMake" rules={[{ required: true, message: "Please enter Year of Make" }]}>
                            <Input placeholder="Year Of Make" />
                        </Form.Item> */}


                        <Form.Item label="Year Of Make" name="yearOfMake" rules={[{ required: true, message: "Please select Year of Make" }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Serial No." name="serialNo" rules={[{ required: true, message: "Please enter Serial No." }]}>
                            <Input placeholder="Serial No." />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Asset Number" name="assetNumber">
                            <Input placeholder="Asset Number" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Receipt Date" name="receiptDate" rules={[{ required: true, message: "Please select Receipt Date" }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Date Placed In Service" name="datePlacedInService" rules={[{ required: true, message: "Please select Date" }]}>
                            <DatePicker style={{ width: "100%" }} onChange={(date) => {
                                if (date) {
                                    const formatted = date.format("YYYY-MM-DD HH:mm:ssZ");
                                    console.log("Formatted date:", formatted);
                                }
                            }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Range" name="range">
                            <Input placeholder="Range" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Least Count" name="leastCount">
                            <Input placeholder="Least Count" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Least Product Tolerance" name="leastProductTolerance">
                            <Input placeholder="Least Product Tolerance" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Accuracy" name="accuracy">
                            <Input placeholder="Accuracy" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Uncertainty" name="uncertainty">
                            <Input placeholder="Uncertainty" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="History Card Number" name="historyCardNumber" rules={[{ required: true, message: "Please enter History Card Number" }]}>
                            <Input placeholder="History Card Number" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Department" name="department">
                            <Input placeholder="Department" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Date Of Last Calibration" name="dateOfLastCalibrationDate" rules={[{ required: true, message: "Please select Date" }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Calibration Certificate No" name="calibrationCertificateNo" rules={[{ required: true, message: "Please enter Certificate No" }]}>
                            <Input placeholder="Calibration Certificate No" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Calibration Frequency" name="calibrationFrequency">
                            <Select placeholder="Select Calibration Frequency">
                                <Option value="Once In Every Year">Once In Every Year</Option>
                                <Option value="Once In 2 Year">Once In 2 Year</Option>
                                <Option value="Once In 6 Months">Once In 6 Months</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Calibration Valid Upto" name="calibrationValidUpto" rules={[{ required: true, message: "Please select Date" }]}>
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Calibration Agency" name="calibrationAgency" rules={[{ required: true, message: "Please Fill CalibrationAgency" }]}>
                            <Input placeholder="Calibration Agency" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Calibrated By" name="calibratedBy">
                            <Input placeholder="Calibrated By" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Equipment Status" name="equipmentStatus">
                            <Select placeholder="Select Equipment Status">
                                {equipmentStatus.map((status, idx) => (
                                    <Option key={idx} value={status.value}>{status.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Traceability" name="traceability">
                            <Input placeholder="Traceability" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Next Calibration Reminder" name="nextCalibrationRemainder">
                            <Select>
                                <Option value="1 Reminder 7 days before">1 Reminder 7 days before</Option>
                                <Option value="2 Reminders 15 days before">2 Reminders 15 days before</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    {(selectedDiscipline === "ELECTRO TECHNICAL" || isselectedDiscipline) && (
                        <Col span={24}>
                            <Form.Item label="Electro Technical Parameters" name="electroParameters">
                                <Select mode="multiple" placeholder="Select Parameters" value={initialData.electroParameters}>
                                    <Option value="Active Energy">Active Energy</Option>
                                    <Option value="Reactive Energy">Reactive Energy</Option>
                                    <Option value="Ratio Error">Ratio Error</Option>
                                    <Option value="Phase Error">Phase Error</Option>
                                    <Option value="Burden">Burden</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    )}

                    <Col span={24}>
                        <Form.Item label="Remark" name="remark">
                            <TextArea rows={4} placeholder="Remark" />
                        </Form.Item>
                    </Col>

                    {/* <Col span={24}>
                        <Form.Item label="Master Certificate" name="masterCertificate">
                            <Upload beforeUpload={() => false} onChange={handleFileChange}>
                                <Button icon={<UploadOutlined />}>Select File</Button>
                            </Upload>
                        </Form.Item>
                    </Col> */}

                    <Col span={24}>
                        <Form.Item label="Master Certificate" name="masterCertificate">
                            <Dragger {...draggerProps}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    Click or drag file to this area to upload
                                </p>
                                <p className="ant-upload-hint">
                                    Support for single file upload. Avoid uploading sensitive data.
                                </p>
                            </Dragger>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                disabled={mode === "edit" && !isDirty}
                                loading={isLoading}
                            >
                                {mode === "edit" ? "Update Equipment" : "Add Equipment"}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <Spin size="large" spinning={isLoading} fullscreen />
        </Card>
    );
};

export default EquipmentForm;
