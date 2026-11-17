import { useContext, useEffect, useState } from "react";
import { Button, Input, Select, Spin, Row, Col, Typography, Space } from "antd";
import { PlusOutlined, SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import config from "../../../../utils/config.json";
import GlobalNotification from "../../../../utils/GlobalNotification";
import { populateDisciplineData, populateUomWithsysmbol } from "../HelperFunction";

const { Title } = Typography;
const { Option } = Select;

export default function CreateParameters({ isOpen, onClose, setParametersData, ParametersData }) {

    const auth = useContext(AuthContext);

    const [UOM, setUOM] = useState([]);
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState(
        ParametersData && ParametersData.length > 0 
        ? ParametersData 
        : [{ Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }]
    );

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const uomResponse = await fetch(
                    config.Calibmaster.URL + "/api/uom/list",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                    }
                ).then(res => res.json());

                const getUomData = await populateUomWithsysmbol(uomResponse.data);
                setUOM(getUomData);

                const disciplineResponse = await fetch(
                    config.Calibmaster.URL + "/api/instrument-discipline/list",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                    }
                ).then(res => res.json());

                await populateDisciplineData(disciplineResponse.data);

            } catch (error) {
                GlobalNotification.error({
                    title: "Something went wrong",
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }
        ]);
    };

    const handleDeleteRow = (index) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleInputChange = (index, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleSaveParameters = () => {
        const filteredRows = rows.filter(row =>
            row.Instrumentparametername.trim() !== ""
        );

        setParametersData(filteredRows);
        onClose();
    };

    return (
        <Spin spinning={loading}>
            <div style={{ padding: 0 }}>
                <Title level={4} style={{ textAlign: "center", marginBottom: 30 }}>
                    Add Instrument Parameters
                </Title>

                {rows.map((row, index) => (
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
                                value={row.Instrumentparametername}
                                onChange={(e) =>
                                    handleInputChange(index, "Instrumentparametername", e.target.value)
                                }
                                style={{ width: 250 }}
                                size="large"
                            />
                        </Col>

                        <Col>
                            <Select
                                placeholder="Select UOM"
                                value={row.InstrumentUOMID || undefined}
                                style={{ width: 200 }}
                                size="large"
                                onChange={(value) => {
                                    const selectedUOM = UOM.find(u => u.value === value);
                                    handleInputChange(index, "InstrumentUOMID", value);
                                    handleInputChange(
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

                        {rows.length > 1 && (
                            <Col>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteRow(index)}
                                    size="large"
                                />
                            </Col>
                        )}
                    </Row>
                ))}

                <Row justify="center" style={{ marginTop: 50 }}>
                    <Space>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddRow}
                            size="large"
                        >
                            Add New
                        </Button>

                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSaveParameters}
                            size="large"
                        >
                            Save Parameters
                        </Button>
                    </Space>
                </Row>
            </div>
        </Spin>
    );
}