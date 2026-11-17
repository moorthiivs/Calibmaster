import React, { useState, useEffect, useContext, useRef } from 'react';
//import { Modal } from 'react-rainbow-components';
import { AuthContext } from '../../../../context/auth-context';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../../utils/config.json";
import AddMasterEquipments from './MasterEquipments/AddMasterEquipments';
import ListMasterEquipments from './MasterEquipments/ListMasterEquipments';
import { addProcedures } from '../../../../store/procedureSlice';
import { parseFormula } from '../../../helpers/formula_parser';
import { evaluate, log } from 'mathjs';
import CalculateLoader from '../../../UI/CalculateLoader';
import Loader from '../../../UI/Loader';
import 'handsontable/dist/handsontable.full.min.css'
import { BottomWrapper, ButtonStyled, DataAddedNotification, NotificationText } from './EditDefined'
import ExcelTable from '../../CalibmasterExcel/ExcelTable/ExcelTable';
import { Input, Select, Button, Form, Row, Col, Modal, Alert, Result, Avatar, Badge, Card } from 'antd';
import { CheckCircleOutlined, DeleteFilled, PlusCircleFilled, UserOutlined } from '@ant-design/icons';
import GlobalNotification from '../../../../utils/GlobalNotification';

//import {  Input, Select,Button } from 'react-rainbow-components';
const { confirm } = Modal;

