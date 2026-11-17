import React, { useContext, useState } from "react";
import { Card, Form, Input, DatePicker, Button, Typography, Space, Row, Col, Divider } from "antd";
import { FileTextOutlined, CalendarOutlined, NumberOutlined, CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import config from "../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Loader from "../../UI/Loader";

const { Title, Text } = Typography;

const AddSRFConfig = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const newSRFConfig = {
                issue_no: values.issueNumber,
                issue_date: values.issueDate.format("YYYY-MM-DD"),
                amend_no: values.amendNumber,
                amend_date: values.amendDate.format("YYYY-MM-DD"),
                lab_id: `'${auth.labId}'`
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/srf-config/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(newSRFConfig)
            });

            const data = await response.json();

            if (response.status === 200) {
                GlobalNotification.success({
                    title: data.msg || "SRF Configuration updated successfully",
                });
                navigate("/dashboard/srf-config");
            } else {
                GlobalNotification.error({
                    title: data.msg || "Failed to update configuration",
                });
            }
        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: "Error while adding configuration",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <Card 
                className="w-full shadow-lg border-none rounded-3xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-4">
                        <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-md shadow-indigo-100">
                            <FileTextOutlined className="text-2xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">SRF Configuration</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Manage Document Versioning</Text>
                        </div>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark="optional"
                    initialValues={{
                        issueDate: dayjs(),
                        amendDate: dayjs()
                    }}
                    className="mt-2"
                >
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Issue Number</span>}
                                name="issueNumber"
                                rules={[{ required: true, message: 'Enter issue number' }]}
                            >
                                <Input 
                                    prefix={<NumberOutlined className="text-indigo-500" />} 
                                    placeholder="e.g., 01" 
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Issue Date</span>}
                                name="issueDate"
                                rules={[{ required: true, message: 'Select issue date' }]}
                            >
                                <DatePicker 
                                    className="h-12 w-full rounded-xl border-slate-200"
                                    format="DD-MM-YYYY"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Divider className="!my-6">
                                <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Amendment Details</Text>
                            </Divider>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Amend Number</span>}
                                name="amendNumber"
                                rules={[{ required: true, message: 'Enter amend number' }]}
                            >
                                <Input 
                                    prefix={<NumberOutlined className="text-indigo-500" />} 
                                    placeholder="e.g., 00" 
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Amend Date</span>}
                                name="amendDate"
                                rules={[{ required: true, message: 'Select amend date' }]}
                            >
                                <DatePicker 
                                    className="h-12 w-full rounded-xl border-slate-200"
                                    format="DD-MM-YYYY"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mt-10 mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            icon={<PlusOutlined />}
                            className="w-full h-12 rounded-xl !bg-indigo-600 hover:!bg-indigo-700 border-none text-base font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            Create or Update Configuration
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {loading && <Loader />}
            
            <style jsx>{`
                :global(.ant-card-head) {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                }
                :global(.ant-form-item-label) {
                    padding-bottom: 8px !important;
                }
            `}</style>
        </div>
    );
};

export default AddSRFConfig;