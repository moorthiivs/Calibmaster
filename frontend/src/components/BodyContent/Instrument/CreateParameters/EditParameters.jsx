// import {
//     Button, Input, Select, ButtonIcon
// } from "react-rainbow-components";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSave, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// import { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../../../../context/auth-context";
// import { useDispatch } from "react-redux";
// import config from "../../../../utils/config.js";
// import { notificationActions } from "../../../../store/nofitication";
// import Loader from "../../../UI/Loader";
// import { populateUomWithsysmbol } from "../HelperFunction";
// import { populateInstrumentData } from "../../InstrumentType/HelperFunction";
// import showConfirmationDialog from "../../../../utils/showConfirmationToast";

// export default function EditParameters({ setParametersData }) {
//     const auth = useContext(AuthContext);
//     const dispatch = useDispatch();

//     const [instrument, setInstrument] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [UOM, setUOM] = useState([]);
//     const [parameters, setParameters] = useState([]);

//     const [instrument_id, setinstrument_id] = useState(null)

//     async function fetchData() {
//         setLoading(true);
//         try {
//             const instrumentResonse = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: "Bearer " + auth.token,
//                 },
//                 body: JSON.stringify({ lab_id: auth.labId })
//             }).then((res) => res.json());
//             let getInstrumentData = await populateInstrumentData(instrumentResonse.data);
//             setInstrument(getInstrumentData);

//             const uomResonse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: "Bearer " + auth.token,
//                 },
//             }).then((res) => res.json());
//             let getUomData = await populateUomWithsysmbol(uomResonse.data);
//             setUOM(getUomData);

//             setLoading(false);
//         } catch (error) {
//             const errNotification = {
//                 title: "Something went wrong",
//                 description: "",
//                 icon: "error",
//                 state: true,
//                 timeout: 1500,
//             };
//             dispatch(notificationActions.changenotification(errNotification));
//         } finally {
//             setLoading(false);
//         }
//     }

//     const fetchInstrumentParameterData = async (id) => {
//         setLoading(true);
//         setinstrument_id(id)
//         try {
//             const response = await fetch(`${config.Calibmaster.URL}/api/instrument/instrument-parameters/${id}`, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: "Bearer " + auth.token,
//                 },
//             });
//             if (!response.ok) {
//                 throw new Error(`Error: ${response.statusText}`);
//             }
//             const data = await response.json();

//             console.log(data, "data");

//             setParameters(data);
//         } catch (error) {
//             console.log("Error fetching instrument parameters:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const handleChange = (index, field, value) => {
//         const updated = [...parameters];
//         updated[index][field] = value;
//         setParameters(updated);
//     };

//     const handleDelete = async (index, id) => {

//         const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?", ".instrumenParameter-modal");

//         if (!confirmDelete) {
//             console.log("Cancel Delete!");
//             return;
//         }
//         const bodyData = {
//             instrument_Parameter_id: id,
//             labid: auth.labId,
//             userid: auth.userId
//         }

//         const response = await fetch(config.Calibmaster.URL + "/api/instrument/instrument-parameters-delete", {
//             method: "DELETE",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: "Bearer " + auth.token,
//             },
//             body: JSON.stringify(bodyData),
//         });

//         if (response.ok) {
//             dispatch(notificationActions.changenotification({
//                 title: "Parameters Deleted successfully",
//                 icon: "success",
//                 state: true,
//                 timeout: 1500
//             }));
//             const updatedParameters = parameters.filter((param, idx) => idx !== index);
//             setParameters(updatedParameters);
//         } else {
//             throw new Error("Failed to update");
//         }


//     };

//     const handleAddRow = () => {
//         const newRow = { Instrumentparametername: "", InstrumentUOMID: "", InstrumentparameterUOM: "" };
//         setParameters([...parameters, newRow]);
//     };

//     const handleSave = async () => {
//         try {
//             setLoading(true);
//             const filteredRows = parameters.filter(row =>
//                 row.Instrumentparametername.trim() !== ""
//             );
//             const bodyData = {
//                 parametersData: filteredRows,
//                 instrument_id,
//                 labid: auth.labId,
//                 userid: auth.userId
//             }
//             const response = await fetch(config.Calibmaster.URL + "/api/instrument/instrument-parameters-update", {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: "Bearer " + auth.token,
//                 },
//                 body: JSON.stringify(bodyData),
//             });

//             if (response.ok) {
//                 dispatch(notificationActions.changenotification({
//                     title: "Parameters updated successfully",
//                     icon: "success",
//                     state: true,
//                     timeout: 1500
//                 }));
//             } else {
//                 throw new Error("Failed to update");
//             }
//         } catch (err) {
//             dispatch(notificationActions.changenotification({
//                 title: "Update failed",
//                 icon: "error",
//                 state: true,
//                 timeout: 1500
//             }));
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <>
//             <div style={{ padding: "10px", fontFamily: 'Arial, sans-serif' }}>
//                 <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Edit Parameters</h2>

