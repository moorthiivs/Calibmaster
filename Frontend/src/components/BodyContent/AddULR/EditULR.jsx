import React, { useContext, useEffect, useState } from "react";
import { Modal, Form, Input, Button, DatePicker, Select, Row, Col, Typography, Space, Tag } from "antd";
import { EditOutlined, FileProtectOutlined, CalendarOutlined, EnvironmentOutlined, NumberOutlined, ScissorOutlined, FlagOutlined, InfoCircleOutlined } from "@ant-design/icons";
import accreditationDetailValidation from "./accreditationDetailValidation";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import config from "../../../utils/config.json";
import axios from "axios";
import { locationGenerator } from "./helpers";
import { formattedDate } from "../../helpers/Helper";
import dayjs from "dayjs";
import Loader from "../../UI/Loader";

const { Title, Text } = Typography;
const { Option } = Select;

const EditULR = ({ isopen, onclose, ulrInfo }) => {
    const auth = useContext(AuthContext);
    const [form] = Form.useForm();
    const currentYear = new Date().getFullYear();

    const [accreditationDetail, setAccreditationDetail] = useState({
        accreditationNumber: "",
        currentYear: currentYear % 100,
        location: "",
        runningNumber: "",
        accreditedScope: "",
        effectiveFlag: "",
        effectiveStartDateString: "",
        effectiveEndDateString: "",
        ulrcount: 1
    });
    const [locationOptions, setLocationOptions] = useState([]);
    const [validationError, setValidationError] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ulrInfo) {
            const initialData = {
                accreditationNumber: ulrInfo?.accreditationNumber || "",
                currentYear: ulrInfo?.currentYear || currentYear % 100,
                location: ulrInfo?.location,
                runningNumber: ulrInfo?.runningNumber || "",
                accreditedScope: ulrInfo?.accreditedScope || "",
                effectiveFlag: ulrInfo?.effectiveFlag || "",
                effectiveStartDateString: ulrInfo?.effectiveStartDate || "",
                effectiveEndDateString: ulrInfo?.effectiveEndDate || "",
            };

            setAccreditationDetail(prev => ({ ...prev, ...initialData }));
            form.setFieldsValue({
                ...initialData,
                effectiveStartDateString: initialData.effectiveStartDateString ? dayjs(initialData.effectiveStartDateString) : null,
                effectiveEndDateString: initialData.effectiveEndDateString ? dayjs(initialData.effectiveEndDateString) : null,
            });
        }
        setLocationOptions(locationGenerator());
    }, [ulrInfo, form]);

    const onValuesChange = (changedValues, allValues) => {
        let updatedValues = { ...allValues };
        
        if (changedValues.accreditedScope) {
            const val = changedValues.accreditedScope.toUpperCase().trim();
            if (/^[a-zA-Z]*$/.test(val)) {
                updatedValues.accreditedScope = val;
                form.setFieldsValue({ accreditedScope: val });
            } else {
                updatedValues.accreditedScope = accreditationDetail.accreditedScope;
                form.setFieldsValue({ accreditedScope: accreditationDetail.accreditedScope });
            }
        }

        setAccreditationDetail(prev => ({
            ...prev,
            ...updatedValues,
            effectiveStartDateString: updatedValues.effectiveStartDateString ? updatedValues.effectiveStartDateString.format("YYYY-MM-DD") : prev.effectiveStartDateString,
            effectiveEndDateString: updatedValues.effectiveEndDateString ? updatedValues.effectiveEndDateString.format("YYYY-MM-DD") : prev.effectiveEndDateString,
        }));
    };

    async function handleSubmit() {
        try {
            const values = await form.validateFields();
            const payload = {
                ...accreditationDetail,
                ...values,
                effectiveStartDateString: values.effectiveStartDateString ? values.effectiveStartDateString.format("YYYY-MM-DD") : "",
                effectiveEndDateString: values.effectiveEndDateString ? values.effectiveEndDateString.format("YYYY-MM-DD") : "",
                lab_id: auth.labId
            };

            let errors = accreditationDetailValidation(payload);
            setValidationError(errors);

            const hasErrors = Object.values(errors).some(err => err !== "");
            if (!hasErrors) {
                setLoading(true);
                await axios.post(`${config.Calibmaster.URL}/api/ulr-no-generation/ulr-update`, payload, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                });
                GlobalNotification.success({
                    title: "Data Updated successfully",
                });
                onclose();
            }
        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            open={isopen}
            onCancel={onclose}
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="bg-amber-500 p-2 rounded-xl text-white shadow-md shadow-amber-100">
                        <EditOutlined className="text-xl" />
                    </div>
                    <div>
                        <Title level={4} className="!m-0 text-slate-800">Edit ULR Info</Title>
                        <Text type="secondary" className="text-[10px] uppercase tracking-widest font-bold">Modify Accreditation Metadata</Text>
                    </div>
                </div>
            }
            width={1000}
            footer={[
                <Button key="cancel" onClick={onclose} className="rounded-lg h-12 px-8 text-base">
                    Cancel
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    size="large"
                    onClick={handleSubmit} 
                    loading={loading}
                    className="rounded-lg h-12 px-12 bg-indigo-600 hover:bg-indigo-700 border-none font-bold text-base shadow-lg shadow-indigo-100"
                >
                    Update Changes
                </Button>
            ]}
            className="top-10"
            centered
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                onValuesChange={onValuesChange}
                className="mt-6"
            >
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Accreditation Number</span>}
                            name="accreditationNumber"
                            help={<Text type="secondary" className="text-[11px] block mt-1"><InfoCircleOutlined className="mr-1" /> e.g., TC-XXXX, CC-XXXX</Text>}
                            validateStatus={validationError.accreditationNumber ? "error" : ""}
                        >
                            <Input 
                                prefix={<FileProtectOutlined className="text-indigo-500" />}
                                placeholder="TC-XXXX"
                                className="h-11 rounded-lg text-base font-mono"
                                maxLength={7}
                            />
                        </Form.Item>
                        {validationError.accreditationNumber && <Text type="danger" className="text-xs">{validationError.accreditationNumber}</Text>}
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Current Year</span>}
                            name="currentYear"
                            help={<Text type="secondary" className="text-[11px] block mt-1"><InfoCircleOutlined className="mr-1" /> e.g., 20 for year 2020</Text>}
                            validateStatus={validationError.currentYear ? "error" : ""}
                        >
                            <Input 
                                prefix={<CalendarOutlined className="text-indigo-500" />}
                                placeholder="YY"
                                className="h-11 rounded-lg text-base font-mono"
                                maxLength={2}
                            />
                        </Form.Item>
                        {validationError.currentYear && <Text type="danger" className="text-xs">{validationError.currentYear}</Text>}
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Select Location</span>}
                            name="location"
                            help={<Text type="secondary" className="text-[11px] block mt-1"><InfoCircleOutlined className="mr-1" /> O for single, 1-5 for multi</Text>}
                            validateStatus={validationError.location ? "error" : ""}
                        >
                            <Select 
                                className="h-11 w-full rounded-lg"
                                suffixIcon={<EnvironmentOutlined className="text-indigo-500" />}
                            >
                                {locationOptions.map(opt => (
                                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {validationError.location && <Text type="danger" className="text-xs">{validationError.location}</Text>}
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight text-slate-400">Running Number</span>}
                            name="runningNumber"
                            help={<Text type="secondary" className="text-[11px] block mt-1">Report sequence identifier (Read Only)</Text>}
                        >
                            <Input 
                                prefix={<NumberOutlined className="text-slate-300" />}
                                className="h-11 rounded-lg text-base font-mono bg-slate-50"
                                disabled
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Accredited Scope</span>}
                            name="accreditedScope"
                            help={<Text type="secondary" className="text-[11px] block mt-1">Single character scope identifier</Text>}
                            validateStatus={validationError.accreditedScope ? "error" : ""}
                        >
                            <Input 
                                prefix={<ScissorOutlined className="text-indigo-500" />}
                                className="h-11 rounded-lg text-base font-mono"
                                maxLength={1}
                            />
                        </Form.Item>
                        {validationError.accreditedScope && <Text type="danger" className="text-xs">{validationError.accreditedScope}</Text>}
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight text-slate-400">Effective Flag</span>}
                            name="effectiveFlag"
                        >
                            <Input 
                                prefix={<FlagOutlined className="text-slate-300" />}
                                className="h-11 rounded-lg text-base font-mono bg-slate-50"
                                disabled
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Effective Start Date</span>}
                            name="effectiveStartDateString"
                            rules={[{ required: true, message: 'Select start date' }]}
                        >
                            <DatePicker 
                                className="h-11 w-full rounded-lg"
                                format="DD-MM-YYYY"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Effective End Date</span>}
                            name="effectiveEndDateString"
                            rules={[{ required: true, message: 'Select end date' }]}
                        >
                            <DatePicker 
                                className="h-11 w-full rounded-lg"
                                format="DD-MM-YYYY"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            {loading && <Loader />}
        </Modal>
    );
};

export default EditULR;