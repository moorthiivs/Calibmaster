import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tooltip, Space, Tag } from "antd";
import { EditOutlined, ReconciliationOutlined, NumberOutlined, PercentageOutlined, CalendarOutlined, ShopOutlined } from "@ant-design/icons";
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { useDispatch } from 'react-redux';
import GlobalNotification from '../../../../utils/GlobalNotification';
import EditQuotationConfig from './EditQuotationConfig';
import Loader from '../../../UI/Loader';

const { Title, Text } = Typography;

const QuotationConfigList = () => {
    const auth = useContext(AuthContext);
    const [QuotationConfigDetail, setQuotationConfigDetail] = useState([]);
    const [loading, setloading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editQuotationData, setEditQuotationData] = useState({});

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-config/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();
            const { msg, LabQuotationConfig } = serverResponse;
            setQuotationConfigDetail(LabQuotationConfig);
            setloading(false);

            if (msg) {
                GlobalNotification.success({ title: msg });
            }
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Something went wrong" });
            setloading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const columns = [
        {
            title: 'Sr No',
            key: 'srNo',
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text className="text-slate-500 font-medium">{index + 1}</Text>,
        },
        {
            title: 'Financial Year',
            dataIndex: 'Current_Financial_Year',
            key: 'Current_Financial_Year',
            render: (text) => (
                <Space>
                    <CalendarOutlined className="text-rose-500" />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'GST %',
            dataIndex: 'GST_Percentage',
            key: 'GST_Percentage',
            align: 'center',
            render: (text) => (
                <Space>
                    <PercentageOutlined className="text-emerald-500 text-xs" />
                    <Tag color="green" className="font-bold rounded-md">{text}%</Tag>
                </Space>
            ),
        },
        {
            title: 'GST/PAN Number',
            dataIndex: 'GST_number',
            key: 'GST_number',
            render: (text) => <Text className="font-mono text-slate-600 text-xs uppercase">{text}</Text>,
        },
        {
            title: 'Lab Info',
            key: 'labInfo',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <ShopOutlined className="text-blue-500 text-xs" />
                        <Text className="text-xs font-semibold">{record.Lab_Short_Name}</Text>
                    </Space>
                    <Text type="secondary" className="text-[10px] uppercase tracking-tighter">Short Name: {record.Quotation_Short_Name}</Text>
                </Space>
            ),
        },
        {
            title: 'Sequence',
            key: 'sequence',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <NumberOutlined className="text-amber-500 text-xs" />
                        <Text className="text-xs font-mono">Running: {record.Running_Quotation_Number}</Text>
                    </Space>
                    <Text type="secondary" className="text-[10px]">Actual: {record.Actual_Running_Quotation_Number}</Text>
                </Space>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: 80,
            render: (_, record) => (
                <Tooltip title="Edit Quotation Config">
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setIsEditModalOpen(true);
                            setEditQuotationData(record);
                        }}
                        className="flex items-center justify-center mx-auto bg-rose-500 hover:bg-rose-600 border-none shadow-sm"
                    />
                </Tooltip>
            ),
        },
    ];

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        fetchConfig();
    };

    return (
        <div >
            <Card 
                className="shadow-xl border-none rounded-2xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-2">
                        <div className="bg-rose-500 p-2 rounded-lg text-white">
                            <ReconciliationOutlined className="text-xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Quotation Configuration List</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider">Manage system-wide quotation settings</Text>
                        </div>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={QuotationConfigDetail}
                    rowKey="quotation_config_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        className: "px-4",
                    }}
                    className="quotation-list-table"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {loading && <Loader />}

            {isEditModalOpen && (
                <EditQuotationConfig
                    isOpen={isEditModalOpen}
                    onRequestClose={closeEditModal}
                    data={editQuotationData}
                />
            )}

            <style jsx>{`
                .quotation-list-table :global(.ant-table-thead > tr > th) {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .quotation-list-table :global(.ant-table-row:hover) {
                    background-color: #fff1f2 !important;
                }
            `}</style>
        </div>
    );
};

export default QuotationConfigList;
