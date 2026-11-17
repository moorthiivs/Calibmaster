import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Space, Tooltip, Tag } from "antd";
import { EyeOutlined, UserOutlined, ShopOutlined, PhoneOutlined, MailOutlined, FileTextOutlined, TeamOutlined } from "@ant-design/icons";
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { useDispatch } from 'react-redux';
import GlobalNotification from '../../../../utils/GlobalNotification';
import Loader from '../../../UI/Loader';

const { Title, Text } = Typography;

const QuotationCustomerList = () => {
    const auth = useContext(AuthContext);
    const [QuotationCustomerDetail, setQuotationCustomerDetail] = useState([]);
    const [loading, setloading] = useState(false);

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-customer-list/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();
            const { msg, LabQuotationCustomer } = serverResponse;
            setQuotationCustomerDetail(LabQuotationCustomer);
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

    const viewCertificateHandler = async (filename) => {
        try {
            const requestBody = { filename };
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            let response = await fetch(config.Calibmaster.URL + "/api/quotation/view", requestOptions);
            if (!response.ok) throw new Error('File Not Found');
            
            let blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            GlobalNotification.error({ title: "Failed to View Quotation" });
        }
    };

    const columns = [
        {
            title: 'Sr No',
            key: 'srNo',
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text className="text-slate-500 font-medium">{index + 1}</Text>,
        },
        {
            title: 'Customer Details',
            key: 'customerDetails',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <ShopOutlined className="text-rose-500 text-xs" />
                        <Text strong className="text-slate-700">{record.customer_company_name}</Text>
                    </Space>
                    <Space size={4}>
                        <UserOutlined className="text-slate-400 text-[10px]" />
                        <Text type="secondary" className="text-xs">{record.customer_name}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Contact Information',
            key: 'contactInfo',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <PhoneOutlined className="text-emerald-500 text-[10px]" />
                        <Text className="text-xs font-mono">{record.customer_Contact_number}</Text>
                    </Space>
                    <Space size={4}>
                        <MailOutlined className="text-blue-500 text-[10px]" />
                        <Text className="text-[10px] text-slate-500 lowercase">{record.customer_email}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Quotation No',
            dataIndex: 'quotation_number',
            key: 'quotation_number',
            render: (text) => <Tag color="blue" className="font-mono font-bold rounded-md">{text}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: 120,
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => viewCertificateHandler(record.quotation_filename)}
                    className="bg-rose-500 hover:bg-rose-600 border-none rounded-lg shadow-sm flex items-center gap-2 h-9"
                >
                    View PDF
                </Button>
            ),
        },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <Card 
                className="shadow-xl border-none rounded-2xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-2">
                        <div className="bg-rose-500 p-2 rounded-lg text-white">
                            <TeamOutlined className="text-xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Quotation Customers List</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider">Review all issued quotations and client details</Text>
                        </div>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={QuotationCustomerDetail}
                    rowKey="quotation_config_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        className: "px-4",
                    }}
                    className="customer-list-table"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {loading && <Loader />}

            <style jsx>{`
                .customer-list-table :global(.ant-table-thead > tr > th) {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .customer-list-table :global(.ant-table-row:hover) {
                    background-color: #fff1f2 !important;
                }
            `}</style>
        </div>
    );
};

export default QuotationCustomerList;
