// import {
//     Button, Column, Input, Modal, TableWithBrowserPagination, ButtonIcon, Select
// } from "react-rainbow-components";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faPlus, faSave, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
// import { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../../../../context/auth-context";
// import { useDispatch } from "react-redux";
// import config from "../../../../utils/config.js";
// import { notificationActions } from "../../../../store/nofitication";
// import Loader from "../../../UI/Loader";
// import showConfirmationDialog from "../../../../utils/showConfirmationToast";
// import "./styles.css";
// import { populateDisciplineData, populateUomData, populateUomWithsysmbol } from "../HelperFunction";

// export default function CreateParameters({ isOpen, onClose, setParametersData }) {

//     const auth = useContext(AuthContext);
//     const dispatch = useDispatch();
//     const [UOM, setUOM] = useState([]);
//     const [loading, setloading] = useState(false);
//     const [rows, setRows] = useState([{ Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }]);


//     useEffect(() => {
//         async function fetchData() {
//             setloading(true);
//             try {
//                 const uomResponse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
//                     method: "GET",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: "Bearer " + auth.token,
//                     },
//                 }).then(res => res.json());

//                 const getUomData = await populateUomWithsysmbol(uomResponse.data);
//                 setUOM(getUomData);

//                 const disciplineResponse = await fetch(config.Calibmaster.URL + "/api/instrument-discipline/list", {
//                     method: "GET",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: "Bearer " + auth.token,
//                     },
//                 }).then(res => res.json());

//                 const getDisciplineData = await populateDisciplineData(disciplineResponse.data);
//                 // use getDisciplineData if needed later

//             } catch (error) {
//                 dispatch(notificationActions.changenotification({
//                     title: "Something went wrong",
//                     description: "",
//                     icon: "error",
//                     state: true,
//                     timeout: 1500,
//                 }));
//             } finally {
//                 setloading(false);
//             }
//         }

//         fetchData();
//     }, []);

//     const handleAddRow = () => {
//         setRows([...rows, { Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }]);
//     };

//     const handleDeleteRow = (index) => {
//         const updatedRows = [...rows];
//         updatedRows.splice(index, 1);
//         setRows(updatedRows);
//     };

//     const handleInputChange = (index, field, value) => {
//         const updatedRows = [...rows];
//         updatedRows[index][field] = value;
//         setRows(updatedRows);
//     };



//     const handleSaveParameters = () => {
//         const filteredRows = rows.filter(row =>
//             row.Instrumentparametername.trim() !== "" &&
//             row.InstrumentUOMID !== "" &&
//             row.InstrumentparameterUOM.trim() !== ""
//         );
//         setParametersData(filteredRows);
//         onClose()
//     };


//     return (
//         <>
//             <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
//                 <div style={{ textAlign: 'center', marginBottom: '30px' }}>
//                     <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
//                         Add Instrument Parameters
//                     </h2>
//                 </div>

//                 {rows.map((row, index) => (
//                     <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "10px" }}>
//                         <Input
//                             label="Parameter Name"
//                             placeholder="Enter parameter name"
//                             value={row.Instrumentparametername}
//                             onChange={(e) => handleInputChange(index, "Instrumentparametername", e.target.value)}
//                             className="rainbow-p-horizontal_medium"
//                             style={{ width: "300px" }}
//                         />
//                         <Select
//                             label="UOM"
//                             options={UOM}
//                             value={row.InstrumentUOMID}
//                             onChange={(e) => {
//                                 const selectedValue = parseInt(e.target.value);
//                                 const selectedUOM = UOM.find(u => u.value === selectedValue);
//                                 handleInputChange(index, "InstrumentparameterUOM", selectedUOM.sysmbol)
//                                 handleInputChange(index, "InstrumentUOMID", selectedValue)
//                             }}
//                             className="rainbow-p-horizontal_medium"
//                             style={{ width: "200px" }}
//                         />
//                         {rows.length > 1 && (
//                             <ButtonIcon
//                                 style={{ marginTop: "20px" }}
//                                 variant="border-filled"
//                                 icon={<FontAwesomeIcon icon={faTrash} />}
//                                 onClick={() => handleDeleteRow(index)}
//                                 title="Delete"
//                             />
//                         )}
//                     </div>
//                 ))}

//                 <div style={{ textAlign: 'center', marginTop: "20px" }}>
//                     <Button variant="brand" onClick={handleAddRow}>
//                         Add New
//                         <FontAwesomeIcon icon={faPlus} className="rainbow-m-left_medium" style={{ marginLeft: "10px" }} />
//                     </Button>
//                 </div>

//                 <div style={{ textAlign: 'center', marginTop: "10px" }}>
//                     <Button variant="success" onClick={handleSaveParameters}>
//                         Save Parameters
//                         <FontAwesomeIcon icon={faSave} className="rainbow-m-left_medium" style={{ marginLeft: "10px" }} />
//                     </Button>
//                 </div>
//             </div>

//             {loading && <Loader />}
//         </>


//     );
// }


import { useContext, useEffect, useState } from "react";
import { Button, Input, Select, Spin, Row, Col, Typography, Space } from "antd";
import { PlusOutlined, SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import config from "../../../../utils/config.js";
import { notificationActions } from "../../../../store/nofitication";
import { populateDisciplineData, populateUomWithsysmbol } from "../HelperFunction";

const { Title } = Typography;
const { Option } = Select;

export default function CreateParameters({ isOpen, onClose, setParametersData }) {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [UOM, setUOM] = useState([]);
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState([
        { Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" }
    ]);

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
                dispatch(notificationActions.changenotification({
                    title: "Something went wrong",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                }));
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
            row.Instrumentparametername.trim() !== "" &&
            row.InstrumentUOMID !== "" &&
            row.InstrumentparameterUOM.trim() !== ""
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
