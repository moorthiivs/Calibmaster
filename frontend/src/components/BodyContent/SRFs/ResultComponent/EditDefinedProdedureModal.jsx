import React, { useState, useEffect, useContext, useRef } from 'react';
import { Card, Spinner } from 'react-rainbow-components';
//import { Modal } from 'react-rainbow-components';
import { notificationActions } from "../../../../store/nofitication";
import { AuthContext } from '../../../../context/auth-context';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../../utils/config.js";
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
import { Input, Select, Space, Button, Form, Row, Col, message, Modal, Alert, Result } from 'antd';
import { CheckCircleOutlined, DeleteFilled, PlusCircleFilled } from '@ant-design/icons';
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

            const newNotification = {
                title: "Instrument Type List fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));

            return data
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
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
                cmeid: excelTable?.cmeid || null
            }

            const srfexcelData = {
                sheets: excelTable?.ExcelData,
                merges: excelTable?.Mergedcell ? excelTable.Mergedcell : {},
                styles: excelTable?.Styles ? excelTable.Styles : {},
                decimalPrecision: excelTable?.decimalPrecision ? excelTable.decimalPrecision : {},
                permissions: excelTable?.permissions ? excelTable.permissions : {},
                FileName: excelTable?.FileName || null,
                cmeid: excelTable?.cmeid || null
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

            setCalibratedByValue(masterTable.calibrated_employee_id);
            setApprovedByValue(masterTable.approved_employee_id);
            setauthorizedByValue(masterTable.authorizedby_employee_id)

            setIfExist(ifExistResultMasterTable);
            setSetTitle(ifExistResultMasterTable);

            setUncertaintyMasterParameters(uncertainty_master_parameter_query);

            setloading(false);


            const newNotification = {
                title: "Defined Procedure Info fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };
            return dispatch(notificationActions.changenotification(newNotification));
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
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
                const newNotification = {
                    title: response?.message,
                    icon: "success",
                    state: true,
                    timeout: 1500,
                };
                return dispatch(notificationActions.changenotification(newNotification));
            } else {
                setloading(false);
                const newNotification = {
                    title: "Failed to fetch master list",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
                return dispatch(notificationActions.changenotification(newNotification));
            }
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
        }
    }

    // *** Fetch Employees ***
    const fetchEmployees = async () => {
        try {
            setloading(true);

            const data = await fetch(config.Calibmaster.URL + "/api/employee-master/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            });

            let response = await data.json();
            let newArray = [{ value: '', label: 'Select' }];

            await response.data.map((item, index) => {
                newArray[index + 1] = {
                    value: item.employee_id,
                    label: `${item.employee_full_name} (${item.employee_role})`,
                    role: item.employee_role
                }
            });
            setEmpList(newArray);

            setloading(false);

            const newNotification = {
                title: response.message,
                icon: "success",
                state: true,
                timeout: 1500,
            };
            return dispatch(notificationActions.changenotification(newNotification));
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
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
                alert("Please Save Excel Data, Then Press Save Data");
                return;
            }

            if (Object.keys(ExceljsonData).length === 0 && !isediting) {
                alert("Please Modify Excel Data And Save Changes, Then Press Save Data");
                return;
            }


            if (PrintonCertificate === undefined || Object.keys(PrintonCertificate).length === 0) {
                alert("Please Select Print on Certificate, Then Press Save Data");
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

            if (approvedByValue == "" || !approvedByValue) {
                setApprovedByValueErr("Please calibrated By Approved");
                return;
            }

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
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };


            GlobalNotification.error({
                title: "Save Failed",
                description: error.message || "Unexpected error occurred.",
            });

            //dispatch(notificationActions.changenotification(newNotification));
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
                approved_employee_id: approvedByValue,
                authorizedby_employee_id: authorizedByValue,
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
                inwardNumber
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
                    <div className="input_group" key={key}>
                        <Input
                            label="Atmospheric Pressure"
                            placeholder="Atmospheric Pressure"
                            className="eachInput"
                            required={false}
                            value={diciplineParameters.AtmosphericPressure}
                            onChange={(e) =>
                                setdiciplineParameters((prev) => ({
                                    ...prev,
                                    AtmosphericPressure: e.target.value
                                }))
                            }
                            size="large"
                            style={{ marginTop: '20px' }}
                        />
                    </div>
                );

            case 'isFrequency':
                return (
                    <div className="input_group" key={key}>
                        <Input
                            label="Frequency"
                            placeholder="Frequency"
                            className="eachInput"
                            required={false}
                            value={diciplineParameters.Frequency}
                            onChange={(e) =>
                                setdiciplineParameters((prev) => ({
                                    ...prev,
                                    Frequency: e.target.value
                                }))
                            }
                            size="large"
                            style={{ marginTop: '20px' }}
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
            message.error("❗ Temperature must be between 18°C and 22°C");
            return false;
        }

        if (!humValid) {
            setHumidityErr("Humidity must be within 50 ± 10% (40 to 60)");
            message.error("❗ Humidity must be between 40% and 60%");
            return false;
        }

        return true;
    };

    return (

        <div style={{ marginTop: '1rem' }}>

            {/* Top Input Fields */}
            <div className="card_container_1">

                {/* CALIBRATION PROCEDURE */}
                <div className="input_group">
                    <Input
                        label="CALIBRATION PROCEDURE"
                        placeholder="CALIBRATION PROCEDURE"
                        className="eachInput"
                        required={true}
                        disabled={false}
                        value={calibrationProcedure}
                        onChange={(e) => {
                            setCalibrationProcedure(e.target.value);
                            setCalibrationProcedureErr("")
                        }}
                        size="large"
                        status={!calibrationProcedure ? "error" : ''}
                    />
                    {calibrationProcedureErr && <span style={{ color: "red" }}>{calibrationProcedureErr}</span>}
                </div>

                {/* REF.STD */}
                <div className="input_group">
                    <Input
                        label="REF.STD"
                        placeholder="REF.STD"
                        className="eachInput"
                        //required={true}
                        value={refStd}
                        disabled={false}
                        onChange={(e) => {
                            setRefStd(e.target.value);
                            setRefStdErr("")
                        }}
                        size="large"
                    //status={!refStd ? "error" : ''}
                    />
                    {/* {refStdErr && <span style={{ color: "red" }}>{refStdErr}</span>} */}
                </div>

                {/* VALIDITY */}
                <div className="input_group">
                    <Input
                        label="VALIDITY"
                        placeholder="VALIDITY"
                        className="eachInput"
                        required={true}
                        value={validity}
                        disabled={false}
                        onChange={(e) => {
                            setValidity(e.target.value);
                            setValidityErr("");
                        }}
                        size="large"
                        status={!validity ? "error" : ''}
                    />
                    {validityErr && <span style={{ color: "red" }}>{validityErr}</span>}
                </div>

                {/* TRACEABILITY */}
                <div className="input_group">
                    <Input
                        label="TRACEABILITY"
                        placeholder="TRACEABILITY"
                        className="eachInput"
                        required={true}
                        value={traceability}
                        disabled={false}
                        onChange={(e) => {
                            setTraceability(e.target.value);
                            setTraceabilityErr("")
                        }}
                        size="large"
                        status={!traceability ? "error" : ''}
                    />
                    {traceabilityErr && <span style={{ color: "red" }}>{traceabilityErr}</span>}
                </div>

                {/* ULR NUMBER */}
                <div className="input_group">
                    <Input
                        label="ULR NUMBER"
                        placeholder="ULR NUMBER"
                        className="eachInput"
                        required={false}
                        value={ulrNumber}
                        disabled={labType !== "NABL"}
                        onChange={(e) => {
                            setUlrNumber(e.target.value);
                        }}
                        size="large"
                    //status={!ulrNumber ? "error" : ''}
                    />
                </div>


                {/* TEMPERATURE (°C) */}
                <div className="input_group">
                    <label >TEMPERATURE (°C)</label>
                    <div className="input_row" style={{ marginTop: '5px' }}>
                        <Input
                            type="number"
                            placeholder="Start"
                            className="smallInput"
                            value={temperature.start}
                            onChange={(e) => {
                                const updated = { ...temperature, start: e.target.value };
                                updated.mean = calculateMean(updated);
                                setTemperature(updated);
                                setTemperatureErr('')
                            }}
                            size="large"
                            required={true}
                            
                            status={!temperature.start ? "error" : ''}
                        />
                        <Input
                            type="number"
                            placeholder="Middle"
                            className="smallInput"
                            value={temperature.middle}
                            onChange={(e) => {
                                const updated = { ...temperature, middle: e.target.value };
                                updated.mean = calculateMean(updated);
                                setTemperature(updated);
                            }}
                            size="large"
                            
                        />
                        <Input
                            type="number"
                            placeholder="End"
                            className="smallInput"
                            value={temperature.end}
                            onChange={(e) => {
                                const updated = { ...temperature, end: e.target.value };
                                updated.mean = calculateMean(updated);
                                setTemperature(updated);
                                setTemperatureErr('')
                            }}
                            size="large"
                            
                            status={!temperature.end ? "error" : ''}
                        />
                        <Input
                            type="text"
                            placeholder="Mean"
                            className="smallInput"
                            value={temperature.mean}
                            disabled={true}
                            
                            size="large"
                            required={true}
                        />
                        {temperatureErr && <span style={{ color: "red" }}>{temperatureErr}</span>}
                    </div>
                </div>

                {/* HUMIDITY (RH %) */}
                <div className="input_group">
                    <label>HUMIDITY (RH %)</label>
                    <div className="input_row" style={{ marginTop: '5px' }}>
                        <Input
                            type="number"
                            placeholder="Start"
                            className="smallInput"
                            value={humidity.start}
                            onChange={(e) => {
                                const updated = { ...humidity, start: e.target.value };
                                updated.mean = calculateMean(updated);
                                setHumidity(updated);
                                setHumidityErr('')
                            }}
                            
                            size="large"
                            status={!humidity.start ? "error" : ''}
                        />
                        <Input
                            type="number"
                            placeholder="Middle"
                            className="smallInput"
                            value={humidity.middle}
                            onChange={(e) => {
                                const updated = { ...humidity, middle: e.target.value };
                                updated.mean = calculateMean(updated);
                                setHumidity(updated);
                            }}
                            
                            size="large"
                        />
                        <Input
                            type="number"
                            placeholder="End"
                            className="smallInput"
                            value={humidity.end}
                            onChange={(e) => {
                                const updated = { ...humidity, end: e.target.value };
                                updated.mean = calculateMean(updated);
                                setHumidity(updated);
                                setHumidityErr('')
                            }}
                            
                            size="large"
                            status={!humidity.end ? "error" : ''}
                        />
                        <Input
                            type="text"
                            placeholder="Mean"
                            className="smallInput"
                            value={humidity.mean}
                            disabled={true}
                            
                            size="large"

                        />
                        {humidityErr && <span style={{ color: "red" }}>{humidityErr}</span>}
                    </div>
                </div>


                {/* Select Document Format */}
                <div className="input_group">
                    <Select
                        label="Select Document Format"
                        options={[
                            { label: 'Select Doc Format', value: '' },
                            ...alldocformat.map(doc => ({
                                label: doc.formatName,
                                value: JSON.stringify(doc)
                            }))
                        ]}
                        value={selectedFormatdoc ? JSON.stringify(selectedFormatdoc) : null}
                        required={true}
                        className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                        onChange={(e) => {
                            const selectedDoc = JSON.parse(e.target.value);
                            setselectedFormatdoc(selectedDoc);
                            setInstrumentValueErr("");
                        }}
                        size="large"
                        style={{ width: "auto", minWidth: 600, marginTop: '20px' }}

                    />
                </div>


                {/* Select Instrument */}
                <div className="input_groups">
                    <Select
                        label="Select Instrument"
                        options={instrumentList}
                        required={true}
                        value={instrumentValue}
                        disabled={false}
                        onChange={(e) => {
                            handleselect(e)
                            setInstrumentValue(e);
                            setInstrumentValueErr("");
                        }}
                        style={{ width: "auto", minWidth: 600 }}
                        size="large"
                    />
                    {instrumentValueErr && <span style={{ color: "red" }}>{instrumentValueErr}</span>}
                </div>

                {/* Atmospheric Pressure */}
                {Object.keys(diciplineParameters).map((key) => {
                    if (key.startsWith('is') && diciplineParameters[key]) {
                        return renderInputField(key);
                    }
                    return null;
                })}

                {/* Inward NUMBER */}
                <div className="input_group">
                    <Input
                        label="INWARD NUMBER"
                        placeholder="INWARD NUMBER"
                        className="eachInput"
                        required={false}
                        value={inwardNumber}
                        disabled={false}
                        onChange={(e) => {
                            setinwardNumber(e.target.value);
                        }}
                        size="large"
                    //status={!ulrNumber ? "error" : ''}
                    />
                </div>

                {/* Select Description */}
                <div className="input_groups">
                    <Input.TextArea
                        placeholder="Description"
                        value={description}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ width: "auto", minWidth: 620 }}
                        size="large"
                        onChange={(e) => {
                            setdescription(e.target.value);
                        }}
                    />
                </div>


            </div>

            {/* Add Master Equipments */}
            <Card className="card_container_1">

                <h3 className='title'>Add Master Equipments</h3>

                {/* CALIBRATION PROCEDURE */}
                <div className="input_group">
                    <AddMasterEquipments
                        masterList={masterList}
                        addEquipmets={addEquipmets}
                        setAddEquipmets={setAddEquipmets}
                    />
                </div>
                {masterListError && <span style={{ color: 'red' }}>{masterListError}</span>}

                <ListMasterEquipments
                    addEquipmets={addEquipmets}
                    setAddEquipmets={setAddEquipmets}
                />
            </Card>

            {/* Table Area  */}
            <div className="mondal_container_parent" style={{ minWidth: 1400, maxWidth: "100%", marginBottom: '10px' }}>

                <Card >
                    {isCalculated && (
                        <>

                            <Result
                                status="success"
                                title="Data Added Successfully!"
                                subTitle="Your data has been saved and processed successfully."
                                extra={[
                                    <Button type="primary" key="ok" onClick={() => setCalculated(false)}>
                                        OK
                                    </Button>,
                                ]}
                                style={{
                                    background: "#f6ffed",
                                    border: "1px solid #b7eb8f",
                                    borderRadius: 8,
                                    padding: "24px",
                                }}
                            />
                        </>


                    )}
                    {
                        showExcelData.sheets && Object.keys(showExcelData)?.length > 0 ? (
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
                        ) : (
                            <>
                                {/* <Loader /> */}
                            </>
                        )
                    }
                </Card>
            </div>



            <Card className="card_container_1" >


                <h3 className='title my-3'>Add Remarks</h3>
                <Button
                    type="primary"
                    onClick={addRemarksHandler}
                    style={{ marginBottom: 16 }}
                    icon={<PlusCircleFilled />}
                >

                    Add Remarks
                </Button>

                <section className="remarks_section">
                    {remarks?.map((data, i) => (
                        <Space
                            key={i}
                            style={{ display: "flex", marginBottom: 10 }}
                            align="start"
                        >
                            <Input
                                placeholder="Enter Remarks"
                                style={{ width: "30rem" }}
                                value={data}
                                onChange={(e) => remarkChangeHandler(e, i)}
                                size="large"
                            />
                            <Button
                                variant='filled'
                                danger
                                onClick={() => deleteRemarkHandler(i)}
                                icon={<DeleteFilled />}
                                size="large"
                            >
                                Delete
                            </Button>
                        </Space>
                    ))}
                </section>
            </Card>





            <Card className="card_container_1">
                <h3 className='title my-3'>Witnessed by:-    <span style={{ color: 'gray' }}>(Optional)</span></h3>
                <Button
                    type="primary"
                    onClick={() => {
                        const newIndex = WitnessbyData.length + 1;
                        setWitnessbyData([
                            ...WitnessbyData,
                            { name: "", designation: "", label: `Witnessed By ${newIndex}` }
                        ]);
                    }}
                    style={{ marginBottom: 16 }}
                    icon={<PlusCircleFilled />}
                >
                    Add Witness by
                </Button>
                <section className='remarks_section'>
                    {
                        WitnessbyData?.map((item, index) => {
                            return (
                                <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                    <Input
                                        placeholder={item.label}
                                        style={{ width: "30rem" }}
                                        value={item.name}
                                        onChange={(e) => {
                                            const updatedData = [...WitnessbyData];
                                            updatedData[index].name = e.target.value;
                                            setWitnessbyData(updatedData);
                                            console.log(WitnessbyData, "WitnessbyData");
                                        }}
                                        size="large"
                                    />

                                    <Input
                                        placeholder="Designation"
                                        style={{ width: "15rem" }}
                                        value={item.designation}
                                        onChange={(e) => {
                                            const updatedData = [...WitnessbyData];
                                            updatedData[index].designation = e.target.value;
                                            setWitnessbyData(updatedData);
                                            console.log(WitnessbyData, "WitnessbyData");
                                        }}
                                        size="large"
                                    />
                                    <Button
                                        variant='filled'
                                        danger
                                        onClick={() => {
                                            const validate = WitnessbyData.length <= 1
                                            if (validate) {
                                                return alert('Atleast One Witness Required')
                                            }
                                            const newData = WitnessbyData.filter((_, i) => i !== index);
                                            setWitnessbyData(newData);
                                        }}
                                        size="large"
                                        icon={<DeleteFilled />}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )
                        })
                    }
                </section>
            </Card>




            <Card className="card_container_1">
                <Form layout="vertical" >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Calibrated By"
                                validateStatus={calibratedByValueErr ? "error" : ""}
                                help={calibratedByValueErr || ""}
                            >
                                <Select
                                    value={calibratedByValue}
                                    onChange={(value) => setCalibratedByValue(value)}
                                    placeholder="Select Calibrated By"
                                    style={{ width: "auto", minWidth: 400 }}
                                    size="large"
                                >
                                    {empList.map((emp) => (
                                        <Select.Option key={emp.value} value={emp.value}>
                                            {emp.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Approved By"
                                validateStatus={approvedByValueErr ? "error" : ""}
                                help={approvedByValueErr || ""}
                            >
                                <Select
                                    value={approvedByValue}
                                    onChange={(value) => setApprovedByValue(value)}
                                    placeholder="Select Approved By"
                                    style={{ width: "auto", minWidth: 400 }}
                                    size="large"
                                >
                                    {empList.map((emp) => (
                                        <Select.Option key={emp.value} value={emp.value}>
                                            {emp.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Authorized By"
                                validateStatus={authorizedByValueErr ? "error" : ""}
                                help={authorizedByValueErr || ""}
                            >
                                <Select
                                    value={authorizedByValue}
                                    onChange={(value) => setauthorizedByValue(value)}
                                    placeholder="Select Approved By"
                                    style={{ width: "auto", minWidth: 400 }}
                                    size="large"
                                >
                                    {empList.map((emp) => (
                                        <Select.Option key={emp.value} value={emp.value}>
                                            {emp.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <div style={{ display: "flex", justifyContent: "center" }}>
                {/* <Button
                    label={ifExist ? "Update Data" : "Save Data"}
                    onClick={handleSubmit}
                    variant="brand"
                    className="rainbow-m-around_medium"
                /> */}


                <Button
                    onClick={handleSubmit}
                    variant="filled"
                    type='primary'
                    size='large'
                >
                    {ifExist ? "Update Data" : "Save Data"}
                </Button>
            </div>

            {(loading && !calculationloading && showExcelData) && <Loader />}
            {calculationloading && <CalculateLoader />}
        </div>
    )
}

export default EditDefinedProdedureModal;
