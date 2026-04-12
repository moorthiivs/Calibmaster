import { useState, useEffect, useContext } from 'react';
import { Modal, Input, Button, Select, Card, Textarea, Spinner } from 'react-rainbow-components';
import { notificationActions } from '../../../store/nofitication';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.js";
import Loader from '../../UI/Loader';

const CertificateGenerate = (props) => {

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
        { id: "1", std_reading: 0, external: 0, error_1: 0, internal: 0, error_2: 1 },
        { id: "2", std_reading: 20, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "3", std_reading: 50, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "4", std_reading: 100, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "5", std_reading: 200, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "6", std_reading: 300, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "7", std_reading: 400, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "8", std_reading: 500, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "9", std_reading: 600, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "10", std_reading: 800, external: 0, error_1: 0, internal: 0, error_2: 0 },
        { id: "11", std_reading: 1000, external: 0, error_1: 0, internal: 0, error_2: 0 },
    ]);

    const [uncertainty, setUncertainty] = useState("");
    const [calibratedBy, setCalibratedBy] = useState("");
    const [approvedBy, setApprovedBy] = useState("");

    const [reamark1, setReamark1] = useState("");
    const [reamark2, setReamark2] = useState("");
    const [reamark3, setReamark3] = useState("");
    const [reamark4, setReamark4] = useState("");
    const [reamark5, setReamark5] = useState("");

    // *** Repeatability Results Handling useState Hooks ***
    const [repeatability, setRepeatability] = useState([
        { id: "1", zero_kg: 0, half_load_kg: 0, full_load_kg: 0, },
        { id: "2", zero_kg: 0, half_load_kg: 0, full_load_kg: 0, },
        { id: "3", zero_kg: 0, half_load_kg: 0, full_load_kg: 0, },
        { id: "4", zero_kg: 0, half_load_kg: 0, full_load_kg: 0, },
        { id: "5", zero_kg: 0, half_load_kg: 0, full_load_kg: 0, }
    ]);

    // *** Eccentricity Results Handling useState Hooks ***
    const [eccentricity, setEccentricity] = useState([
        { id: "1", std_reading_kg: 10, duc_reading_kg: 20, error_kg: 0.00, },
        { id: "2", std_reading_kg: 10, duc_reading_kg: 20, error_kg: 0.00, },
        { id: "3", std_reading_kg: 10, duc_reading_kg: 20, error_kg: 0.00, },
        { id: "4", std_reading_kg: 10, duc_reading_kg: 20, error_kg: 0.00, },
        { id: "5", std_reading_kg: 10, duc_reading_kg: 20, error_kg: 0.00, }
    ]);

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
                return {
                    ...eachRow,
                    external: parseInt(external),
                    error_1: parseInt(external) - parseInt(std_reading)
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
                    internal: parseInt(internal),
                    error_2: parseInt(internal) - parseInt(std_reading)
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Repeatability Zero-Kg Handler
    const handleZeroCalculation = (id, zero) => {
        setRepeatability(repeatability.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    zero_kg: zero
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Repeatability Half-Load-Kg Handler
    const handleHalfLoadCalculation = (id, half_load_kg) => {
        setRepeatability(repeatability.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    half_load_kg: half_load_kg
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Repeatability Full-Load-Kg Handler
    const handleFullLoadCalculation = (id, full_load_kg) => {
        setRepeatability(repeatability.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    full_load_kg: full_load_kg
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Eccentricity STD-Reading-Kg Handler
    const handleStdReadingCalculation = (id, std_reading_kg) => {
        setEccentricity(eccentricity.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    std_reading_kg: std_reading_kg
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Eccentricity DUC-Reading-Kg Handler
    const handleDucReadingCalculation = (id, duc_reading_kg) => {
        setEccentricity(eccentricity.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    duc_reading_kg: duc_reading_kg
                }
            } else {
                return eachRow;
            }
        }));
    }

    // TODO: Eccentricity DUC-Error-Kg Handler
    const handleErrorErrorKgCalculation = (id, error_kg) => {
        setEccentricity(eccentricity.map(eachRow => {
            if (eachRow.id == id) {
                return {
                    ...eachRow,
                    error_kg: error_kg
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
                approved_by: approvedBy,

                repeatability: repeatability,
                eccentricity: eccentricity
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            await fetch(config.Calibmaster.URL + "/api/calibrations-certificate/weighing-balance-certificate", requestOptions)
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
                title="Generate Weigh Device Certificate"
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

                <div className="srf__item__details__container" style={{ justifyContent: "center" }}>

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
                            </tr>
                        </thead>
                        <tbody>
                            {
                                calibration?.map((item) => {
                                    return <tr key={item?.id}>
                                        <td>{item?.std_reading}</td>
                                        <td>
                                            <input type="number" onChange={(e) => {
                                                if (e.target.value) {
                                                    handleError1Calculation(item?.id, e.target.value, item?.std_reading)
                                                }
                                            }} />
                                        </td>
                                        <td>{item?.error_1}</td>
                                        <td>
                                            <input type="number" onChange={(e) => {
                                                if (e.target.value) {
                                                    handleError2Calculation(item?.id, e.target.value, item?.std_reading)
                                                }
                                            }} />
                                        </td>
                                        <td>{item?.error_2 === 1 ? "-" : item?.error_2}</td>
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
                                placeholder="UNCERTAINTY ± µm"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
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

                {/* Repeatability RESULT */}
                <Card style={{ paddingTop: "1rem", marginBottom: "1rem", paddingBottom: "1rem" }}>
                    <h4 style={{ textAlign: "center" }}>
                        Repeatability RESULT
                    </h4>

                    <table className="table" style={{ width: "100%", textAlign: "center" }}>
                        <thead>
                            <tr>
                                <th>ZERO/Kg</th>
                                <th>HALF LOAD/Kg</th>
                                <th>Full LOAD/Kg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                repeatability.map((item) => {
                                    return <tr key={item.id}>
                                        <td>
                                            <input type="number" step={0.001} onChange={(e) => {
                                                handleZeroCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                        <td>
                                            <input type="number" step={0.001} onChange={(e) => {
                                                handleHalfLoadCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                        <td>
                                            <input type="number" step={0.001} onChange={(e) => {
                                                handleFullLoadCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </Card>

                {/* Eccentricity RESULT */}
                <Card style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
                    <h4 style={{ textAlign: "center" }}>
                        Eccentricity RESULT
                    </h4>

                    <table className="table" style={{ width: "100%", textAlign: "center" }}>
                        <thead>
                            <tr>
                                <th>STD. READING</th>
                                <th>DUC. READING</th>
                                <th>ERROR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                eccentricity.map((item) => {
                                    return <tr key={item.id}>
                                        <td>
                                            <input type="number" onChange={(e) => {
                                                handleStdReadingCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                        <td>
                                            <input type="number" onChange={(e) => {
                                                handleDucReadingCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                        <td>
                                            <input type="number" onChange={(e) => {
                                                handleErrorErrorKgCalculation(item.id, e.target.value)
                                            }} />
                                        </td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </Card>
            </Modal>
        </>
    )
}

export default CertificateGenerate;
