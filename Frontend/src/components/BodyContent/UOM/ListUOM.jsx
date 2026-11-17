import React, { useContext, useState, useEffect } from "react";
import { Card, Input, Button, Tooltip, Space, Popconfirm, Table, Tag, Typography } from "antd";
import {
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    FontSizeOutlined,
    BlockOutlined,
    DeploymentUnitOutlined
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { uomIdActions } from "../../../store/uomId";
import { useNavigate } from "react-router-dom";
import {
    addNewId,
    searchByKindOfQuantity,
    searchByNameFunction,
} from "./higherOrderFunction";
import { usePermissions } from "../../../hooks/usePermissions";
import GlobalNotification from "../../../utils/GlobalNotification";
import PageHeader from "../../UI/PageHeader";

const { Text } = Typography;


const ListUOM = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [uomList, setUomList] = useState([]);
    const [originalList, setOriginalList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const fetchUOMs = async () => {
        try {
            setLoading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/uom/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let response = await data.json();
            const formattedData = await addNewId(response.data);
            setUomList(formattedData);
            setOriginalList(formattedData);
            setLoading(false);
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Failed to load UOM list" });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUOMs();
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        const query = value.toLowerCase().trim();

        if (query !== "") {
            const result = originalList.filter((item) =>
                (item.uom_name || "").toLowerCase().includes(query) ||
                (item.uom_kindofquantity || "").toLowerCase().includes(query) ||
                (item.uom_printsysmbol || "").toLowerCase().includes(query)
            );
            setUomList(result);
        } else {
            setUomList(originalList);
        }
    };

    const redirectHandler = (id) => {
        dispatch(uomIdActions.setUomId(id));
        navigate("/dashboard/uom/edit");
    };

    const handleDelete = async (uom_id) => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/uom/delete/${uom_id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            const result = await res.json();
            if (result.msg) {
                GlobalNotification.success({ title: "UOM deleted successfully" });
                fetchUOMs();
            } else {
                GlobalNotification.error({
                    title: "Cannot Delete UOM",
                    description: result.response || "Failed to delete UOM",
                    duration: 8,
                });
            }
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Network error — could not delete UOM" });
        }
    };

    const canEdit = hasPermission("EDIT_UOM");
    const canDelete = hasPermission("DELETE_UOM");

    const columns = [
        {
            title: 'S. No',
            key: 'sno',
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text type="secondary" strong>{index + 1}</Text>,
        },
        {
            title: "UOM Details",
            key: "uom_details",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong className="text-blue-600">{record.uom_name}</Text>
                </Space>
            ),
            sorter: (a, b) => a.uom_name.localeCompare(b.uom_name),
        },
        {
            title: "Kind Of Quantity",
            dataIndex: "uom_kindofquantity",
            key: "uom_kindofquantity",
            render: (text) => (
                <Space>
                    <BlockOutlined className="text-purple-500" />
                    <Text className="text-slate-600">{text}</Text>
                </Space>
            ),
        },
        {
            title: "Print Symbol",
            dataIndex: "uom_printsysmbol",
            key: "uom_printsysmbol",
            align: 'center',
            render: (text) => <Tag color="orange" className="font-mono">{text}</Tag>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            align: 'center',
            render: (_, row) => (
                <Space>
                    {canEdit && (
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                icon={<EditOutlined className="text-blue-600" />}
                                onClick={() => redirectHandler(row.uom_id)}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete UOM"
                            description="Are you sure you want to delete this UOM?"
                            onConfirm={() => handleDelete(row.uom_id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Delete">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            )
        },
    ];

    return (
        <div className="p-6">
            <PageHeader
                title="Units of Measurement (UOM)"
                breadcrumbItems={[
                    { title: 'Dashboard' },
                    { title: 'UOM' },
                    { title: 'UOM List' },
                ]}
                searchText={searchText}
                onSearchChange={handleSearch}
                searchPlaceholder="Search by name or quantity..."
                actionButtonText="Add New UOM"
                onActionClick={() => navigate("/dashboard/uom/create")}
                actionButtonIcon={<PlusOutlined />}
                showActionButton={hasPermission("CREATE_UOM")}
            />

            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={uomList}
                    rowKey="uom_id"
                    loading={loading}
                    scroll={{ x: 550, y: 550 }}
                    pagination={true}
                    className="uom-table"
                />

                <style>{`
                    .uom-table .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #1e293b !important;
                        font-weight: 700 !important;
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                    }
                    .uom-table .ant-table-tbody > tr > td {
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                        color: #334155 !important;
                    }
                    .uom-table .ant-table-row:hover {
                        cursor: pointer;
                    }
                    .ant-card-body {
                        padding: 0 !important;
                    }
                `}</style>
            </Card>
        </div>
    );
};

export default ListUOM;