//                 <div className="form__group" style={{ display: "flex", justifyContent: "center" }}>
//                     <Select
//                         label="Select Instrument"
//                         options={instrument}
//                         required={true}
//                         className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
//                         onChange={async (e) => {
//                             fetchInstrumentParameterData(e.target.value);
//                         }}
//                     />
//                 </div>

//                 {parameters.map((param, index) => (
//                     <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "10px" }}>
//                         <Input
//                             label="Parameter Name"
//                             value={param.Instrumentparametername}
//                             onChange={(e) => handleChange(index, "Instrumentparametername", e.target.value)}
//                             style={{ width: "300px" }}
//                         />
//                         <Select
//                             label="UOM"
//                             options={UOM}
//                             value={param.InstrumentUOMID}
//                             onChange={(e) => {
//                                 const selectedValue = parseInt(e.target.value);
//                                 const selectedUOM = UOM.find(u => u.value === selectedValue);
//                                 handleChange(index, "InstrumentparameterUOM", selectedUOM.sysmbol)
//                                 handleChange(index, "InstrumentUOMID", selectedValue)
//                             }}
//                             style={{ width: "200px" }}
//                         />
//                         <ButtonIcon
//                             style={{ marginTop: "20px" }}
//                             icon={<FontAwesomeIcon icon={faTrash} />}
//                             variant="border-filled"
//                             onClick={() => handleDelete(index, param.id)}
//                         />
//                     </div>
//                 ))}

//                 <div style={{ textAlign: "center", marginTop: "20px" }}>
//                     <Button variant="success" onClick={handleAddRow}>
//                         Add Row <FontAwesomeIcon icon={faPlus} className="rainbow-m-left_medium" style={{ marginLeft: "10px" }} />
//                     </Button>
//                 </div>

//                 <div style={{ textAlign: "center", marginTop: "30px" }}>
//                     <Button variant="brand" onClick={handleSave}>
//                         Save Changes <FontAwesomeIcon icon={faSave} className="rainbow-m-left_medium" style={{ marginLeft: "10px" }} />
//                     </Button>
//                 </div>
//             </div>

//             {loading && <Loader />}
//         </>
//     );
// }
import { useContext, useEffect, useState } from "react";
import { Button, Input, Select, Spin, Row, Col, Typography, Space } from "antd";
import { SaveOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import config from "../../../../utils/config.js";
import { notificationActions } from "../../../../store/nofitication";
import { populateUomWithsysmbol } from "../HelperFunction";
import { populateInstrumentData } from "../../InstrumentType/HelperFunction";
import showConfirmationDialog from "../../../../utils/showConfirmationToast";

const { Title } = Typography;
const { Option } = Select;

export default function EditParameters({ setParametersData }) {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [instrument, setInstrument] = useState([]);
    const [loading, setLoading] = useState(false);
    const [UOM, setUOM] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [instrument_id, setInstrumentId] = useState(null);

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

            setInstrument(await populateInstrumentData(instrumentResonse.data));

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

            dispatch(notificationActions.changenotification({
                title: "Parameters Deleted successfully",
                icon: "success",
                state: true,
                timeout: 1500
            }));

            setParameters(prev => prev.filter((_, idx) => idx !== index));

        } catch {
            dispatch(notificationActions.changenotification({
                title: "Delete failed",
                icon: "error",
                state: true,
                timeout: 1500
            }));
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

            dispatch(notificationActions.changenotification({
                title: "Parameters updated successfully",
                icon: "success",
                state: true,
                timeout: 1500
            }));

        } catch {
            dispatch(notificationActions.changenotification({
                title: "Update failed",
                icon: "error",
                state: true,
                timeout: 1500
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <div style={{ padding: 0 }}>
                <Title level={4} style={{ textAlign: "center", marginBottom: 20 }}>
                    Edit Parameters
                </Title>

                <Row justify="center" style={{ marginBottom: 20 }}>
                    <Col style={{ width: 300 }}>
                        <Select
                            placeholder="Select Instrument"
                            style={{ width: "100%" }}
                            size="large"
                            onChange={(value) => {
                                if (!value) {
                                    setInstrumentId(null);
                                    setParameters([]);  // 🔥 Clear parameters when cleared
                                    return;
                                }
                                fetchInstrumentParameterData(value);
                            }}
                            showSearch={true}
                            allowClear
                            filterOption={(input, option) =>
                                option?.children?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {instrument.map(opt => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>

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
            </div>
        </Spin>
    );
}
