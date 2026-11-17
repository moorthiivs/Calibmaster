import { useContext, useEffect, useState } from "react";
import { Button, Input, Select, Spin, Row, Col, Typography, Space, Tooltip, Table, Modal, Divider } from "antd";
import { SaveOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EditOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import config from "../../../../utils/config.json";
import { populateUomWithsysmbol } from "../HelperFunction";
import { populateInstrumentData } from "../../InstrumentType/HelperFunction";
import showConfirmationDialog from "../../../../utils/showConfirmationToast";
import dayjs from "dayjs";
import GlobalNotification from "../../../../utils/GlobalNotification";

const { Title } = Typography;
const { Option } = Select;

export default function EditParameters({ setParametersData = () => { } }) {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [instrument, setInstrument] = useState([]);
    const [loading, setLoading] = useState(false);
    const [UOM, setUOM] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [instrument_id, setInstrumentId] = useState(null);
    const [selectedInstrumentName, setSelectedInstrumentName] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
    });
    const [searchText, setSearchText] = useState("");

    const [editModal, setEditModal] = useState(false)

    async function fetchData() {
        setLoading(true);
        try {
            const instrumentResonse = await fetch(
                config.Calibmaster.URL + "/api/instrument/list",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({ lab_id: auth.labId })
                }
            ).then(res => res.json());

            setInstrument(instrumentResonse.data);

            const uomResonse = await fetch(
                config.Calibmaster.URL + "/api/uom/list",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                }
            ).then(res => res.json());

            setUOM(await populateUomWithsysmbol(uomResonse.data));

        } catch (error) {
            GlobalNotification.error({
                title: "Something went wrong",
            });
        } finally {
            setLoading(false);
        }
    }

    const fetchInstrumentParameterData = async (id) => {
        setLoading(true);
        setInstrumentId(id);

        try {
            const response = await fetch(
                `${config.Calibmaster.URL}/api/instrument/instrument-parameters/${id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                }
            );

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            setParameters(data);

        } catch (error) {
            console.log("Error fetching instrument parameters:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (index, field, value) => {
        setParameters(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleDelete = async (index, id) => {

        if (index === 0) {
            GlobalNotification.warning({ title: "You can not delete this parameter", description: "Atleast one parameter is required" })
            return
        }
        const confirmDelete = await showConfirmationDialog(
            "Are You Sure Want to Delete?",
            ".instrumenParameter-modal"
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch(
                config.Calibmaster.URL + "/api/instrument/instrument-parameters-delete",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({
                        instrument_Parameter_id: id,
                        labid: auth.labId,
                        userid: auth.userId
                    }),
                }
            );

            if (!response.ok) throw new Error("Delete failed");

            GlobalNotification.success({ title: "Parameters Deleted successfully" })

            setParameters(prev => prev.filter((_, idx) => idx !== index));

        } catch {
            GlobalNotification.error({ title: "Delete failed" })
        }
    };

    const handleAddRow = () => {
        setParameters(prev => [
            ...prev,
            { Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }
        ]);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const filteredRows = parameters.filter(row =>
                row.Instrumentparametername.trim() !== ""
            );

            const response = await fetch(
                config.Calibmaster.URL + "/api/instrument/instrument-parameters-update",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({
                        parametersData: filteredRows,
                        instrument_id,
                        labid: auth.labId,
                        userid: auth.userId
                    }),
                }
            );

            if (!response.ok) throw new Error();

            GlobalNotification.success({ title: "Parameters updated successfully", description: `Parameters updated successfully for ${selectedInstrumentName}` })
            setEditModal(false)
            fetchData()
        } catch {
            GlobalNotification.error({ title: "Update failed", description: `Parameters update failed for ${selectedInstrumentName}` })
        } finally {
            setLoading(false);
        }
    };


    const columns = [
        {
            title: "S.No",
            render: (_, __, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: 'Instrument Name',
            dataIndex: 'instrument_name',
        },
        {
            title: 'Created At',
            dataIndex: 'created_timestamp',
            render: (text) => dayjs(text).format('DD-MM-YYYY hh:mm A'),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => {
                        setSelectedInstrumentName(record.instrument_name)
                        fetchInstrumentParameterData(record.instrument_id)
                        setEditModal(true);
                    }} />
                </Space>
            ),
        }
    ];

    const filteredInstrument = instrument?.filter((item) =>
        item.instrument_name?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Spin spinning={loading}>
            <div style={{ padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Input
                        placeholder={`Search Parameters`}
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                        size="large"
                    />
                </div>

                <Table
                    dataSource={filteredInstrument}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        onChange: (page, pageSize) =>
                            setPagination({ current: page, pageSize }),
                    }}
                />
            </div>

            <Modal
                title={`${selectedInstrumentName.toLocaleUpperCase()} - Edit Parameters`}
                open={editModal}
                onOk={() => setEditModal(false)}
                onCancel={() => setEditModal(false)}
                width={700}
                footer={null}
            >
                <Divider orientation="center" style={{ marginTop: 20, marginBottom: 20 }}>
                    <h2 className="font-bold uppercase">{selectedInstrumentName}</h2>
                </Divider>
                {parameters.map((param, index) => (
                    <Row
                        key={index}
                        gutter={16}
                        align="middle"
                        justify="center"
                        style={{ marginBottom: 16 }}
                    >
                        <Col>
                            <Input
                                placeholder="Parameter Name"
                                value={param.Instrumentparametername}
                                onChange={(e) =>
                                    handleChange(index, "Instrumentparametername", e.target.value)
                                }
                                style={{ width: 250 }}
                                size="large"
                            />
                        </Col>

                        <Col>
                            <Select
                                placeholder="Select UOM"
                                value={param.InstrumentUOMID || undefined}
                                style={{ width: 200 }}
                                size="large"
                                onChange={(value) => {
                                    const selectedUOM = UOM.find(u => u.value === value);
                                    handleChange(index, "InstrumentUOMID", value);
                                    handleChange(
                                        index,
                                        "InstrumentparameterUOM",
                                        selectedUOM?.sysmbol || ""
                                    );
                                }}
                            >
                                {UOM.map(u => (
                                    <Option key={u.value} value={u.value}>
                                        {u.label}
                                    </Option>
                                ))}
                            </Select>
                        </Col>

                        <Col>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(index, param.id)}
                                size="large"
                            />
                        </Col>
                    </Row>
                ))}

                <Divider orientation="center">
                    <Row justify="center" style={{ marginTop: 50 }}>
                        <Space>
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={handleAddRow}
                                size="large"
                            >
                                Add Row
                            </Button>

                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                size="large"
                            >
                                Save Changes
                            </Button>
                        </Space>
                    </Row>
                </Divider>
            </Modal>
        </Spin>
    );
}