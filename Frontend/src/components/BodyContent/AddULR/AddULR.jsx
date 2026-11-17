import React, { useContext, useEffect, useState } from "react";
import { Table, Card, Button, Typography, Tag, Space, Tooltip } from "antd";
import { EditOutlined, ReloadOutlined, PlusOutlined, FileTextOutlined } from "@ant-design/icons";
import config from "../../../utils/config.json";
import axios from "axios";
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import EditULR from "./EditULR";
import AddNewULR from "./AddNewULR";
import Loader from "../../UI/Loader";
import GlobalNotification from "../../../utils/GlobalNotification";

const { Title, Text } = Typography;

const AddUlr = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [ULRList, setULRList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ulrInfo, setUlrInfo] = useState({});
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openCreateModal, setOpenCreateModal] = useState(false);

    async function fetchData() {
        try {
            setLoading(true);
            const response = await axios.get(`${config.Calibmaster.URL}/api/ulr-no-generation/fetch-ulr/${auth.labId}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            const { msg, data } = response.data;
            setULRList(data);
            GlobalNotification.success({ title: msg || "Data loaded successfully" });
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const closeModalHandler = () => {
        setOpenEditModal(false);
        fetchData();
    }

    const closeCreateModalHandler = () => {
        setOpenCreateModal(false);
        fetchData();
    }

    const columns = [
        {
            title: 'SL No.',
            key: 'index',
            width: 80,
            align: 'center',
            render: (text, record, index) => <Text strong className="text-slate-500">{index + 1}</Text>,
        },
        {
            title: 'Accreditation Number',
            dataIndex: 'accreditationNumber',
            key: 'accreditationNumber',
            align: 'center',
            render: (text) => <Tag color="indigo" className="font-mono font-bold px-3 py-1 rounded-md">{text}</Tag>
        },
        {
            title: 'Current Year',
            dataIndex: 'currentYear',
            key: 'currentYear',
            align: 'center',
            render: (text) => <Text strong className="text-slate-700">20{text}</Text>
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            align: 'center',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Running Number',
            dataIndex: 'runningNumber',
            key: 'runningNumber',
            align: 'center',
            render: (text) => <Text className="font-mono text-emerald-600 font-bold">{text}</Text>
        },
        {
            title: 'Accredited Scope',
            dataIndex: 'accreditedScope',
            key: 'accreditedScope',
            align: 'center',
            render: (text) => <Tag color="gold" className="font-bold">{text}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (text, record) => (
                <Tooltip title="Edit ULR Info">
                    <Button
                        type="primary"
                        ghost
                        icon={<EditOutlined />}
                        onClick={() => {
                            setUlrInfo(record);
                            setOpenEditModal(true);
                        }}
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
                                <Title level={4} className="!m-0 text-slate-800">List ULR</Title>
                                <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Manage Laboratory Report Identifiers</Text>
                            </div>
                        </div>
                        <Space>
                            <Tooltip title="Refresh Data">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    className="rounded-xl h-11 w-11 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-400"
                                />
                            </Tooltip>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setOpenCreateModal(true)}
                                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 border-none font-bold px-6 shadow-md shadow-indigo-100 hidden md:flex items-center gap-2"
                            >
                                Proceed to Next Year
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Table
                    loading={loading}
                    dataSource={ULRList}
                    columns={columns}
                    rowKey="ulr_generation_id"
                    pagination={{ pageSize: 5 }}
                    className="overflow-hidden"
                    scroll={{ x: 900 }}
                    rowClassName="hover:bg-indigo-50 transition-colors"
                />

                {openEditModal && (
                    <EditULR
                        isopen={openEditModal}
                        onclose={closeModalHandler}
                        ulrInfo={ulrInfo}
                    />
                )}

                {openCreateModal && (
                    <AddNewULR
                        isopen={openCreateModal}
                        onclose={closeCreateModalHandler}
                    />
                )}
            </Card>

            <div className="md:hidden flex justify-center pb-8">
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setOpenCreateModal(true)}
                    className="h-12 rounded-xl bg-indigo-600 border-none font-bold px-8 shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    Proceed to Next Year
                </Button>
            </div>

            {loading && <Loader />}

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

export default AddUlr;