const EditDefinedProdedureModal = ({ isOpen, onRequestClose, masterId, srf_id, srf_item_id, setSetTitle, parentModalClose, sheetData }) => {

    const [showExcelData, setshowExcelData] = useState({})

    const [ExceljsonData, SetExceljsonData] = useState({})

    const [PrintonCertificate, SetPrintonCertificate] = useState({})

    const [ObservationCertificate, setObservationCertificate] = useState({})

    const [isediting, setisediting] = useState(false)

    const [isFileEdit, setisFileEdit] = useState(false)

    const [hiddenSheetName, sethiddenSheetName] = useState([])


    // *** Access Virtual DOM ***
    const divOneRef = useRef(null);
    const divTwoRef = useRef(null);
    const [divOneWidth, setDivOneWidth] = useState(0);

    let isTable = [];
    // for eval
    const functionReplacements = {
        'sqrt': 'Math.sqrt',
        // 'round': 'Math.round',
        'pow': 'Math.pow',
        'abs': 'Math.abs'
    };

    useEffect(() => {
        if (divOneRef.current && divTwoRef.current) {
            const width = divOneRef.current.offsetWidth;
            setDivOneWidth(width);
            divTwoRef.current.style.width = `${width}px`;
        }
    }, [divOneWidth]);

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const selector = useSelector((state) => state?.procedures);

    // *** State for store values ***
    const [masterDPId, setMasterDPId] = useState("");
    const [calibrationProcedure, setCalibrationProcedure] = useState("");
    const [refStd, setRefStd] = useState("");

    const [validity, setValidity] = useState("");
    const [traceability, setTraceability] = useState("");
    const [temperature, setTemperature] = useState("");
    const [humidity, setHumidity] = useState("");
    const [atmosphericPressure, setAtmosphericPressure] = useState("");

    const [ulrNumber, setUlrNumber] = useState("");
    const [instrumentList, setInstrumentList] = useState([]);
    const [instrumentValue, setInstrumentValue] = useState("");
    const [description, setdescription] = useState("");
    const [inwardNumber, setinwardNumber] = useState("");
    const [labType, setlabType] = useState("");
    // *** State for handle errors ***
    const [calibrationProcedureErr, setCalibrationProcedureErr] = useState("");
    const [refStdErr, setRefStdErr] = useState("");

    const [validityErr, setValidityErr] = useState("");
    const [traceabilityErr, setTraceabilityErr] = useState("");
    const [temperatureErr, setTemperatureErr] = useState("");
    const [humidityErr, setHumidityErr] = useState("");
    const [atmosphericPressureErr, setAtmosphericPressureErr] = useState("");
    const [instrumentValueErr, setInstrumentValueErr] = useState("");

    // *** State for remarks ***
    const [remarks, setRemarks] = useState([]);

    // *** State for Master Equipments ***
    const [masterList, setMasterList] = useState([]);
    const [addEquipmets, setAddEquipmets] = useState([]);
    const [masterListError, setMasterListError] = useState("");

    // *** State for Employee List ***
    const [empList, setEmpList] = useState([]);
    const [calibratedByValue, setCalibratedByValue] = useState("");
    const [calibratedByValueErr, setCalibratedByValueErr] = useState("");
    const [approvedByValue, setApprovedByValue] = useState("");
    const [approvedByValueErr, setApprovedByValueErr] = useState("");
    const [authorizedByValue, setauthorizedByValue] = useState("");
    const [authorizedByValueErr, setauthorizedByValueErr] = useState("");

    // *** State For Manage DynamicTable Component ***
    const [mainArray, setMainArray] = useState([]);


    const [isCalculated, setCalculated] = useState(false);

    // *** State For Manage Uncertainty Parameters ***
    const [uncertaintyMasterParameters, setUncertaintyMasterParameters] = useState([]);

    //*** Loading  ***/
    const [loading, setloading] = useState(false);
    const [calculationloading, setcalculationloading] = useState(false);

    //*** if Already Exist  ***/
    const [ifExist, setIfExist] = useState(true);

    const [allMasterData, setallMasterData] = useState([])

    const [alldocformat, setalldocformat] = useState([])

    const [selectedFormatdoc, setselectedFormatdoc] = useState(null)

    const [diciplineParameters, setdiciplineParameters] = useState({
        isAtmosphericPressure: false,
        isFrequency: false,
        AtmosphericPressure: null,
        Frequency: null
    })

    const defaultWitnessbyData = [
        { name: "", designation: "", label: "Witnessed By 1" },
        { name: "", designation: "", label: "Witnessed By 2" }
    ];


    const [WitnessbyData, setWitnessbyData] = useState(defaultWitnessbyData);

    // *** Fetch InstrumentType ***
    const fetchinstrumentType = async () => {
        setloading(true);
        try {
            const getResponse = await fetch(config.Calibmaster.URL + "/api/instrument-types/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            });

            let response = await getResponse.json();
            const { data } = response

            setallMasterData(data)

            let newArray = [{ value: '', label: 'Select' }];

            await data.map((item, index) => {
                newArray[index + 1] = {
                    value: item.instrument_type_id,
                    label: item.type ? `${item.instrument_full_name} Type-${item.type}` : item.instrument_full_name,
                }
            });
            setInstrumentList(newArray);

            GlobalNotification.success({
                title: "Instrument Type List fetched Successfully",
            });

            return data
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        }
        setloading(false);
    }

    // *** Fetch DefinedProcedures ***
    const fetchDefinedProcedures = async (masterinstrumentData) => {

        try {

            setloading(true);

            const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    master_design_procedure_id: masterId,
                    lab_id: auth.labId,
                    srf_id,
                    srf_item_id
                })
            });

            let response = await data.json();

            const { masterTable, tableDesign, uncertainty_master_parameter_query, ifExistResultMasterTable, excelTable, itemdata } = response;

            if (masterTable?.witnessed_by && Array.isArray(masterTable.witnessed_by)) {
                setWitnessbyData(masterTable.witnessed_by);
            }
            else {
                setWitnessbyData(defaultWitnessbyData);
            }

            setselectedFormatdoc(masterTable?.document_format)

            sethiddenSheetName(excelTable?.HiddenSheets || [])

            const orginalexcelData = {
                sheets: excelTable?.ExcelData?.sheets,
                merges: excelTable?.ExcelData?.merges ? excelTable.ExcelData.merges : {},
                styles: excelTable?.ExcelData?.styles ? excelTable.ExcelData.styles : {},
                decimalPrecision: excelTable?.ExcelData?.decimalPrecision ? excelTable.ExcelData.decimalPrecision : {},
                permissions: excelTable?.ExcelData?.permissions ? excelTable.ExcelData.permissions : {},
                FileName: excelTable?.FileName || null,
                cmeid: excelTable?.cmeid || null,
                master_design_procedure_id: excelTable?.master_design_procedure_id || null
            }

            const srfexcelData = {
                sheets: excelTable?.ExcelData,
                merges: excelTable?.Mergedcell ? excelTable.Mergedcell : {},
                styles: excelTable?.Styles ? excelTable.Styles : {},
                decimalPrecision: excelTable?.decimalPrecision ? excelTable.decimalPrecision : {},
                permissions: excelTable?.permissions ? excelTable.permissions : {},
                FileName: excelTable?.FileName || null,
                cmeid: excelTable?.cmeid || null,
                master_design_procedure_id: excelTable?.master_design_procedure_id || null
            }


            if (ifExistResultMasterTable) {

                setshowExcelData(srfexcelData)
            }
            else if (!ifExistResultMasterTable && orginalexcelData.sheets !== undefined) {
                setshowExcelData(orginalexcelData)
            } else if (!ifExistResultMasterTable && orginalexcelData.sheets === undefined) {
                setshowExcelData(srfexcelData)
            } else {
                setshowExcelData({})
            }
            //setshowExcelData((orginalexcelData.sheets && Object.keys(orginalexcelData.sheets).length > 0) ? orginalexcelData : srfexcelData);
            //setshowExcelData(ifExistResultMasterTable && orginalexcelData.sheets ? srfexcelData : orginalexcelData)

            setisediting(true)

            const printoncertificate = excelTable?.print_on_certificate;
            const observationcertificate = excelTable?.print_on_observation
            const isValidObject = printoncertificate && typeof printoncertificate === 'object' && !Array.isArray(printoncertificate);

            SetPrintonCertificate(isValidObject ? printoncertificate : {});

            setObservationCertificate(isValidObject ? observationcertificate : {})

            setMasterDPId(masterTable.master_design_procedure_id)
            setCalibrationProcedure(masterTable.calibration_procedure);
            setRefStd(masterTable.ref_std);

            setValidity(masterTable.validity);
            setTraceability(masterTable.traceability);
            setUlrNumber(masterTable?.ulr_number || itemdata.url_number);
            setinwardNumber(itemdata?.inward_no || "")
            setlabType(itemdata?.labtype || "")
            //setTemperature(masterTable.temperature);
            //setHumidity(masterTable.humidity);
            if (masterTable.temperature && typeof masterTable.temperature === 'object') {
                setTemperature({
                    start: masterTable.temperature.start || '',
                    middle: masterTable.temperature.middle || '',
                    end: masterTable.temperature.end || '',
                    mean: masterTable.temperature.mean || ''
                });
            }
            if (masterTable.humidity && typeof masterTable.humidity === 'object') {
                setHumidity({
                    start: masterTable.humidity.start || '',
                    middle: masterTable.humidity.middle || '',
                    end: masterTable.humidity.end || '',
                    mean: masterTable.humidity.mean || ''
                });
            }

            setAtmosphericPressure(masterTable.atmospheric_pressure);
            setInstrumentValue(masterTable.instrument_type_id);
            setdescription(masterTable.description)

            const isAtmosphericPressure = masterinstrumentData.some((values, index) => values.instrument_type_id === Number(masterTable.instrument_type_id) && values.ins_dis_name === "MECHANICAL")
            const isFrequency = masterinstrumentData.some((values, index) => values.instrument_type_id === Number(masterTable.instrument_type_id) && values.ins_dis_name === "ELECTRO TECHNICAL")


            if (isAtmosphericPressure) {
                setdiciplineParameters((prev) => ({ ...prev, isAtmosphericPressure: true, AtmosphericPressure: masterTable?.atmospheric_pressure || '' }))
            }

            if (isFrequency) {
                setdiciplineParameters((prev) => ({ ...prev, isFrequency: true, Frequency: masterTable?.frequency || '' }))
            }


            setAddEquipmets(masterTable.master_list_equipments)
            setRemarks(masterTable.remarks)

            setCalibratedByValue(ifExistResultMasterTable ? (masterTable.calibrated_user_id || masterTable.calibrated_employee_id) : (itemdata.assignedTo || ""));
            setApprovedByValue(masterTable.approved_user_id || masterTable.approved_employee_id);
            setauthorizedByValue(masterTable.authorizedby_user_id || masterTable.authorizedby_employee_id)

            setIfExist(ifExistResultMasterTable);
            setSetTitle(ifExistResultMasterTable);

            setUncertaintyMasterParameters(uncertainty_master_parameter_query);

            setloading(false);


            GlobalNotification.success({
                title: "Defined Procedure Info fetched Successfully",
            });
            return;
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
            setloading(false);
        }
    }


    // *** Fetch MasterLists ***
    const fetchMasterLists = async () => {
        try {

            setloading(true);

            const data = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            });

            let response = await data.json();
            // console.log(response);

            if (response?.code == 200) {
                setMasterList(response?.data);

                setloading(false);
                GlobalNotification.success({
                    title: response?.message,
                });
                return;
            } else {
                setloading(false);
                GlobalNotification.error({
                    title: "Failed to fetch master list",
                });
                return;
            }
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        }
    }

    // *** Fetch Employees ***
    const fetchEmployees = async () => {
        try {
            setloading(true);

            const data = await fetch(config.Calibmaster.URL + "/api/users/get-calibration-engineers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId })
            });

            let response = await data.json();
            let newArray = [{ value: '', label: 'Select' }];

            if (response.data) {
                await response.data.map((item, index) => {
                    newArray[index + 1] = {
                        value: item.id,
                        label: `${item.name} (${item.department})`,
                        role: item.department
                    }
                });
            }
            setEmpList(newArray);

            setloading(false);

            GlobalNotification.success({
                title: response.message,
            });
            return;
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
            setloading(false);
        }
    }


    const fetchDocs = async () => {
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-format/fetchAll?labid=${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();
            setalldocformat(data);
        } catch (error) {
            console.error('Error fetching docs:', error.message);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            const instrumentData = await fetchinstrumentType();
            await fetchMasterLists();
            await fetchDefinedProcedures(instrumentData);
            //addProcedureIntoStore();
            fetchEmployees();
            fetchDocs()
        };


        fetchAllData()
    }, []);

    // Add Remarks
    const addRemarksHandler = () => {
        const newRemarks = [...remarks, []];
        setRemarks(newRemarks);
    }

    // Add Remarks Value
    const remarkChangeHandler = (value, i) => {
        const inputData = [...remarks];
        inputData[i] = value.target.value;
        setRemarks(inputData);
    }

    // Delete Remarks
    const deleteRemarkHandler = (i) => {
        const deleteValue = [...remarks];
        deleteValue.splice(i, 1);
        setRemarks(deleteValue);
    }
    // TODO: When Click on handleSubmit btn it will be store into 3rd table
    const handleSubmit = async () => {

        try {

            if (isFileEdit) {
                GlobalNotification.warning({
                    title: "Action Required",
                    description: "Please Save Excel Data, Then Press Save Data"
                });
                return;
            }

            if (Object.keys(ExceljsonData).length === 0 && !isediting) {

                GlobalNotification.warning({
                    title: "Action Required",
                    description: "Please Modify Excel Data And Save Changes, Then Press Save Data"
                });
                return;
            }


            if (PrintonCertificate === undefined || Object.keys(PrintonCertificate).length === 0) {
                GlobalNotification.warning({
                    title: "Action Required",
                    description: "Please Select Print on Certificate, Then Press Save Data"
                });
                return;
            }


            if (calibrationProcedure == "") {
                setCalibrationProcedureErr("Please enter Calibration Procedure");
                return;
            }

            // if (refStd == "") {
            //     setRefStdErr("Please enter REF STD");
            //     return;
            // }

            if (validity == "") {
                setValidityErr("Please enter validity");
                return;
            }

            if (traceability == "") {
                setTraceabilityErr("Please enter traceability");
                return;
            }

            if (instrumentValue == "") {
                setInstrumentValueErr("Please enter a Instrument");
                return;
            }

            if (addEquipmets.length == 0) {
                setMasterListError("Please select a Master Equipment.");
                return;
            }

            if (calibratedByValue == "" || !calibratedByValue) {
                setCalibratedByValueErr("Please calibrated By Engineering");
                return;
            }

            // if (approvedByValue == "" || !approvedByValue) {
            //     setApprovedByValueErr("Please calibrated By Approved");
            //     return;
            // }

            if (!validateEnvValues()) return;
            console.log(Object.keys(ExceljsonData).length === 0 ? showExcelData.ExcelData : showExcelData, "ExceljsonData");
            ///return


            const today = new Date();

            const expiredEquipments = addEquipmets.filter(item => {
                if (!item.calibration_valid_upto) return false;
                return new Date(item.calibration_valid_upto) < today;
            });

            if (expiredEquipments.length > 0) {
                const names = expiredEquipments
                    .map(e => e.name_of_equipment)
                    .join(", ");

                Modal.warning({
                    title: "Expired Master Equipment Detected",
                    content: `The following master equipment(s) have expired calibration validity: ${names}.
Do you want to proceed anyway?`,
                    okText: "Proceed",
                    cancelText: "Cancel",
                    onOk() {
                        saveData();
                    }
                });

            } else {

                saveData();
            }

            // setloading(true);

            // const bodyData = {
            //     master_design_procedure_id: masterId,
            //     lab_id: auth.labId,
            //     instrument_type_id: instrumentValue,
            //     srf_id,
            //     srf_item_id,

            //     ulr_number: ulrNumber,

            //     calibration_procedure: calibrationProcedure,
            //     ref_std: refStd,

            //     validity: validity,
            //     traceability: traceability,

            //     temperature: temperature,
            //     humidity: humidity,
            //     //atmospheric_pressure: atmosphericPressure,

            //     atmospheric_pressure: diciplineParameters.AtmosphericPressure,
            //     frequency: diciplineParameters.Frequency,
            //     description: description,

            //     master_list_equipments: addEquipmets,
            //     remarks: remarks,

            //     calibrated_employee_id: calibratedByValue,
            //     approved_employee_id: approvedByValue,
            //     authorizedby_employee_id: authorizedByValue,

            //     userid: auth.userId,
            //     PrintonCertificate,
            //     FileName: showExcelData.FileName,
            //     cmeid: showExcelData.cmeid,
            //     //ExceljsonData,
            //     ExceljsonData: Object.keys(ExceljsonData).length === 0 ? showExcelData.ExcelData : ExceljsonData, // If ExceljsonData is empty and not editing, use showExcelData.ExcelData,
            //     ObservationCertificate,
            //     selectedFormatdoc,
            //     WitnessbyData,
            //     inwardNumber
            //     //mainArray
            // }


            // let response = await fetch(config.Calibmaster.URL + "/api/result-tables/create", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         "Authorization": "Bearer " + auth.token,
            //     },
            //     body: JSON.stringify(bodyData)
            // });

            // if (!response.ok) {
            //     let errorMessage = "Something went wrong!";
            //     try {
            //         const errorData = await response.json();
            //         if (errorData?.message) {
            //             errorMessage = errorData.message;
            //         } else if (errorData?.error) {
            //             errorMessage = errorData.error;
            //         }
            //     } catch (error) {
            //         console.log(error);
            //     }
            //     throw new Error(errorMessage);
            // }

            // const data = await response.json();


            // // ✅ Success
            // GlobalNotification.success({
            //     title: "Success",
            //     description: `${data.msg}`,
            // });

            // let countdown = 3;

            // const modal = Modal.confirm({
            //     title: "Success You Saved This Update Date",
            //     icon: <CheckCircleOutlined style={{ color: "green" }} />,
            //     content: `Defined Procedure added Successfully. Redirecting in ${countdown} seconds...`,
            //     okButtonProps: { disabled: true },
            //     cancelButtonProps: { style: { display: "none" } },
            //     maskClosable: false,
            //     closable: false,
            //     onOk() {
            //         window.close();
            //     },
            //     width: "50%"
            // });

            // const interval = setInterval(() => {
            //     countdown--;
            //     modal.update({
            //         content: `Defined Procedure Saved Successfully. Redirecting in ${countdown} seconds...`,
            //     });

            //     if (countdown <= 0) {
            //         clearInterval(interval);
            //         modal.update({
            //             okButtonProps: { disabled: false },
            //         });
            //         modal.destroy();
            //         window.close();
            //     }
            // }, 1000);

            // //parentModalClose();
            // setloading(false);



        } catch (error) {
            GlobalNotification.error({
                title: "Save Failed",
                description: error.message || "Unexpected error occurred.",
            });
            setloading(false);
        }
    }


    const saveData = async () => {
        try {
            setloading(true);

            const bodyData = {
                master_design_procedure_id: masterId,
                lab_id: auth.labId,
                instrument_type_id: instrumentValue,
                srf_id,
                srf_item_id,
                ulr_number: ulrNumber,
                calibration_procedure: calibrationProcedure,
                ref_std: refStd,
                validity,
                traceability,
                temperature,
                humidity,
                atmospheric_pressure: diciplineParameters.AtmosphericPressure,
                frequency: diciplineParameters.Frequency,
                description,
                master_list_equipments: addEquipmets,
                remarks,
                calibrated_employee_id: calibratedByValue,
                // approved_employee_id: approvedByValue,
                // authorizedby_employee_id: authorizedByValue,
                userid: auth.userId,
                PrintonCertificate,
                FileName: showExcelData.FileName,
                cmeid: showExcelData.cmeid,
                ExceljsonData:
                    Object.keys(ExceljsonData).length === 0
                        ? showExcelData.ExcelData
                        : ExceljsonData,
                ObservationCertificate,
                selectedFormatdoc,
                WitnessbyData,
                inwardNumber,
                hiddenSheetName
            };

            let response = await fetch(
                config.Calibmaster.URL + "/api/result-tables/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify(bodyData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.message || "Something went wrong!");
            }

            const data = await response.json();

            // ✅ Notify other tabs to refresh SRF data
            const channel = new BroadcastChannel("srf_update_channel");
            channel.postMessage({ type: "REFRESH_SRF_ITEMS" });
            channel.close();

            // ✅ Success Notification
            GlobalNotification.success({
                title: "Success",
                description: `${data.msg}`,
            });

            // Success Modal with countdown
            let countdown = 3;

            const modal = Modal.confirm({
                title: "Success! Data Saved Successfully",
                icon: <CheckCircleOutlined style={{ color: "green" }} />,
                content: `Defined Procedure saved successfully. Redirecting in ${countdown} seconds...`,
                okButtonProps: { disabled: true },
                cancelButtonProps: { style: { display: "none" } },
                maskClosable: false,
                closable: false,
                width: "50%",
            });

            const interval = setInterval(() => {
                countdown--;
                modal.update({
                    content: `Defined Procedure saved successfully. Redirecting in ${countdown} seconds...`,
                });

                if (countdown <= 0) {
                    clearInterval(interval);
                    modal.destroy();
                    window.close();
                }
            }, 1000);

            setloading(false);

        } catch (error) {
            GlobalNotification.error({
                title: "Save Failed",
                description: error.message || "Unexpected error occurred.",
            });
            setloading(false);
        }
    };

    const handleselect = async (v) => {
        try {

            console.log(typeof v);

            if (!v) return
            const isAtmosphericPressure = allMasterData.some((values, index) => values.instrument_type_id === Number(v) && values.ins_dis_name === "MECHANICAL")
            const isFrequency = allMasterData.some((values, index) => values.instrument_type_id === Number(v) && values.ins_dis_name === "ELECTRO TECHNICAL")

            setdiciplineParameters((prev) => ({
                ...prev,
                isAtmosphericPressure: isAtmosphericPressure,
                isFrequency: isFrequency,
                AtmosphericPressure: null,
                Frequency: null
            }))

        } catch (error) {
            console.log(error);

        }
    }

    const renderInputField = (key) => {
        switch (key) {
            case 'isAtmosphericPressure':
                return (
                    <div key={key}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Atmospheric Pressure</label>
                        <Input
                            placeholder="Atmospheric Pressure"
                            value={diciplineParameters.AtmosphericPressure}
                            onChange={(e) =>
                                setdiciplineParameters((prev) => ({
                                    ...prev,
                                    AtmosphericPressure: e.target.value
                                }))
                            }
                            size="large"
                        />
                    </div>
                );

            case 'isFrequency':
                return (
                    <div key={key}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Frequency</label>
                        <Input
                            placeholder="Frequency"
                            value={diciplineParameters.Frequency}
                            onChange={(e) =>
                                setdiciplineParameters((prev) => ({
                                    ...prev,
                                    Frequency: e.target.value
                                }))
                            }
                            size="large"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const calculateMean = (values) => {
        const nums = [values.start, values.middle, values.end]
            .filter(v => v !== '' && !isNaN(v))
            .map(Number);
        const sum = nums.reduce((a, b) => a + b, 0);
        return nums.length ? (sum / nums.length).toFixed(2) : '';
    };


    const getNameFromId = (id) => {
        const emp = empList.find(e => e.value === id);
        return {
            name: emp?.label || '',
            designation: emp?.role || ''
        };
    };



    const validateEnvValues = () => {
        const tempValues = [temperature.start, temperature.middle, temperature.end]
            .filter(Boolean)
            .map(Number);

        const humValues = [humidity.start, humidity.middle, humidity.end]
            .filter(Boolean)
            .map(Number);

        // Temp tolerance 20 ± 2 => 18 to 22
        const tempValid = tempValues.every(v => v >= 18 && v <= 22);

        // Humidity tolerance 50 ± 10 => 40 to 60
        const humValid = humValues.every(v => v >= 40 && v <= 60);

        if (!tempValid) {
            setTemperatureErr("Temperature must be within 20 ± 2°C (18 to 22)");
            GlobalNotification.error({
                title: "Invalid Temperature",
                description: "Temperature must be between 18°C and 22°C"
            });
            return false;
        }

        if (!humValid) {
            setHumidityErr("Humidity must be within 50 ± 10% (40 to 60)");
            GlobalNotification.error({
                title: "Invalid Humidity",
                description: "Humidity must be between 40% and 60%"
            });
            return false;
        }

        return true;
    };

    return (

        <div className="mt-4 px-2 sm:px-4 lg:px-2 max-w-full">

            {/* ═══════════════ Top Input Fields ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                    {/* CALIBRATION PROCEDURE */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Calibration Procedure <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Calibration Procedure"
                            value={calibrationProcedure}
                            onChange={(e) => { setCalibrationProcedure(e.target.value); setCalibrationProcedureErr(""); }}
                            size="large"
                            status={!calibrationProcedure ? "error" : ''}
                        />
                        {calibrationProcedureErr && <span className="text-red-500 text-xs mt-1">{calibrationProcedureErr}</span>}
                    </div>

                    {/* REF.STD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ref. Std</label>
                        <Input
                            placeholder="REF.STD"
                            value={refStd}
                            onChange={(e) => { setRefStd(e.target.value); setRefStdErr(""); }}
                            size="large"
                        />
                    </div>

                    {/* VALIDITY */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Validity <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Validity"
                            value={validity}
                            onChange={(e) => { setValidity(e.target.value); setValidityErr(""); }}
                            size="large"
                            status={!validity ? "error" : ''}
                        />
                        {validityErr && <span className="text-red-500 text-xs mt-1">{validityErr}</span>}
                    </div>

                    {/* TRACEABILITY */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Traceability <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Traceability"
                            value={traceability}
                            onChange={(e) => { setTraceability(e.target.value); setTraceabilityErr(""); }}
                            size="large"
                            status={!traceability ? "error" : ''}
                        />
                        {traceabilityErr && <span className="text-red-500 text-xs mt-1">{traceabilityErr}</span>}
                    </div>

                    {/* ULR NUMBER */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ULR Number</label>
                        <Input
                            placeholder="ULR Number"
                            value={ulrNumber}
                            disabled={labType !== "NABL"}
                            onChange={(e) => setUlrNumber(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* INWARD NUMBER */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Inward Number</label>
                        <Input
                            placeholder="Inward Number"
                            value={inwardNumber}
                            onChange={(e) => setinwardNumber(e.target.value)}
                            size="large"
                        />
                    </div>

                    {/* TEMPERATURE (°C) — full width */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Temperature (°C) <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Input type="number" placeholder="Start" value={temperature.start} size="large" status={!temperature.start ? "error" : ''}
                                onChange={(e) => { const u = { ...temperature, start: e.target.value }; u.mean = calculateMean(u); setTemperature(u); setTemperatureErr(''); }} />
                            <Input type="number" placeholder="Middle" value={temperature.middle} size="large"
                                onChange={(e) => { const u = { ...temperature, middle: e.target.value }; u.mean = calculateMean(u); setTemperature(u); }} />
                            <Input type="number" placeholder="End" value={temperature.end} size="large" status={!temperature.end ? "error" : ''}
                                onChange={(e) => { const u = { ...temperature, end: e.target.value }; u.mean = calculateMean(u); setTemperature(u); setTemperatureErr(''); }} />
                            <Input type="text" placeholder="Mean" value={temperature.mean} disabled size="large" />
                        </div>
                        {temperatureErr && <span className="text-red-500 text-xs mt-1">{temperatureErr}</span>}
                    </div>

                    {/* HUMIDITY (RH %) — full width */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Humidity (RH %) <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Input type="number" placeholder="Start" value={humidity.start} size="large" status={!humidity.start ? "error" : ''}
                                onChange={(e) => { const u = { ...humidity, start: e.target.value }; u.mean = calculateMean(u); setHumidity(u); setHumidityErr(''); }} />
                            <Input type="number" placeholder="Middle" value={humidity.middle} size="large"
                                onChange={(e) => { const u = { ...humidity, middle: e.target.value }; u.mean = calculateMean(u); setHumidity(u); }} />
                            <Input type="number" placeholder="End" value={humidity.end} size="large" status={!humidity.end ? "error" : ''}
                                onChange={(e) => { const u = { ...humidity, end: e.target.value }; u.mean = calculateMean(u); setHumidity(u); setHumidityErr(''); }} />
                            <Input type="text" placeholder="Mean" value={humidity.mean} disabled size="large" />
                        </div>
                        {humidityErr && <span className="text-red-500 text-xs mt-1">{humidityErr}</span>}
                    </div>

                    {/* Select Document Format — full width */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Document Format</label>
                        <Select
                            options={[
                                { label: 'Select Doc Format', value: '' },
                                ...alldocformat.map(doc => ({ label: doc.formatName, value: JSON.stringify(doc) }))
                            ]}
                            value={selectedFormatdoc ? JSON.stringify(selectedFormatdoc) : null}
                            onChange={(e) => { setselectedFormatdoc(JSON.parse(e.target.value)); setInstrumentValueErr(""); }}
                            size="large"
                            className="w-full"
                        />
                    </div>

                    {/* Select Instrument — full width */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Instrument <span className="text-red-500">*</span></label>
                        <Select
                            options={instrumentList}
                            value={instrumentValue}
                            onChange={(e) => { handleselect(e); setInstrumentValue(e); setInstrumentValueErr(""); }}
                            size="large"
                            className="w-full"
                        />
                        {instrumentValueErr && <span className="text-red-500 text-xs mt-1">{instrumentValueErr}</span>}
                    </div>

                    {/* Atmospheric Pressure / Frequency (dynamic) */}
                    {Object.keys(diciplineParameters).map((key) => {
                        if (key.startsWith('is') && diciplineParameters[key]) {
                            return renderInputField(key);
                        }
                        return null;
                    })}

                    {/* Description — full width */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                        <Input.TextArea
                            placeholder="Description"
                            value={description}
                            autoSize={{ minRows: 2, maxRows: 4 }}
                            size="large"
                            className="w-full"
                            onChange={(e) => setdescription(e.target.value)}
                        />
                    </div>

                </div>
            </div>

            {/* ═══════════════ Master Equipments ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Add Master Equipments</h3>
                <div className="w-full">
                    <AddMasterEquipments
                        masterList={masterList}
                        addEquipmets={addEquipmets}
                        setAddEquipmets={setAddEquipmets}
                    />
                </div>
                {masterListError && <span className="text-red-500 text-xs mt-1">{masterListError}</span>}
                <div className="mt-4 overflow-x-auto">
                    <ListMasterEquipments
                        addEquipmets={addEquipmets}
                        setAddEquipmets={setAddEquipmets}
                    />
                </div>
            </div>

            {/* ═══════════════ Excel Table Area ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200  w-full overflow-x-auto mb-4">
                <div className="min-w-[900px] lg:min-w-0">
                    <Card>
                        {isCalculated && (
                            <Result
                                status="success"
                                title="Data Added Successfully!"
                                subTitle="Your data has been saved and processed successfully."
                                extra={[
                                    <Button type="primary" key="ok" onClick={() => setCalculated(false)}>OK</Button>,
                                ]}
                                className="!bg-green-50 !border !border-green-200 !rounded-lg !p-6"
                            />
                        )}
                        {showExcelData.sheets && Object.keys(showExcelData)?.length > 0 ? (
                            <ExcelTable
                                file={showExcelData}
                                saveData={SetExceljsonData}
                                setCalculated={setCalculated}
                                SetPrintonCertificate={SetPrintonCertificate}
                                setObservationCertificate={setObservationCertificate}
                                ObservationCertificate={ObservationCertificate}
                                PrintonCertificate={PrintonCertificate}
                                setisFileEdit={setisFileEdit}
                                hiddenSheetName={hiddenSheetName}
                                srf_id={srf_id}
                                srf_item_id={srf_item_id}
                                addEquipmets={addEquipmets}
                            />
                        ) : null}
                    </Card>
                </div>
            </div>

            {/* ═══════════════ Add Remarks ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Add Remarks</h3>
                <Button type="primary" onClick={addRemarksHandler} className="mb-4" icon={<PlusCircleFilled />}>
                    Add Remarks
                </Button>
                <div className="flex flex-col gap-3 w-full">
                    {remarks?.map((data, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <Input
                                placeholder="Enter Remarks"
                                className="flex-1"
                                value={data}
                                onChange={(e) => remarkChangeHandler(e, i)}
                                size="large"
                            />
                            <Button variant='filled' danger onClick={() => deleteRemarkHandler(i)} icon={<DeleteFilled />} size="large"
                                className="shrink-0">
                                Delete
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════════ Witnessed By ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                    Witnessed By <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </h3>
                <Button type="primary" icon={<PlusCircleFilled />} className="mb-4"
                    onClick={() => {
                        const newIndex = WitnessbyData.length + 1;
                        setWitnessbyData([...WitnessbyData, { name: "", designation: "", label: `Witnessed By ${newIndex}` }]);
                    }}>
                    Add Witness
                </Button>
                <div className="flex flex-col gap-3 w-full">
                    {WitnessbyData?.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <Input
                                placeholder={item.label}
                                className="flex-1"
                                value={item.name}
                                onChange={(e) => {
                                    const updatedData = [...WitnessbyData];
                                    updatedData[index].name = e.target.value;
                                    setWitnessbyData(updatedData);
                                }}
                                size="large"
                            />
                            <Input
                                placeholder="Designation"
                                className="flex-1 sm:max-w-[240px]"
                                value={item.designation}
                                onChange={(e) => {
                                    const updatedData = [...WitnessbyData];
                                    updatedData[index].designation = e.target.value;
                                    setWitnessbyData(updatedData);
                                }}
                                size="large"
                            />
                            <Button variant='filled' danger size="large" icon={<DeleteFilled />} className="shrink-0"
                                onClick={() => {
                                    if (WitnessbyData.length <= 1) {
                                        return GlobalNotification.warning({
                                            title: "Action Denied",
                                            description: "At least One Witness Required"
                                        });
                                    }
                                    setWitnessbyData(WitnessbyData.filter((_, i) => i !== index));
                                }}>
                                Delete
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════════ Assigned Calibration Engineer ═══════════════ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                            <UserOutlined className="text-xl text-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned Calibration Engineer</p>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                                {empList.find(emp => emp.value === calibratedByValue)?.label || "Not Assigned"}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        Verified Assignment
                    </div>
                </div>
            </div>

            {/* ═══════════════ Save / Update Button ═══════════════ */}
            <div className="flex justify-center py-6">
                <Button onClick={handleSubmit} type='primary' size='large' className="min-w-[200px] !h-12 !text-base !font-semibold !rounded-lg">
                    {ifExist ? "Update Data" : "Save Data"}
                </Button>
            </div>

            {(loading && !calculationloading && showExcelData) && <Loader />}
            {calculationloading && <CalculateLoader />}
        </div>
    )
}

export default EditDefinedProdedureModal;