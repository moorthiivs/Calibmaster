import { useState, useEffect, useContext } from 'react';
import { Modal, Input, Button, Select, Card, Textarea, Spinner } from 'react-rainbow-components';
import { notificationActions } from '../../../store/nofitication';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.js";
import Loader from '../../UI/Loader';

const VcCertificateGenerate = (props) => {

    // *** Collect SRF-Item ID, MASTER LIST OF EQUIPMENTS Array *** 
    const [srfItemId, setSrfItemId] = useState("");
    const [masterList, setMasterList] = useState([]);

    // *** Input Fields useState Hooks ***
    const [selectedMasterList, setSelectedMasterList] = useState("");

    const [ulrNumber, setUlrNumber] = useState("");
    const [validity, setValidity] = useState("");
    const [traceability, setTraceability] = useState("");

    const [calibrationProcedure, setCalibrationProcedure] = useState("");
    const [temperature, setTemperature] = useState("");
    const [humidity, setHumidity] = useState("");

    // *** Calibration Results Handling useState Hooks ***
    const [calibration, setCalibration] = useState([
        { id: "1", std_reading: 0, external: 0, error_1: 0, internal: 0, error_2: 1, depth: 0, error_3: 0 },
        { id: "2", std_reading: 20, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "3", std_reading: 50, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "4", std_reading: 100, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "5", std_reading: 150, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "6", std_reading: 200, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "7", std_reading: 250, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 },
        { id: "8", std_reading: 300, external: 0, error_1: 0, internal: 0, error_2: 0, depth: 0, error_3: 0 }
    ]);

    const [uncertainty, setUncertainty] = useState("");
    const [calibratedBy, setCalibratedBy] = useState("");
    const [approvedBy, setApprovedBy] = useState("");

    const [reamark1, setReamark1] = useState("");
    const [reamark2, setReamark2] = useState("");
    const [reamark3, setReamark3] = useState("");
    const [reamark4, setReamark4] = useState("");
    const [reamark5, setReamark5] = useState("");

    // *** Error handling useState Hooks ***
    const [error, setError] = useState("");

    // *** Spinner Loading useState Hooks ***
    const [loading, setloading] = useState(false);

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    // *** Fetch MASTER LIST OF EQUIPMENTS ***
    const fetchMasterList = async () => {
        try {

            let response = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            }).then((res) => res.json());

            if (response?.code == 200) {

                const data = response?.data;

                let masterArr = [{ value: '', label: 'Select' }];

                await data?.map((item, index) => {
                    masterArr[index + 1] = {
                        value: item?.master_list_equipment_id,
                        label: item?.name_of_equipment
                    }
                })
                setMasterList(masterArr);

            } else {
                const errNotification = {
                    title: "Something went wrong",
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
                dispatch(notificationActions.changenotification(errNotification));
            }
        } catch (error) {
            console.log(error);
            const errNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    useEffect(() => {
        setSrfItemId(props.item.srf_item_id);
        fetchMasterList();
    }, []);


    // TODO: formula [Error = External - Std.Reading] 
    const handleError1Calculation = (id, external, std_reading) => {
        setCalibration(calibration.map(eachRow => {
            if (eachRow.id == id) {
                console.log(parseFloat(std_reading).toFixed(2));
                return {
                    ...eachRow,
                    external: parseFloat(external),
                    error_1: parseFloat(parseFloat(external) - parseFloat(std_reading)).toFixed(2)
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: formula [ Error = internal - Std.Reading]
    const handleError2Calculation = (id, internal, std_reading) => {
        setCalibration(calibration.map(eachRow => {
            if (eachRow.id == id && eachRow.error_2 !== 1) {
                return {
                    ...eachRow,
                    internal: parseFloat(internal),
                    error_2: parseFloat(parseFloat(internal) - parseFloat(std_reading)).toFixed(2)
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: formula [ Error = depth - Std.Reading]
    const handleError3Calculation = (id, depth, std_reading) => {
        setCalibration(calibration.map(eachRow => {
            if (eachRow.id == id && eachRow.error_2 !== 1) {
                return {
                    ...eachRow,
                    depth: parseFloat(depth),
                    error_3: parseFloat(parseFloat(depth) - parseFloat(std_reading)).toFixed(2)
                }
            } else {
                return eachRow;
            }
        }));
    }

    // *** Generate Certificate & Download Handler ***
    const generateCertificateHandler = async () => {

        if (selectedMasterList == "") {
            setError("Please select a master");
            return false;
        }

        if (ulrNumber == "") {
            setError("ULR Number is required.");
            return false;
        }

        if (validity == "") {
            setError("Validity is required.");
            return false;
        }

        if (traceability == "") {
            setError("Traceability is required.");
            return false;
        }

        if (calibrationProcedure == "") {
            setError("CALIBRATION PROCEDURE & REF.STD is required.");
            return false;
        }

        if (temperature == "") {
            setError("Temperature is required.");
            return false;
        }

        if (humidity == "") {
            setError("Humidity is required.");
            return false;
        }

        if (uncertainty == "") {
            setError("Uncertainty is required.");
            return false;
        }

        if (reamark1 == "") {
            setError("Reamark 1 is required.");
            return false;
        }

        if (reamark2 == "") {
            setError("Reamark 2 is required.");
            return false;
        }

        if (reamark3 == "") {
            setError("Reamark 3 is required.");
            return false;
        }

        if (reamark4 == "") {
            setError("Reamark 4 is required.");
            return false;
        }

        if (reamark5 == "") {
            setError("Reamark 5 is required.");
            return false;
        }

        if (calibratedBy == "") {
            setError("Calibrated By is required.");
            return false;
        }

        if (approvedBy == "") {
            setError("Approved By is required.");
            return false;
        }

        setError("");

        try {

            setloading(true);

            // Create Request Body object
            const requestBody = {
                ulr_number: ulrNumber,
                validity: validity,
                traceability: traceability,

                labId: auth.labId,
                srf_item_id: srfItemId,
                master_list_equipment_id: selectedMasterList,

                calibration_procedure: calibrationProcedure,
                temperature: temperature,
                humidity: humidity,

                calibration,
                uncertainty: uncertainty,

                remark_1: reamark1,
                remark_2: reamark2,
                remark_3: reamark3,
                remark_4: reamark4,
                remark_5: reamark5,

                calibrated_by: calibratedBy,
                approved_by: approvedBy
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            await fetch(config.Calibmaster.URL + "/api/calibrations-certificate/vernier-caliper-certificate", requestOptions)
                .then(response => response.blob())
                .then(blob => {
                    let base64String;

                    let reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        base64String = reader.result;

                        const fileName = "certificate-" + new Date().getTime() + ".pdf";

                        const aTag = document.createElement('a');
                        aTag.href = base64String;
                        aTag.setAttribute('download', fileName);
                        document.body.appendChild(aTag);
                        aTag.click();
                        aTag.remove();
                    };

                    setloading(false);
                })
                .catch((err) => {
                    console.log(err);
                    const errNotification = {
                        title: data?.message,
                        icon: "error",
                        state: true,
                        timeout: 15000,
                    };
                    dispatch(notificationActions.changenotification(errNotification));
                    setloading(false);
                });
        } catch (err) {
            console.log(err);
            const errNotification = {
                title: "Something went wrong",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(errNotification));
            setloading(false);
        }
    }

    if (loading)
        return <Loader />;

    return (
        <>
            <Modal
                id="modal-1"
                isOpen={props.isOpen}
                onRequestClose={props.onclose}
                className="view__srf__item__modal"
                title="Generate Vernier Caliper Certificate"
                footer={
                    <div className="rainbow-flex rainbow-justify_spread" style={{ textAlign: "center" }}>
                        <Button label="Generate Certificate" variant="brand" onClick={generateCertificateHandler} />
                        {
                            error && <p style={{ margin: 0, color: "red" }}>{error}</p>
                        }
                    </div>
                }
            >
                {/* {JSON.stringify(props?.item.srf)} */}

                <div className="srf__item__details__container" style={{ justifyContent: "center", marginBottom: "1rem" }}>

                    {/* Test  */}
                    <div className="srf__item__detail" style={{ display: "none" }}>
                        <span className="bold">
                            S.No: <span className="red">{
                                (props?.mode === "Opened_via_Filtered_Items")
                                    ? props?.item.slNo :
                                    props?.item?.srf_item_no
                            }</span>
                        </span>
                        <span>srf_item_id: {srfItemId}</span>
                    </div>

                    {/* MASTER LIST OF EQUIPMENTS */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Select
                            label="Select Master"
                            options={masterList}
                            id="example-select-1"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => { setSelectedMasterList(e.target.value) }}
                            required={true}
                        />
                    </div>

                    {/* ULR NUMBER */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="ULR NUMBER"
                            placeholder="ULR NUMBER"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setUlrNumber(e.target.value)}
                            required={true}
                        />
                    </div>

                    {/* VALIDITY */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="VALIDITY"
                            placeholder="VALIDITY"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setValidity(e.target.value)}
                            required={true}
                        />
                    </div>

                    {/* TRACEABILITY */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="TRACEABILITY"
                            placeholder="TRACEABILITY"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setTraceability(e.target.value)}
                            required={true}
                        />
                    </div>

                    {/* CALIBRATION PROCEDURE & REF.STD */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="CALIBRATION PROCEDURE & REF.STD"
                            placeholder="CALIBRATION PROCEDURE & REF.STD"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setCalibrationProcedure(e.target.value)}
                            required={true}
                        />
                    </div>

                    {/* TEMPERATURE (°C) */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="TEMPERATURE (°C)"
                            placeholder="TEMPERATURE (°C)"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setTemperature(e.target.value)}
                            required={true}
                        />
                    </div>

                    {/* HUMIDITY (RH %) */}
                    <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                        <Input
                            label="HUMIDITY (RH %)"
                            placeholder="HUMIDITY (RH %)"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => setHumidity(e.target.value)}
                            required={true}
                        />
                    </div>

                </div>

                {/* CALIBRATION RESULT ( All Values are in mm ) */}
                <Card style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
                    <h4 style={{ textAlign: "center" }}>
                        CALIBRATION RESULT ( All Values are in mm )
                    </h4>

                    <table className="table" style={{ width: "100%", textAlign: "center" }}>
                        <thead>
                            <tr>
                                <th>STD READING</th>
                                <th>EXTERNAL</th>
                                <th>ERROR</th>
                                <th>INTERNAL</th>
                                <th>ERROR</th>
                                <th>DEPTH</th>
                                <th>ERROR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                calibration?.map((item) => {
                                    return <tr key={item?.id}>
                                        <td>{item?.std_reading}</td>
                                        <td>
                                            <input type="number" step={0.001} onChange={(e) => {
                                                if (e.target.value) {
                                                    handleError1Calculation(item?.id, e.target.value, item?.std_reading)
                                                }
                                            }} />
                                        </td>
                                        <td>{item?.error_1}</td>
                                        <td>
                                            {
                                                item?.error_2 === 1
                                                    ? "-"
                                                    : <input type="number" step={0.001} onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleError2Calculation(item?.id, e.target.value, item?.std_reading)
                                                        }
                                                    }} />
                                            }
                                        </td>
                                        <td>{item?.error_2 === 1 ? "-" : item?.error_2}</td>
                                        <td>
                                            <input type="number" step={0.001} onChange={(e) => {
                                                if (e.target.value) {
                                                    handleError3Calculation(item?.id, e.target.value, item?.std_reading)
                                                }
                                            }} />
                                        </td>
                                        <td>{item?.error_3}</td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </Card>

                <Card style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                    <div className="srf__item__details__container"
                        style={{ justifyContent: "center", paddingTop: "1rem", paddingBottom: "1rem" }}>

                        {/* UNCERTAINTY ± µm */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "30%" }}>
                            <Input
                                label="UNCERTAINTY ± µm"
                                type="number"
                                placeholder="UNCERTAINTY ± µm"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                step="0.001"
                                onChange={(e) => setUncertainty(e.target.value)}
                                required={true}
                            />
                        </div>

                        {/* Calibrated By */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "30%" }}>
                            <Input
                                label="Calibrated By"
                                placeholder="Calibrated By"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setCalibratedBy(e.target.value)}
                                required={true}
                            />
                        </div>

                        {/* Approved by */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "30%" }}>
                            <Input
                                label="Approved By"
                                placeholder="Approved By"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setApprovedBy(e.target.value)}
                                required={true}
                            />
                        </div>
                    </div>
                </Card>

                {/* REMARKS Cards */}
                <Card style={{ paddingTop: "1rem", marginBottom: "1rem", paddingBottom: "1rem" }}>

                    <h4 style={{ textAlign: "center" }}>REMARKS</h4>

                    <div className="srf__item__details__container" style={{ justifyContent: "center" }}>

                        {/* Remark 1 */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                            <Textarea
                                label="Remark 1"
                                rows={4}
                                placeholder="Remark 1"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setReamark1(e.target.value)}
                            />
                        </div>

                        {/* Remark 2 */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                            <Textarea
                                label="Remark 2"
                                rows={4}
                                placeholder="Remark 2"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setReamark2(e.target.value)}
                            />
                        </div>

                        {/* Remark 3 */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                            <Textarea
                                label="Remark 3"
                                rows={4}
                                placeholder="Remark 3"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setReamark3(e.target.value)}
                            />
                        </div>

                        {/* Remark 4 */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                            <Textarea
                                label="Remark 4"
                                rows={4}
                                placeholder="Remark 4"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setReamark4(e.target.value)}
                            />
                        </div>

                        {/* Remark 5 */}
                        <div className="srf__item__detail" style={{ padding: "0.5rem", width: "45%" }}>
                            <Textarea
                                label="Remark 5"
                                rows={4}
                                placeholder="Remark 5"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={(e) => setReamark5(e.target.value)}
                            />
                        </div>
                    </div>

                </Card>

            </Modal>
        </>
    )
}

export default VcCertificateGenerate;
