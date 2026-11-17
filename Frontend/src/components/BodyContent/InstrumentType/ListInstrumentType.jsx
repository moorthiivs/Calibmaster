import React, { useContext, useState, useEffect, useCallback } from "react";
import { Card, Input, Button, Select, Dropdown, Table, Tag, Space, Tooltip, Typography } from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    SearchOutlined,
    PlusOutlined,
    ToolOutlined,
    ExperimentOutlined,
    DeploymentUnitOutlined,
    SafetyCertificateOutlined,
    TagsOutlined
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";
import { instrumentTypeIdActions } from "../../../store/instrumentTypeId";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import { addNewId, searchByNameFunction } from "./higherOrderFunction";
import PageHeader from "../../UI/PageHeader";
import showConfirmationDialog from "../../../utils/showConfirmationToast";

import ReusableTable from '../../Table/ReusableTable';

const { Option } = Select;
const { Text } = Typography;

const ListInstrumentType = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [instrumentTypeList, setInstrumentTypeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [labType, setLabType] = useState("");

    const fetchInstrumentType = useCallback(async () => {
        try {
            setLoading(true);

            const res = await fetch(
                config.Calibmaster.URL + "/api/instrument-types/list",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({ lab_id: auth.labId }),
                }
            );

            const json = await res.json();
            const data = await addNewId(json.data);

            setInstrumentTypeList(data);
        } catch (error) {
            GlobalNotification.error({
                title: "Something went wrong",
            });
        } finally {
            setLoading(false);
        }
    }, [auth, dispatch]);

    useEffect(() => {
        fetchInstrumentType();
    }, [fetchInstrumentType]);


    useEffect(() => {
        const delay = setTimeout(async () => {
            if (!searchText && !labType) {
                fetchInstrumentType();
                return;
            }

            setLoading(true);
            try {
                const data = await searchByNameFunction(
                    searchText.trim() || "",
                    labType,
                    auth
                );
                const response = await addNewId(data);
                setInstrumentTypeList(response);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400); // debounce

        return () => clearTimeout(delay);
    }, [searchText, labType]);



    const redirectHandler = (id) => {
        dispatch(instrumentTypeIdActions.setInstrumentTypeId(id));
        navigate("/dashboard/instrument-types/edit");
    };

    const handleDelete = async (id) => {
        try {
            const confirmDelete = await showConfirmationDialog(
                "Are You Sure Want to Delete?"
            );

            if (!confirmDelete) return;

            const response = await fetch(
                config.Calibmaster.URL + "/api/instrument-types/delete",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({
                        instrument_type_id: id,
                        labid: auth.labId,
                        userid: auth.userId,
                    }),
                }
            );

            if (response.ok) {
                GlobalNotification.success({
                    title: "Deleted",
                    description: "Deleted Successfully"
                });
                fetchInstrumentType();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'S. No',
            key: 'sno',
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text type="secondary" strong>{index + 1}</Text>,
        },
        {
            title: "Instrument Details",
            key: "instrument_details",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong className="text-blue-600">{record.instrument_name}</Text>
                    <Text type="secondary">{record.instrument_full_name}</Text>
                </Space>
            ),
            sorter: (a, b) => a.instrument_name.localeCompare(b.instrument_name),
        },
        {
            title: "Lab Type",
            dataIndex: "labtype",
            key: "labtype",
            align: "center",
            render: (text) => (
                <Tag color={text === 'NABL' ? 'blue' : 'orange'} icon={<SafetyCertificateOutlined />} className="m-0">
                    {text}
                </Tag>
            ),
        },
        {
            title: "Category / Spec",
            dataIndex: "instrument_type_spec",
            key: "instrument_type_spec",
            render: (text) => (
                <Space>
                    <TagsOutlined className="text-slate-400" />
                    <Text className="text-slate-600">{text}</Text>
                </Space>
            ),
        },
        {
            title: "UOM",
            dataIndex: "ins_uom_name",
            key: "ins_uom_name",
            align: "center",
            render: (text) => <Tag color="cyan" className="font-mono m-0">{text}</Tag>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            align: 'center',
            render: (_, row) => (
                <Space>
                    {hasPermission("EDIT_INSTRUMENT_VARIANT") && (
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                icon={<EditOutlined className="text-blue-600" />}
                                onClick={() => redirectHandler(row.instrument_type_id)}
                            />
                        </Tooltip>
                    )}
                    {hasPermission("DELETE_INSTRUMENT_VARIANT") && (
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(row.instrument_type_id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        },
    ];


    return (
        <div className="p-6">
            <PageHeader
                title="Instrument Variants"
                breadcrumbItems={[
                    { title: 'Dashboard' },
                    { title: 'Masters' },
                    { title: 'Instrument Variants' },
                ]}
                searchText={searchText}
                onSearchChange={(e) => setSearchText(e.target.value)}
                searchPlaceholder="Search instruments..."
                onActionClick={() => navigate("/dashboard/instrument-types/create")}
                actionButtonIcon={<PlusOutlined />}
                showActionButton={hasPermission("CREATE_INSTRUMENT_VARIANT")}
                extraAction={
                    <Select
                        placeholder="Filter by Lab Type"
                        allowClear
                        size="large"
                        className="w-48 h-11 rounded-xl"
                        value={labType || undefined}
                        onChange={(val) => setLabType(val)}
                    >
                        <Option value="NABL">NABL</Option>
                        <Option value="NON-NABL">NON-NABL</Option>
                    </Select>
                }
                actionButtonText="Add Variant"

            />

            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
                <ReusableTable
                    columns={columns}
                    data={instrumentTypeList}
                    rowKey="instrument_type_id"
                    loading={loading}
                    className="variant-table"
                />

                <style>{`
                    .variant-table .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #1e293b !important;
                        font-weight: 700 !important;
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                    }
                    .variant-table .ant-table-tbody > tr > td {
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                        color: #334155 !important;
                    }
                    .variant-table .ant-tag {
                        font-size: 12px !important;
                        line-height: 20px !important;
                    }
                    .variant-table .ant-typography {
                        font-size: 13px !important;
                    }
                    .variant-table .ant-table-row:hover {
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

export default ListInstrumentType;