import { Modal, Input, Button, Table, Popconfirm, Spin, notification } from "antd";
import { CloseOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/auth-context";
import config from "../../../../utils/config.json";
import "./styles.css";

export default function CreateInstrumentVariants({ isOpen, onClose, fetchData }) {

    const auth = useContext(AuthContext);

    const [instrumentVariantType, setInstrumentVariantType] = useState("");
    const [inputerr, setinputerr] = useState("");
    const [gridData, setGridData] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editRowData, setEditRowData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchGridData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${config.Calibmaster.URL}/api/instrumentvariantstype/fetch?labid=${auth.labId}`,
                {
                    headers: { Authorization: `Bearer ${auth.token}` },
                }
            );
            const data = await response.json();
            setGridData(data.data || []);
        } finally {
            setLoading(false);
        }
    };

    const createInstrumentVariant = async () => {
        if (!instrumentVariantType.trim()) return setinputerr("Please enter a valid Instrument Type");

        setLoading(true);
        try {
            const response = await fetch(
                `${config.Calibmaster.URL}/api/instrumentvariantstype/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.token}`,
                    },
                    body: JSON.stringify({
                        instrument_variant_type: instrumentVariantType,
                        labid: auth.labId,
                        createdBy: auth.userId,
                    }),
                }
            );

            const data = await response.json();
            if (!response.ok) return notification.error({ message: data.message });

            notification.success({ message: data.message });
            if (fetchData) fetchData()
            fetchGridData();
            setInstrumentVariantType("");
        } finally {
            setLoading(false);
        }
    };

    const updateInstrumentVariant = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${config.Calibmaster.URL}/api/instrumentvariantstype/update/${editRowData.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.token}`,
                    },
                    body: JSON.stringify({
                        instrumentVariantType,
                        updatedBy: auth.userId,
                        labid: auth.labId,
                    }),
                }
            );

            const data = await response.json();
            if (!response.ok) return notification.error({ message: data.message });

            notification.success({ message: data.message });
            fetchGridData();
            setEditMode(false);
            setInstrumentVariantType("");
            setEditRowData(null);

            if (fetchData) fetchData()
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row) => {
        setLoading(true);
        try {
            await fetch(
                `${config.Calibmaster.URL}/api/instrumentvariantstype/delete/${row.id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${auth.token}` },
                }
            );

            notification.success({ message: "Deleted Successfully" });
            fetchGridData();
            if (fetchData) fetchData()
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGridData();
    }, []);

    const columns = [
        { title: "SL.No", render: (_, __, index) => index + 1, width: 80 },
        { title: "Instrument Type", dataIndex: "instrumentVariantsType" },
        {
            title: "Actions",
            render: (row) => (
                <Button icon={<EditOutlined />} type="primary" size="small" onClick={() => {
                    setEditMode(true);
                    setEditRowData(row);
                    setInstrumentVariantType(row.instrumentVariantsType);
                }} />
            ),
        },
        {
            title: "Delete",
            render: (row) => (
                <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(row)}>
                    <Button icon={<DeleteOutlined />} danger size="small" />
                </Popconfirm>
            ),
        },
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            title="Add Instrument Variant Type"
            closeIcon={<CloseOutlined />}
            width={800}
            mask={false}
            getContainer={false}

        >
            <Spin spinning={loading}>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <Input
                        placeholder="Instrument Variant Type"
                        value={instrumentVariantType}
                        onChange={(e) => {
                            setInstrumentVariantType(e.target.value);
                            setinputerr("");
                        }}
                        status={inputerr ? "error" : ""}
                    />
                    <Button type="primary" onClick={editMode ? updateInstrumentVariant : createInstrumentVariant}>
                        {editMode ? "Save" : "Create"}
                    </Button>
                </div>

                <Table
                    dataSource={gridData}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Spin>
        </Modal>
    );
}
