import React, { useContext, useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Input,
    Space,
    Typography,
    Tag,
    Tooltip,
    Modal,
    message,
    Breadcrumb,
    Divider,
    Row,
    Col,
    Descriptions
} from "antd";
import {
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    PlusOutlined,
    UserOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    PhoneOutlined,
    MailOutlined,
    ExclamationCircleOutlined
} from "@ant-design/icons";
import { AuthContext } from '../../../context/auth-context';
import { usePermissions } from '../../../hooks/usePermissions';
import config from "../../../utils/config.json";
import { useDispatch } from 'react-redux';
import GlobalNotification from '../../../utils/GlobalNotification';
import { customerIdActions } from '../../../store/customerId';
import { useNavigate } from 'react-router-dom';
import CustomerViewModal from './CustomerViewModal';

import PageHeader from '../../UI/PageHeader';

const { Text, Title } = Typography;

const ListCustomer = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [customerList, setCustomerList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [customerId, setCustomerId] = useState("");
    const [customerViewModal, setCustomerViewModal] = useState(false);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId })
            });

            const result = await response.json();
            if (result.code === 200 || result.data) {
                const data = result.data || [];
                const modifiedData = data.map((item, index) => ({
                    ...item,
                    key: item.customer_id,
                    index: index + 1
                }));
                setCustomerList(modifiedData);
                setFilteredList(modifiedData);
            } else {
                GlobalNotification.error({
                    title: result.message || "Failed to fetch customers",
                });
            }
        } catch (error) {
            console.error("Fetch Customers Error:", error);
            GlobalNotification.error({
                title: "Something went wrong while fetching customers",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const filtered = customerList.filter(item =>
            item.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.customer_code?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.city?.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredList(filtered);
    }, [searchText, customerList]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const redirectHandler = (id) => {
        localStorage.setItem('lab_id', id);
        dispatch(customerIdActions.setCustomerId(id));
        navigate("/dashboard/customers/edit");
    };

    const handleDeleteCustomer = (id) => {
        Modal.confirm({
            title: 'Delete Customer',
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you want to delete this customer? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(
                        `${config.Calibmaster.URL}/api/customers/delete-customer`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: 'Bearer ' + auth.token
                            },
                            body: JSON.stringify({
                                customerId: id,
                                lab_id: auth.labId,
                            })
                        }
                    );
                    const result = await response.json();
                    if (response.ok) {
                        GlobalNotification.success({
                            title: "Customer deleted successfully",
                        });
                        fetchCustomers();
                    } else {
                        GlobalNotification.error({
                            title: result.message || "Failed to delete customer",
                        });
                    }
                } catch (error) {
                    console.error("Delete Customer Error:", error);
                    GlobalNotification.error({
                        title: "Failed to delete customer",
                    });
                }
            }
        });
    };

    const columns = [
        {
            title: 'S. No',
            dataIndex: 'index',
            key: 'index',
            width: 70,
            align: 'center',
            fixed: 'left',
        },
        {
            title: 'Customer Details',
            key: 'customer_details',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong className="text-blue-600">{record.customer_name}</Text>
                    <Tag color="cyan" size="small">{record.customer_code}</Tag>
                </Space>
            ),
            sorter: (a, b) => a.customer_name.localeCompare(b.customer_name),
        },
        {
            title: 'Location',
            key: 'location',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}><EnvironmentOutlined className="text-slate-400" /><Text>{record.city}</Text></Space>
                    <Text type="secondary" className="text-xs">{record.state}, {record.country}</Text>
                </Space>
            ),
        },
        {
            title: 'GST Number',
            dataIndex: 'gst_number',
            key: 'gst_number',
            render: (gst) => gst ? <Tag color="blue-inverse" className="font-mono">{gst}</Tag> : <Text type="secondary">N/A</Text>,
        },
        {
            title: 'Portal Access',
            key: 'portal_access',
            align: 'center',
            render: (_, record) => (
                <Tooltip title="View Portal Customer Details">
                    <Button
                        type="primary"
                        ghost
                        shape="round"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setCustomerId(record.calibmaster_customer_id);
                            setCustomerViewModal(true);
                        }}
                    >
                        View Portal
                    </Button>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    {hasPermission("EDIT_CUSTOMER") && (
                        <Tooltip title="Edit Customer">
                            <Button
                                type="text"
                                icon={<EditOutlined className="text-amber-500" />}
                                onClick={() => redirectHandler(record.customer_id)}
                            />
                        </Tooltip>
                    )}
                    {hasPermission("DELETE_CUSTOMER") && (
                        <Tooltip title="Delete Customer">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteCustomer(record.customer_id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const expandedRowRender = (record) => (
        <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <EnvironmentOutlined />
                        </div>
                        <Text className="text-base font-bold text-slate-800">Address Details</Text>
                    </div>
                    <Descriptions column={1} size="small" className="customer-descriptions">
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Address Line 1</Text>}>{record.address1}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Address Line 2</Text>}>{record.address2}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Address Line 3</Text>}>{record.address3}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Location</Text>}>{record.city}, {record.state}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Pincode</Text>}>{record.pincode}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Country</Text>}>{record.country}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">GST No.</Text>}>
                            <Tag color="purple" className="font-mono m-0">{record.gst_number}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <UserOutlined />
                        </div>
                        <Text className="text-base font-bold text-slate-800">Primary Contact</Text>
                    </div>
                    <Descriptions column={1} size="small" className="customer-descriptions">
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Full Name</Text>}>
                            <Text strong>{`${record?.customer_contact?.contact_title || ''} ${record?.customer_contact?.contact_fullname || 'N/A'}`}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Email</Text>}>
                            <a href={`mailto:${record?.customer_contact?.contact_email}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                <MailOutlined className="text-slate-400" />
                                {record?.customer_contact?.contact_email || 'N/A'}
                            </a>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Phone 1</Text>}>
                            <Space><PhoneOutlined className="text-slate-400" />{record?.customer_contact?.contact_phone_1 || 'N/A'}</Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium">Phone 2</Text>}>
                            <Space><PhoneOutlined className="text-slate-400" />{record?.customer_contact?.contact_phone_2 || 'N/A'}</Space>
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <PageHeader
                title="Customer Directory"
                breadcrumbItems={[
                    { title: 'Dashboard' },
                    { title: 'Customers' },
                    { title: 'Directory List' },
                ]}
                searchText={searchText}
                onSearchChange={handleSearch}
                searchPlaceholder="Search by name, code or city..."
                actionButtonText="Add New Customer"
                onActionClick={() => navigate("/dashboard/customers/create")}
                actionButtonIcon={<PlusOutlined />}
                showActionButton={hasPermission("CREATE_CUSTOMER")}
            />

            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    loading={loading}
                    expandable={{
                        expandedRowRender,
                        expandRowByClick: true,
                        rowExpandable: (record) => true,
                    }}
                    className="customer-table"
                    scroll={{ x: 550, y: 550 }}
                    pagination={true}
                />
            </Card>

            {customerViewModal && (
                <CustomerViewModal
                    isopen={customerViewModal}
                    onclose={() => setCustomerViewModal(false)}
                    customerId={customerId}
                />
            )}

            <style>{`
                .customer-table .ant-table-thead > tr > th {
                    background: #f1f5f9 !important;
                    color: #475569 !important;
                    font-weight: 600 !important;
                    font-size: 13px !important;
                    padding: 14px 16px !important;
                    border-bottom: 2px solid #e2e8f0 !important;
                }
                .customer-table .ant-table-tbody > tr > td {
                    font-size: 13px !important;
                    padding: 14px 16px !important;
                    color: #334155 !important;
                }
                .customer-table .ant-table-row:hover {
                    cursor: pointer;
                    background-color: #f8fafc !important;
                }
                .ant-pagination-item-active {
                    border-color: #2563eb !important;
                    background-color: #2563eb !important;
                }
                .ant-pagination-item-active a {
                    color: #ffffff !important;
                }
                .ant-card-body {
                    padding: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default ListCustomer;