import React, { useContext, useEffect, useState } from 'react';
import { Card, Input, Select, DatePicker, Button, Spinner, Textarea, FileSelector, CheckboxGroup, MultiSelect } from 'react-rainbow-components';
import { notificationActions } from "../../../store/nofitication";
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.json";
import { AuthContext } from '../../../context/auth-context';
import { useNavigate } from "react-router-dom";
import { getBase64, populateDisciplineData, populateGroupData } from './HelperFunction';
import "./StandardDetails.css";
import { formattedDate } from '../../helpers/Helper';
import Loader from '../../UI/Loader'
import { Option } from 'react-rainbow-components';
import showErrorDialog from '../../../utils/showErrorToast';
import EquipmentForm from '../Forms/EquipmentForm';
import { message, notification } from 'antd';

const StandardDetails = () => {

    const [Discipline, setDiscipline] = useState([]);
    const [Group, setGroup] = useState([]);

    const [disciplineValue, setDisciplineValue] = useState("");
    const [groupValue, setGroupValue] = useState("");
    const [enableGroup, setenableGroup] = useState(true);

    const [standardMaintained, setStandardMaintained] = useState("");
    const [nameOfEquipment, setNameOfEquipment] = useState("");
    const [uid, setUid] = useState("");
    const [typeOfFacility, setTypeOfFacility] = useState("");
    const [make, setMake] = useState("");
    const [modelType, setModelType] = useState("");
    const [yearOfMake, setYearOfMake] = useState("");
    const [serialNo, setSerialNo] = useState("");
    const [assetNumber, setAssetNumber] = useState("");
    const [receiptDate, setReceiptDate] = useState("");
    const [datePlacedInService, setDatePlacedInService] = useState("");
    const [range, setRange] = useState("");
    const [leastCount, setLeastCount] = useState("");
    const [leastProductTolerance, setLeastProductTolerance] = useState("");
    const [accuracy, setAccuracy] = useState("");
    const [historyCardNumber, setHistoryCardNumber] = useState("");
    const [department, setDepartment] = useState("");
    const [dateOfLastCalibrationDate, setDateOfLastCalibrationDate] = useState("");
    const [calibrationCertificateNo, setCalibrationCertificateNo] = useState("");
    const [calibrationFrequency, setCalibrationFrequency] = useState("");
    const [calibrationValidUpto, setCalibrationValidUpto] = useState("");
    const [calibrationAgency, setCalibrationAgency] = useState("");
    const [calibratedBy, setCalibratedBy] = useState("");
    const [equipmentStatus, setEquipmentStatus] = useState([
        { value: '--', label: 'Select' },
        { value: 'Calibrated', label: 'Calibrated' },
        { value: 'Expired', label: 'Expired' },
        { value: 'Sent for Calibration', label: 'Sent for Calibration' },
        { value: 'Under Repair', label: 'Under Repair' },
        { value: 'Retired', label: 'Retired' }
    ]);
    const [equipmentStatusValue, setEquipmentStatusValue] = useState("");
    const [traceablity, setTraceablity] = useState("");
    const [nextCalibrationRemainder, setNextCalibrationRemainder] = useState("1 Reminder 7 days before");
    const [remark, setRemark] = useState("");
    const [masterCalibration, setMasterCalibration] = useState("");

    const [masterCalibrationErr, setMasterCalibrationErr] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const [electroParameters, setelectroParameters] = useState([])

    const [selectedDiscipline, setselectedDiscipline] = useState("")

    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const fetchData = async () => {
        try {

            setLoading(true);
            const disciplineResponse = await fetch(config.Calibmaster.URL + "/api/instrument-discipline/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            }).then((res) => res.json());
            let getDisciplineData = await populateDisciplineData(disciplineResponse.data);
            setDiscipline(getDisciplineData);

            setLoading(false);
        } catch (error) {
            notification.error({
                message: "Something went wrong",
                description: "",
            });
            setLoading(false);
        }
    }


    const fetchMakeandModel = async (type) => {
        try {
            const res = await fetch(config.Calibmaster.URL + `/api/makemodel/${type}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            const data = await res.json();
            if (type === 'make') setMakes(data);
            else setModels(data);
        } catch (err) {

            console.log(err);

            message.error(`Failed to load ${type}s`);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMakeandModel('make')
        fetchMakeandModel('model')
    }, []);

    // TODO: Handles file uploads
    const handleFileChange = async (info) => {
        const file = info?.fileList?.[0]?.originFileObj;
        if (!file) return;

        //const file = files[0];
        if (file) {
            const validTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/pdf'
            ];
            if (!validTypes.includes(file.type)) {
                setMasterCalibrationErr('Please select a JPEG, PNG, or PDF file.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setMasterCalibrationErr('File size must be less than 2MB.');
            } else {
                try {
                    const base64 = await getBase64(file);
                    setMasterCalibration(base64);
                    setMasterCalibrationErr('');
                } catch (error) {
                    setMasterCalibrationErr('Error While converting file.');
                };
            }
        };
    }
    const disciplineHandler = async (id) => {
        try {
            if (id != "") {
                setLoading(true);
                setDisciplineValue(id);

                const groupResponse = await fetch(config.Calibmaster.URL + `/api/instrument-groups/fetch/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                }).then((res) => res.json());
                let getGroupData = await populateGroupData(groupResponse.data)

                console.log(getGroupData.length);

                setGroup(getGroupData);
                setenableGroup(false);
                setLoading(false);
            } else {
                setenableGroup(true);
                setLoading(false);
                return;
            }
        } catch (error) {
            notification.error({
                message: "Error While Getting Instrument Group!!!",
                description: "",
            });
            setError("Error While Getting Instrument Group!!!");
            setLoading(false);
        }
    }




    const addMasterListHandler = async (values) => {
        setLoading(true);
        try {
            const validationChecks = [
                { value: values.discipline?.value, message: "Select a Discipline" },
                { value: values.group, message: "Select a Group" },
                { value: values.nameOfEquipment, message: "Name of equipment is required" },
                { value: values.make, message: "Make is required" },
                { value: values.modelType, message: "Model type is required" },
                { value: values.yearOfMake, message: "Year Of Make is required" },
                { value: values.serialNo, message: "Serial No is required" },
                { value: values.receiptDate, message: "Receipt Date is required" },
                { value: values.datePlacedInService, message: "Date Placed In Service is required" },
                { value: values.historyCardNumber, message: "History Card Number is required" },
                { value: values.dateOfLastCalibrationDate, message: "Date Of Last Calibration Date is required" },
                { value: values.calibrationCertificateNo, message: "Calibration Certificate No is required" },
                { value: values.calibrationValidUpto, message: "Calibration Valid upto is required" },
                { value: values.calibrationAgency, message: "Calibration Agency is required" },
                { value: values.equipmentStatus, message: "Equipment Status is required" },
                { value: values.nextCalibrationRemainder, message: "Next Calibration Reminder is required" },
                { value: masterCalibration, message: "Master Calibration is required" },
            ];

            for (let check of validationChecks) {
                if (!check.value || (typeof check.value === "string" && !check.value.trim())) {
                    await showErrorDialog("Warning", check.message, "warning");
                    return;
                }
            }

            if (values.discipline?.label === "ELECTRO TECHNICAL" && (!values.electroParameters || values.electroParameters.length === 0)) {
                await showErrorDialog("Warning", "Please Select One Electro Technical Parameter", "warning");
                return;
            }

            const requestBody = {
                lab_id: auth.labId,
                instrument_discipline_id: values.discipline.value,
                instrument_group_id: values.group,
                standard_maintained: values.standardMaintained,
                name_of_equipment: values.nameOfEquipment,
                uid: values.uid,
                type_of_facility: values.typeOfFacility,
                make: values.make,
                model_type: values.modelType,
                year_Of_make: values.yearOfMake,
                serial_no: values.serialNo,
                asset_number: values.assetNumber,
                receipt_date: values.receiptDate,
                date_placed_in_service: values.datePlacedInService,
                range: values.range,
                least_Count: values.leastCount,
                least_product_tolerance: values.leastProductTolerance,
                accuracy: values.accuracy,
                uncertainty: values.uncertainty,
                history_card_number: values.historyCardNumber,
                department: values.department,
                date_of_last_calibration_date: values.dateOfLastCalibrationDate,
                calibration_certificate_no: values.calibrationCertificateNo,
                calibration_frequency: values.calibrationFrequency,
                calibration_valid_upto: values.calibrationValidUpto,
                calibration_agency: values.calibrationAgency,
                calibrated_by: values.calibratedBy,
                equipment_status: values.equipmentStatus,
                traceability: values.traceablity,
                next_calibration_reminder: values.nextCalibrationRemainder,
                remark: values.remark,
                master_calibration: masterCalibration,
                electro_parameter: values.electroParameters || [],
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/create", requestOptions);
            const data = await response.json();

            if (data?.code === 201) {
                message.success(data?.msg || "Master equipment added successfully!");
                navigate("/dashboard/masters");
            } else {
                message.error(data?.message || "Something went wrong while adding master equipment.");
                setError(data?.message);
            }
        } catch (error) {
            console.error(error);
            message.error("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    return (

        <EquipmentForm
            mode='create'
            onSubmit={addMasterListHandler}
            Discipline={Discipline}
            Group={Group}
            disciplineHandler={disciplineHandler}
            equipmentStatus={equipmentStatus}
            handleFileChange={handleFileChange}
            makes={makes}
            models={models}
            isLoading={loading}
        />
    )
}

export default StandardDetails;