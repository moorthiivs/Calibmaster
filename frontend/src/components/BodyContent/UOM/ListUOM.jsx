import React, { useContext, useState, useEffect } from "react";
import { Card, Input, Button, Tooltip, Space, Popconfirm } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { labIdActions } from "../../../store/labId";
import { useNavigate } from "react-router-dom";
import {
    addNewId,
    searchByKindOfQuantity,
    searchByNameFunction,
} from "./higherOrderFunction";
import DataTable from "../../common/DataTable";
import { usePermissions } from "../../../hooks/usePermissions";
import GlobalNotification from "../../../utils/GlobalNotification";

const ListUOM = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [uomList, setUomList] = useState([]);
    const [loading, setLoading] = useState(false);

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
            response = await addNewId(response.data);
            setUomList(response);
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

    const searchNameFunction = async (val) => {
        if (val) {
            try {
                setLoading(true);
                const data = await searchByNameFunction(val, auth);
                let response = await addNewId(data);
                setUomList(response);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
                GlobalNotification.error({ title: "Search failed" });
            }
        } else {
            fetchUOMs();
        }
    };

    const searchQuantityFunction = async (val) => {
        if (val) {
            try {
                setLoading(true);
                const data = await searchByKindOfQuantity(val, auth);
                let response = await addNewId(data);
                setUomList(response);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
                GlobalNotification.error({ title: "Search failed" });
            }
        } else {
            fetchUOMs();
        }
    };

    const redirectHandler = (id) => {
        dispatch(labIdActions.setLabId(id));
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
                // Show exact server message (e.g. FK constraint explanation)
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
            title: "UOM Name",
            dataIndex: "uom_name",
            align: "center",
        },
        {
            title: "Kind Of Quantity",
            dataIndex: "uom_kindofquantity",
            align: "center",
        },
        {
            title: "Unit Symbol",
            dataIndex: "uom_printsysmbol",
            align: "center",
        },
        // Action column — only shown when user has at least EDIT_UOM or DELETE_UOM
        (canEdit || canDelete) && {
            title: "Action",
            dataIndex: "uom_id",
            align: "center",
            render: (id) => (
                <Space>
                    {canEdit && (
                        <Tooltip title="Edit UOM">
                            <Button type="primary" icon={<EditOutlined />} onClick={() => redirectHandler(id)}>
                                Edit
                            </Button>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete UOM"
                            description="Are you sure you want to delete this UOM? This action cannot be undone."
                            onConfirm={() => handleDelete(id)}
                            okText="Yes, Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Delete UOM">
                                <Button danger icon={<DeleteOutlined />}>
                                    Delete
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ].filter(Boolean); // Removes false — entire column hidden (header included)

    return (
        <div className="users__containers">
            <Card className="users__cards" title="UOM List">
                {/* Search Section */}
                <Space style={{ marginBottom: "16px" }} wrap>
                    <Input
                        placeholder="Search By UOM Name"
                        onChange={(e) => searchNameFunction(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        size="large"
                    />
                    <Input
                        placeholder="Search By Kind Of Quantity"
                        onChange={(e) => searchQuantityFunction(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        size="large"
                    />
                </Space>

                {/* Data Table */}
                <DataTable columns={columns} data={uomList} loading={loading} />
            </Card>

            {/* {loading && <Loader />} */}
        </div>
    );
};

export default ListUOM;
