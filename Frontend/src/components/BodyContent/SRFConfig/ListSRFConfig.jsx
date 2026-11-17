import React, { useContext, useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, DatePicker, Typography, Space, Tooltip, Tag } from "antd";
import { EditOutlined, ReloadOutlined, FileTextOutlined, NumberOutlined, CalendarOutlined } from "@ant-design/icons";
import { AuthContext } from '../../../context/auth-context';
import GlobalNotification from "../../../utils/GlobalNotification";
import config from "../../../utils/config.json";
import dayjs from 'dayjs';
import Loader from '../../UI/Loader';

const { Title, Text } = Typography;

const ListSRFConfig = () => {
    const auth = useContext(AuthContext);
    const [form] = Form.useForm();
    
    const [srfConfigList, setSrfConfigList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditModalLoading, setIsEditModalLoading] = useState(false);

    const fetchSRFConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.Calibmaster.URL}/api/srf-config/fetch/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
            });

            const data = await response.json();
            const { result } = data;
            setSrfConfigList(result);
            GlobalNotification.success({
                title: "SRF Config fetched Successfully",
            });
        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSRFConfig();
    }, []);

    const handleEdit = (record) => {
        form.setFieldsValue({
            issueNumber: record.issue_no,
            issueDate: record.issue_date ? dayjs(record.issue_date) : null,
            amendNumber: record.amend_no,
            amendDate: record.amend_date ? dayjs(record.amend_date) : null,
        });
        setIsEditModalOpen(true);
    };

    const onEditFinish = async (values) => {
        try {
            setIsEditModalLoading(true);
            const payload = {
                issue_no: values.issueNumber,
                issue_date: values.issueDate.format("YYYY-MM-DD"),
                amend_no: values.amendNumber,
                amend_date: values.amendDate.format("YYYY-MM-DD"),
                lab_id: auth.labId
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/srf-config/edit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            GlobalNotification.success({
                title: data?.response || "Updated successfully",
            });
            setIsEditModalOpen(false);
            fetchSRFConfig();
        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        } finally {
            setIsEditModalLoading(false);
        }
    };

    const columns = [
        {
            title: 'Sr No',
            key: 'index',
            width: 80,
            align: 'center',
            render: (text, record, index) => <Text strong className="text-slate-500">{index + 1}</Text>,
        },
        {
            title: 'Issue Number',
            dataIndex: 'issue_no',
            key: 'issue_no',
            align: 'center',
            render: (text) => <Tag color="indigo" className="font-mono font-bold px-3 py-1 rounded-md">{text}</Tag>
        },
        {
            title: 'Issue Date',
            dataIndex: 'issue_date',
            key: 'issue_date',
            align: 'center',
            render: (date) => date ? dayjs(date).format("DD-MMM-YYYY") : "-"
        },
        {
            title: 'Amend Number',
            dataIndex: 'amend_no',
            key: 'amend_no',
            align: 'center',
            render: (text) => <Tag color="blue" className="font-mono font-bold px-3 py-1 rounded-md">{text}</Tag>
        },
        {
            title: 'Amend Date',
            dataIndex: 'amend_date',
            key: 'amend_date',
            align: 'center',
            render: (date) => date ? dayjs(date).format("DD-MMM-YYYY") : "-"
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (text, record) => (
                <Tooltip title="Edit Configuration">
                    <Button 
                        type="primary"
                        ghost
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="rounded-lg hover:bg-indigo-50 border-indigo-200 text-indigo-600"
                    />
                </Tooltip>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card 
                className="shadow-lg border-none rounded-3xl overflow-hidden"
                title={
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-md shadow-indigo-100">
                                <FileTextOutlined className="text-2xl" />
                            </div>
                            <div>
                                <Title level={4} className="!m-0 text-slate-800">SRF Config View</Title>
                                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Monitor Service Request Forms Configuration</Text>
                            </div>
                        </div>
                        <Tooltip title="Refresh Data">
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={fetchSRFConfig}
                                className="rounded-xl h-11 w-11 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-400"
                            />
                        </Tooltip>
                    </div>
                }
            >
                <Table
                    loading={loading}
                    dataSource={srfConfigList}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    className="overflow-hidden"
                    scroll={{ x: 800 }}
                    rowClassName="hover:bg-indigo-50 transition-colors"
                />
            </Card>

            <Modal
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                title={
                    <div className="flex items-center gap-3 py-2">
                        <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
                            <EditOutlined className="text-xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Edit SRF Config</Title>
                            <Text type="secondary" className="text-[10px] uppercase tracking-widest font-bold">Update Version Information</Text>
                        </div>
                    </div>
                }
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditModalOpen(false)} className="rounded-lg h-10 px-6">
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        onClick={() => form.submit()} 
                        loading={isEditModalLoading}
                        className="rounded-lg h-10 px-8 bg-indigo-600 hover:bg-indigo-700 border-none font-bold"
                    >
                        Save Changes
                    </Button>
                ]}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onEditFinish}
                    requiredMark="optional"
                    className="mt-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Issue Number</span>}
                            name="issueNumber"
                            rules={[{ required: true, message: 'Enter issue number' }]}
                        >
                            <Input prefix={<NumberOutlined className="text-indigo-500" />} className="h-11 rounded-lg" />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Issue Date</span>}
                            name="issueDate"
                            rules={[{ required: true, message: 'Select issue date' }]}
                        >
                            <DatePicker className="h-11 w-full rounded-lg" format="DD-MM-YYYY" />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Amend Number</span>}
                            name="amendNumber"
                            rules={[{ required: true, message: 'Enter amend number' }]}
                        >
                            <Input prefix={<NumberOutlined className="text-indigo-500" />} className="h-11 rounded-lg" />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Amend Date</span>}
                            name="amendDate"
                            rules={[{ required: true, message: 'Select amend date' }]}
                        >
                            <DatePicker className="h-11 w-full rounded-lg" format="DD-MM-YYYY" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {(loading || isEditModalLoading) && <Loader />}

            <style jsx>{`
                :global(.ant-card-head) {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                }
                :global(.ant-table-thead > tr > th) {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    font-weight: 700 !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
};

export default ListSRFConfig;