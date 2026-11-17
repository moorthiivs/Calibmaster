import React, { useContext, useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tooltip, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, BankOutlined, CreditCardOutlined, IdcardOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { AuthContext } from '../../../context/auth-context';
import config from "../../../utils/config.json";
import { useDispatch } from 'react-redux';
import GlobalNotification from '../../../utils/GlobalNotification';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import EditBankConfig from './EditBankDetails';
import Loader from '../../UI/Loader';

const { Title, Text } = Typography;

const ListBankConfig = () => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [BankConfigList, setBankConfigList] = useState([]);
    const [loading, setloading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [BankConfigEditData, setBankConfigEditData] = useState({});

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/bank-config-routes/fetch-config/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();
            const { response, result } = serverResponse;
            setBankConfigList(result);
            setloading(false);

            if (response) {
                GlobalNotification.success({ title: response });
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
            width: 80,
            align: 'center',
            render: (_, __, index) => <Text className="text-slate-500 font-medium">{index + 1}</Text>,
        },
        {
            title: 'Bank Name',
            dataIndex: 'bank_name',
            key: 'bank_name',
            render: (text) => (
                <Space>
                    <BankOutlined className="text-emerald-500" />
                    <Text strong className="text-slate-700">{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Account Number',
            dataIndex: 'account_number',
            key: 'account_number',
            render: (text) => (
                <Space>
                    <CreditCardOutlined className="text-blue-500" />
                    <Text className="font-mono text-slate-600">{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Branch',
            dataIndex: 'branch',
            key: 'branch',
            render: (text) => (
                <Space>
                    <EnvironmentOutlined className="text-rose-500" />
                    <Text className="text-slate-600">{text}</Text>
                </Space>
            ),
        },
        {
            title: 'IFSC Code',
            dataIndex: 'ifsc_code',
            key: 'ifsc_code',
            render: (text) => <Tag color="blue" className="font-mono rounded-md px-2">{text}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: 100,
            render: (_, record) => (
                <Tooltip title="Edit Config">
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setIsEditModalOpen(true);
                            setBankConfigEditData(record);
                        }}
                        className="flex items-center justify-center mx-auto bg-emerald-500 hover:bg-emerald-600 border-none shadow-sm"
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg text-white">
                                <IdcardOutlined className="text-xl" />
                            </div>
                            <div>
                                <Title level={4} className="!m-0 text-slate-800">Bank Configuration List</Title>
                                <Text type="secondary" className="text-xs uppercase tracking-wider">Manage lab banking information</Text>
                            </div>
                        </div>
                        {hasPermission("ACCESS_BANK_CONFIG") && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate("/dashboard/bank-config/add")}
                                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 border-none shadow-md flex items-center gap-2 font-semibold"
                            >
                                Add Bank Config
                            </Button>
                        )}
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={BankConfigList}
                    rowKey="lab_bank_detail_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        className: "px-4",
                    }}
                    className="bank-list-table"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {loading && <Loader />}

            {isEditModalOpen && (
                <EditBankConfig
                    isOpen={isEditModalOpen}
                    onRequestClose={closeEditModal}
                    data={BankConfigEditData}
                />
            )}

            <style jsx>{`
                .bank-list-table :global(.ant-table-thead > tr > th) {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .bank-list-table :global(.ant-table-row:hover) {
                    background-color: #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
};

export default ListBankConfig;
