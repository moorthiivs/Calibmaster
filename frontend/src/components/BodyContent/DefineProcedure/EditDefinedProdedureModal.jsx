import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Input, Select, ButtonIcon } from 'react-rainbow-components';
import { notificationActions } from '../../../store/nofitication';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../utils/config.json";
import AddMasterEquipments from './MasterEquipments/AddMasterEquipments';
import ListMasterEquipments from './MasterEquipments/ListMasterEquipments';

import ExistVerticalTable from './Edit_Tables/ExistVerticalTable';

import VerticalTable from './Add_Tables/VerticalTable';

import "./Styles/DefineProcedure.css";
import "./Styles/mega-style.css";

import { umpListActions } from '../../../store/umpItemsList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import Loader from '../../UI/Loader';
import showErrorDialog from '../../../utils/showErrorToast';
import GlobalNotification from '../../../utils/GlobalNotification';
//import { Modal } from 'react-rainbow-components';
import { Form, Modal, Spin } from 'antd';
import DefineProcedureForm from '../Forms/DefineProcedureForm';
import { log } from 'mathjs';


const EditDefinedProdedureModal = ({ isOpen, onRequestClose, masterId }) => {

    const [form] = Form.useForm();

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    // *** List Of Uncertainty Parameters from Redux Store ***
    const umpListItems = useSelector((state) => state.umpListItems.list);

    // *** State for store values ***
    const [masterDPId, setMasterDPId] = useState("");
    const [calibrationProcedure, setCalibrationProcedure] = useState("");
    const [refStd, setRefStd] = useState("");

    const [validity, setValidity] = useState("");
    const [traceability, setTraceability] = useState("");
    //const [temperature, setTemperature] = useState("");
    //const [humidity, setHumidity] = useState("");
    const [temperature, setTemperature] = useState({ start: '', middle: '', end: '', mean: '' });
    const [humidity, setHumidity] = useState({ start: '', middle: '', end: '', mean: '' });
    const [atmosphericPressure, setAtmosphericPressure] = useState("");

    const [instrumentList, setInstrumentList] = useState([]);
    const [instrumentValue, setInstrumentValue] = useState("");

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
    const [loading, setloading] = useState(false);

    // *** State For Master Define Procedure ***
    const [masterDefinedProcedue, setMasterDefinedProcedue] = useState({});

    // *** State For Manage DynamicTable Component ***
    const [mainArray, setMainArray] = useState([]);

    // State to manage tables
    const [tables, setTables] = useState([]);

    // shift each tables from child to mainArray
    function setArraydata(eachBodyData) {

        setMainArray((oldArray) => {

            let isAvailable = false

            oldArray.map((item) => {
                if (item.fromId == eachBodyData.fromId && item.unique_id == eachBodyData.unique_id) {
                    isAvailable = true;
                }
            });
            // console.log(isAvailable);

            const updateArray = oldArray.map((eachRow) => {
                if (eachRow.fromId == eachBodyData.fromId) {
                    return {
                        ...eachBodyData
                    }
                } else {
                    return eachRow;
                }
            });

            if (isAvailable) {
                return updateArray;
            } else {
                return [...oldArray, eachBodyData];
            }
        })
    }

    // Function to delete table from anywhere
    const deleteTable = (unique_id, fromId) => {
        let userConfirmed = confirm(`Are you absolutely sure you want to delete Table ${Number(fromId) + 1}?`);
        if (userConfirmed) {
            let deletionTable = null;
            setTables((oldArray) => {
                oldArray?.filter((eachArr, index) => {
                    if (eachArr.unique_id == unique_id && eachArr.eachComponent.props.eachItem) {
                        eachArr.eachComponent.props.eachItem.delete = true;
                        deletionTable = eachArr.eachComponent.props.eachItem;
                    }
                });

                const updateArray = oldArray?.filter((eachArr, index) => eachArr.unique_id != unique_id);

                updateArray?.map((eachArr, index) => {
                    const tableKeyName = `table-${index + 1}`;
                    let TKey = `T${index + 1}`;
                    if (!eachArr.eachComponent.props.eachItem?.cell_texts) {
                        eachArr.eachComponent.props.table_Data.fromId = index;
                        return;
                    }

                    const copyCellText = [...eachArr.eachComponent.props.eachItem?.cell_texts[Object.keys(eachArr.eachComponent.props.eachItem?.cell_texts)[0]]];

                    copyCellText.map((row, rowIndex) => {
                        for (const key in row) {
                            if (key.charAt(0) == 'T') {
                                const KeyData = row[key];
                                delete row[key];
                                row[`${TKey}${key.match(/[A-Za-z]+\d+/g)[1]}`] = KeyData;
                            }
                        }
                    });
                    eachArr.eachComponent.props.eachItem.fromId = index;
                    eachArr.eachComponent.props.eachItem.cell_texts = { [tableKeyName]: copyCellText };
                })
                return updateArray;
            });

            setMainArray((oldArray) => {
                let isDeleted = false;
                let updateArray = oldArray?.map((eachArr, index) => {
                    if (eachArr.unique_id == unique_id) {
                        eachArr.delete = true;
                        isDeleted = true;
                        return eachArr;
                    } else {
                        return eachArr;
                    }
                });

                if (!isDeleted && deletionTable) {
                    updateArray = [...updateArray, deletionTable];
                }

                return updateArray;
            });
        }
    };

    // Function to delete table for any set data changes
    const deleteTableAnyChange = (unique_id) => {
        setMainArray((oldArray) => {
            const updateArray = oldArray?.filter((eachArr, index) => eachArr.unique_id != unique_id);
            return updateArray
        });
    };

    const [allMasterData, setallMasterData] = useState([])

    const [alldocformat, setalldocformat] = useState([])

    const [selectedFormatdoc, setselectedFormatdoc] = useState(null)

    const [diciplineParameters, setdiciplineParameters] = useState({
        isAtmosphericPressure: false,
        isFrequency: false,
        AtmosphericPressure: null,
        Frequency: null
    })

    const [description, setdescription] = useState("")

    const extractTypePart = (fullName) => {
        return fullName.includes("Type");
    };

    // *** Fetch InstrumentType ***
    const fetchinstrumentType = async () => {
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
                    label: item.instrument_full_name
                    //label: extractTypePart(item.instrument_full_name) ? item.instrument_full_name : `${item.instrument_full_name} Type-${item.type}`,
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
    }

    // *** Fetch Defined Procedures ***
    const fetchDefinedProcedures = async (masterinstrumentData) => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/view-defined-procedure", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    master_design_procedure_id: masterId,
                    lab_id: auth.labId
                })
            });

            let response = await data.json();
            const { masterTable, tableDesign, uncertainty_master_parameter_query } = response;
            console.log(response, "Response");

            // console.log(masterTable);

            setMasterDPId(masterTable.master_design_procedure_id)
            setCalibrationProcedure(masterTable.calibration_procedure);
            setRefStd(masterTable.ref_std);

            setValidity(masterTable.validity);
            setTraceability(masterTable.traceability);
            setTemperature(masterTable.temperature);
            setHumidity(masterTable.humidity);


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

            setAddEquipmets(masterTable?.master_list_equipments);
            setRemarks(masterTable?.remarks);

            setselectedFormatdoc(masterTable?.document_format)

            setdescription(masterTable?.description)

            const isAtmosphericPressure = masterinstrumentData.some((values, index) => values.instrument_type_id === Number(masterTable.instrument_type_id) && values.ins_dis_name === "MECHANICAL")
            const isFrequency = masterinstrumentData.some((values, index) => values.instrument_type_id === Number(masterTable.instrument_type_id) && values.ins_dis_name === "ELECTRO TECHNICAL")


            if (isAtmosphericPressure) {
                setdiciplineParameters((prev) => ({ ...prev, isAtmosphericPressure: true, AtmosphericPressure: masterTable?.atmospheric_pressure || '' }))
            }

            if (isFrequency) {
                setdiciplineParameters((prev) => ({ ...prev, isFrequency: true, Frequency: masterTable?.frequency || '' }))
            }


            const createDynamicTable = tableDesign.map((item) => {

                const { cell_texts } = item;
                const eachBodyArray = Object.values(cell_texts)[0];

                if (item.table_type === "vertical") {
                    return {
                        eachComponent: <ExistVerticalTable
                            key={item.fromId} fromId={item.fromId} unique_id={item.unique_id}
                            table_type="vertical"
                            setArraydata={setArraydata}
                            masterTableInfo={masterTable}
                            eachItem={item}
                            eachBodyArray={eachBodyArray}
                            deleteTable={deleteTable}
                            deleteTableAnyChange={deleteTableAnyChange}
                        />,
                        unique_id: item.unique_id
                    }
                }
            });

            setTables(createDynamicTable);
            setMasterDefinedProcedue(masterTable);
            // *** Add Uncertainty Parameters List Into Redux Store ***
            dispatch(umpListActions.addBulkUMPList(uncertainty_master_parameter_query));

            const newNotification = {
                title: "Defined Procedure Info fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };

            GlobalNotification.success({
                title: "Defined Procedure Info fetched Successfully",
                description: "",
            });
            //return dispatch(notificationActions.changenotification(newNotification));
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
        } finally {
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

    // useEffect(() => {
    //     fetchinstrumentType();
    //     fetchDefinedProcedures();
    //     fetchMasterLists();
    // }, []);



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

            console.log(data);

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
        };
        fetchAllData();
        fetchDocs()
    }, []);


    // TODO: Function to Add Vertical Table
    const addVerticalTable = () => {
        const newKey = tables.length;
        const unique_id = new Date().getTime()
        if (tables.length < 50) {
            setTables([
                ...tables,
                {
                    eachComponent: <VerticalTable
                        key={newKey}
                        fromId={newKey}
                        table_Data={{ fromId: newKey }}
                        table_type="vertical"
                        mainArray={mainArray}
                        setMainArray={setMainArray}
                        setArraydata={setArraydata}
                        deleteTable={deleteTable}
                        unique_id={unique_id}
                        deleteTableAnyChange={deleteTableAnyChange}
                    />,
                    unique_id: unique_id
                }
            ]);
        } else {
            alert("Max 50 table you can add");
        }
    };

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

    // Handle Submit Function
    // const handleSubmit = async () => {

    //     try {

    //         //const filterDeleted = mainArray?.filter((eachArr) => !eachArr.delete);

    //         // if (mainArray.length >= 1 && filterDeleted.length == tables.length) {

    //         //     // sorting by fromId
    //         //     filterDeleted.sort((currentItem, nextItem) => Number(currentItem.fromId) - Number(nextItem.fromId));

    //         //     for (let i = 0; i < filterDeleted.length; i++) {
    //         //         const tableKeyName = `table-${i + 1}`;
    //         //         let TKey = `T${i + 1}`;

    //         //         const eachTableComponent = filterDeleted[i];
    //         //         let { cell_texts, conditional_formats } = filterDeleted[i];

    //         //         // console.log(cell_texts);
    //         //         // console.log(Array.isArray(cell_texts));

    //         //         const copyCellText = [...cell_texts];
    //         //         cell_texts = {};

    //         //         copyCellText.map((row, rowIndex) => {
    //         //             for (const key in row) {
    //         //                 if (key.charAt(0) !== 'T') {
    //         //                     row[`${TKey}${key}`] = row[key];
    //         //                     delete row[key];
    //         //                 }
    //         //                 else {
    //         //                     const KeyData = row[key];
    //         //                     delete row[key];
    //         //                     row[`${TKey}${key.match(/[A-Za-z]+\d+/g)[1]}`] = KeyData;
    //         //                 }
    //         //             }
    //         //         });

    //         //         // Conditional formatting
    //         //         for (const key in conditional_formats) {
    //         //             if (key.charAt(0) !== 'T') {
    //         //                 conditional_formats[`${TKey}${key}`] = conditional_formats[key];
    //         //                 delete conditional_formats[key];
    //         //             }
    //         //             else {
    //         //                 const KeyData = conditional_formats[key];
    //         //                 delete conditional_formats[key];
    //         //                 conditional_formats[`${TKey}${key.match(/[A-Za-z]+\d+/g)[1]}`] = KeyData;
    //         //             }
    //         //         }

    //         //         cell_texts[tableKeyName] = copyCellText;
    //         //         eachTableComponent.cell_texts = cell_texts;
    //         //     }
    //         //     setMainArray([...mainArray?.filter((eachArr) => eachArr.delete), ...filterDeleted])
    //         // console.log(mainArray);
    //         // return;

    //         if (calibrationProcedure == "") {
    //             setCalibrationProcedureErr("Please enter Calibration Procedure");
    //             return;
    //         }

    //         if (refStd == "") {
    //             setRefStdErr("Please enter REF STD");
    //             return;
    //         }

    //         if (validity == "") {
    //             setValidityErr("Please enter validity");
    //             return;
    //         }

    //         if (traceability == "") {
    //             setTraceabilityErr("Please enter traceability");
    //             return;
    //         }

    //         // Temperature validation
    //         if (!temperature.start || !temperature.end) {
    //             await showErrorDialog("Warning", "Please enter both START and END values for TEMPERATURE.", "warning", ".edit_defined_prodedure_modal");
    //             setTemperatureErr(!temperature.start ? 'Please Enter Start Value' : 'Please Enter End Value')
    //             return;
    //         }

    //         // Humidity validation
    //         if (!humidity.start || !humidity.end) {
    //             await showErrorDialog("Warning", "Please enter both START and END values for HUMIDITY.", "warning", ".edit_defined_prodedure_modal");
    //             setHumidityErr(!humidity.start ? 'Please Enter Start Value' : 'Please Enter End Value')
    //             return;
    //         }

    //         if (instrumentValue == "") {
    //             setInstrumentValueErr("Please enter a Instrument");
    //             return;
    //         }

    //         if (addEquipmets.length == 0) {
    //             setMasterListError("Please select a Master Equipment.");
    //             return;
    //         }

    //         const uncertainty_parameters_id_array = [];

    //         umpListItems.map((item) => {
    //             uncertainty_parameters_id_array?.push({ uncertainty_master_parameter_id: item.uncertainty_master_parameter_id });
    //         });
    //         setloading(true);

    //         const bodyData = {
    //             lab_id: auth.labId,
    //             instrument_type_id: instrumentValue,
    //             master_design_procedure_id: masterDPId,

    //             calibration_procedure: calibrationProcedure,
    //             ref_std: refStd,

    //             validity: validity,
    //             traceability: traceability,

    //             temperature: temperature,
    //             humidity: humidity,
    //             //atmospheric_pressure: atmosphericPressure,
    //             atmospheric_pressure: diciplineParameters.AtmosphericPressure,
    //             frequency: diciplineParameters.Frequency,

    //             mainArray,
    //             master_list_equipments: addEquipmets,
    //             remarks,
    //             uncertainty_master_parameters: uncertainty_parameters_id_array,
    //             selectedFormatdoc
    //         }


    //         let response = await fetch(config.Calibmaster.URL + "/api/design-procedures/update", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(bodyData)
    //         });
    //         response = await response.json();

    //         const newNotification = {
    //             title: "Defined Procedure added Successfully",
    //             description: "",
    //             icon: "success",
    //             state: true,
    //             timeout: 15000,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //         //dispatch(umpListActions.removeAllUMPItem());  commente for design procedure table
    //         setloading(false);
    //         onRequestClose();
    //         // } else {
    //         //     alert("Please set all table from");
    //         //     setloading(false);
    //         // }
    //     } catch (error) {
    //         console.log(error);
    //         const newNotification = {
    //             title: "Something went wrong",
    //             description: "",
    //             icon: "error",
    //             state: true,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //         setloading(false);
    //     }
    // }

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




    const cleanedRemarks = Array.isArray(remarks)
        ? remarks
            .filter(item => typeof item === "string" && item.trim() !== "")
        : [];

    const handleSubmit = async (value) => {


        console.log(value, "value");
        console.log(remarks, "remarks");
        console.log(addEquipmets, "addEquipmets");




        try {
            const uncertainty_parameters_id_array = [];

            umpListItems.map((item) => {
                uncertainty_parameters_id_array?.push({ uncertainty_master_parameter_id: item.uncertainty_master_parameter_id });
            });
            setloading(true);

            const bodyData = {
                lab_id: auth.labId,
                instrument_type_id: value.instrument,
                master_design_procedure_id: masterDPId,


                calibration_procedure: value.calibrationProcedure,
                ref_std: value.refStd,

                validity: value.validity,
                traceability: value.traceability,

                temperature: value.temperature,
                humidity: value.humidity,
                //atmospheric_pressure: atmosphericPressure,
                atmospheric_pressure: value.AtmosphericPressure,
                frequency: value.Frequency,

                mainArray,
                master_list_equipments: addEquipmets,
                //remarks: remarks,
                remarks: cleanedRemarks,

                uncertainty_master_parameters: uncertainty_parameters_id_array,
                selectedFormatdoc: value.documentFormat,
                description: value.description
            }


            let response = await fetch(config.Calibmaster.URL + "/api/design-procedures/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            });
            response = await response.json();

            const newNotification = {
                title: "Defined Procedure added Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            //dispatch(umpListActions.removeAllUMPItem());  commente for design procedure table
            setloading(false);
            onRequestClose();

        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setloading(false);
        }
    }



    // if (loading)
    //     return <Loader />;

    return (




        <>

            <Modal
                open={isOpen}
                onCancel={onRequestClose}
                footer={null}
                centered={true}
                width="90%"
                maskClosable={false}
                getContainer={false}
            >


                {
                    loading ? <Spin size='large' fullscreen /> :
                        <DefineProcedureForm
                            initialData={{
                                calibrationProcedure,
                                refStd,
                                validity,
                                traceability,
                                temperature,
                                humidity,
                                documentFormat: selectedFormatdoc,
                                instrument: instrumentValue,
                                AtmosphericPressure: atmosphericPressure,
                                description,
                            }}
                            alldocformat={alldocformat}
                            instrumentList={instrumentList}
                            handleselect={handleselect}
                            diciplineParameters={diciplineParameters}
                            onSubmit={handleSubmit}
                            masterList={masterList}
                            addEquipmets={addEquipmets}
                            setAddEquipmets={setAddEquipmets}
                            masterListError={masterListError}
                            setMasterListError={setMasterListError}
                            remarks={remarks}
                            addRemarksHandler={addRemarksHandler}
                            remarkChangeHandler={remarkChangeHandler}
                            deleteRemarkHandler={deleteRemarkHandler}
                            isLoading={loading}
                            mode='edit'
                        />
                }


            </Modal>


        </>
    )
}

export default EditDefinedProdedureModal;