import React, { useContext, useState, useEffect, useCallback } from "react";
import { Card, Input, Button, Select, Dropdown, message } from "antd";
import {
    DeleteFilled,
    EditFilled,
    MoreOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { labIdActions } from "../../../store/labId";
import { useNavigate } from "react-router-dom";
import { addNewId, searchByNameFunction } from "./higherOrderFunction";
import DataTable from "../../common/DataTable";
import showConfirmationDialog from "../../../utils/showConfirmationToast";

const { Option } = Select;

const ListInstrumentType = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [instrumentTypeList, setInstrumentTypeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);
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
            dispatch(
                notificationActions.changenotification({
                    title: "Something went wrong",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                })
            );
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
        dispatch(labIdActions.setLabId(id));
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
                message.success("Deleted Successfully");
                fetchInstrumentType();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const ActionMenu = ({ row }) => (
        <Dropdown
            menu={{
                items: [
                    {
                        key: "edit",
                        label: "Edit",
                        icon: <EditFilled />,
                        onClick: () => redirectHandler(row.instrument_type_id),
                    },
                    {
                        key: "delete",
                        label: "Delete",
                        icon: <DeleteFilled />,
                        danger: true,
                        onClick: () => handleDelete(row.instrument_type_id),
                    },
                ],
            }}
            trigger={["click"]}
        >
            <Button icon={<MoreOutlined />} />
        </Dropdown>
    );

    const columns = [
        {
            title: "Instrument",
            dataIndex: "instrument_name",
            align: "center",
        },
        {
            title: "Instrument Full Name",
            dataIndex: "instrument_full_name",
            align: "center",
        },
        {
            title: "Lab Type",
            dataIndex: "labtype",
            align: "center",
            filters: ["NABL", "NON-NABL"].map((t) => ({
                text: t,
                value: t,
            })),
            onFilter: (v, r) => r.labtype === v,
        },
        {
            title: "Category",
            dataIndex: "instrument_type_spec",
            align: "center",
        },
        {
            title: "UOM",
            dataIndex: "ins_uom_name",
            align: "center",
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (_, row) => <ActionMenu row={row} />,
        },
    ];


    return (
        <div className="users__containers">
            <Card title="Instrument Variants List">
                <div style={{ display: "flex", gap: 20, marginBottom: 10, justifyContent: "flex-end" }}>

                    <Input
                        placeholder="Search Instrument"
                        prefix={<SearchOutlined />}
                        allowClear
                        size="large"
                        style={{ width: 300 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />

                    <Select
                        placeholder="Lab Type"
                        allowClear
                        size="large"
                        style={{ width: 200 }}
                        value={labType || undefined}
                        onChange={(val) => setLabType(val)}
                    >
                        <Option value="NABL">NABL</Option>
                        <Option value="NON-NABL">NON-NABL</Option>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={instrumentTypeList}
                    loading={loading}
                    pageSize={pageSize}
                    scroll={{ x: "max-content" }}
                />
            </Card>
        </div>
    );
};

export default ListInstrumentType;
