import React, { useContext, useEffect, useState } from 'react';
import { Input, Card, Button, Select, TableWithBrowserPagination, Column, } from 'react-rainbow-components';
import { notificationActions } from '../../../store/nofitication';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import AddMasterEquipments from './MasterEquipments/AddMasterEquipments';
import ListMasterEquipments from './MasterEquipments/ListMasterEquipments';
import VerticalTable from './Add_Tables/VerticalTable';

import "./Styles/DefineProcedure.css";
import "./Styles/mega-style.css";

import { umpListActions } from '../../../store/umpItemsList';
import Loader from '../../UI/Loader';
import showErrorDialog from '../../../utils/showErrorToast';
import DefineProcedureForm from '../Forms/DefineProcedureForm';
import { notification } from 'antd';


// *** Temp. Import
// import VerticalTable1 from "./Micrometer_Tables/VerticalTable1";
// import VerticalTable2 from "./Micrometer_Tables/VerticalTable2";

const DefineProcedure = () => {


    // *** State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // *** List Of Uncertainty Parameters from Redux Store ***
    const umpListItems = useSelector((state) => state.umpListItems.list);

    // *** State for store values ***
    const [calibrationProcedure, setCalibrationProcedure] = useState("");
    const [refStd, setRefStd] = useState("");

    const [validity, setValidity] = useState("");
    const [traceability, setTraceability] = useState("");
    // const [temperature, setTemperature] = useState("");
    // const [humidity, setHumidity] = useState("");
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
    const [remarks, setRemarks] = useState(["", ""]);

    // *** State for Master Equipments ***
    const [masterList, setMasterList] = useState([]);
    const [addEquipmets, setAddEquipmets] = useState([]);
    const [masterListError, setMasterListError] = useState("");
    const [loading, setloading] = useState(false);

    // *** State For Manage VerticalTable Component ***
    const [mainArray, setMainArray] = useState([]);


    const [allMasterData, setallMasterData] = useState([])

    const [alldocformat, setalldocformat] = useState([])

    const [selectedFormatdoc, setselectedFormatdoc] = useState(null)



    const [diciplineParameters, setdiciplineParameters] = useState({
        isAtmosphericPressure: false,
        isFrequency: false,
        AtmosphericPressure: "",
        Frequency: ""
    })

    const [uniqueTableID, setUniqueTableID] = useState(new Date().getTime());

    // *** State For Manage Uncertainty Parameters ***
    const [selectedUMPList, setSelectedUMPList] = useState([]);

    // *** shift each tables from child to mainArray *** 
    function setArraydata(eachBodyData) {

        setMainArray((oldArray) => {

            let isAvailable = false

            oldArray.map((item) => {
                if (item.unique_id == eachBodyData.unique_id) {
                    isAvailable = true;
                }
            });
            // console.log(isAvailable);

            const updateArray = oldArray.map((eachRow) => {
                if (eachRow.unique_id == eachBodyData.unique_id) {
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

    // *** Function to delete table from anywhere ***
    const deleteTable = (unique_id, fromId) => {
        let userConfirmed = confirm(`Are you absolutely sure you want to delete Table ${Number(fromId) + 1}?`);
        if (userConfirmed) {
            setTables((oldArray) => {
                const updateArray = oldArray?.filter((eachArr, index) => eachArr.unique_id != unique_id);
                updateArray?.map((eachArr, index) => {
                    eachArr.eachComponent.props.table_Data.fromId = index;
                })
                return updateArray;
            })

            setMainArray((oldArray) => {
                const updateArray = oldArray?.filter((eachArr, index) => {
                    return eachArr.unique_id !== unique_id;
                });
                return updateArray;
            })
        }
    };

    // Function to delete table for any set data changes
    const deleteTableAnyChange = (unique_id) => {
        setMainArray((oldArray) => {
            const updateArray = oldArray?.filter((eachArr, index) => eachArr.unique_id != unique_id);
            return updateArray;
        });
    };

    const [tables, setTables] = useState([
        {
            eachComponent: <VerticalTable
                key={0}
                fromId={0}
                table_Data={{ fromId: 0 }}
                table_type="vertical"
                mainArray={mainArray}
                setMainArray={setMainArray}
                setArraydata={setArraydata}
                deleteTable={deleteTable}
                unique_id={uniqueTableID}
                deleteTableAnyChange={deleteTableAnyChange}
            />,
            unique_id: uniqueTableID
        }
    ]);

    const extractTypePart = (fullName) => {
        return fullName.includes("Type");
    };

    // *** Fetch InstrumentType ***
    const fetchinstrumentType = async () => {

        try {
            setloading(true);

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
                    //label: extractTypePart(item.instrument_full_name) ? item.instrument_full_name : `${item.instrument_full_name} Type-${item.type}`,
                }
            });

            setInstrumentList(newArray);

            setloading(false);

            notification.success({
                message: "Instrument Type List fetched Successfully",
                description: "",
            });
        } catch (error) {
            console.log(error);

            setloading(false);
            notification.error({
                message: "Something went wrong",
                description: "",
            });
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

                notification.success({
                    message: response?.message,
                    description: "",
                });

            } else {
                setloading(false);
                notification.error({
                    message: "Failed to fetch master list",
                    description: "",
                });
            }
        } catch (error) {
            notification.error({
                message: "Something went wrong",
                description: "",
            });
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

            console.log(data);

            setalldocformat(data);
        } catch (error) {
            console.error('Error fetching docs:', error.message);
        }
    };

    useEffect(() => {
        fetchinstrumentType();
        fetchMasterLists();
        fetchDocs()
    }, []);

    // *** Function for add table ***
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

    // *** Add Remarks ***
    const addRemarksHandler = () => {
        const newRemarks = [...remarks, ""];
        setRemarks(newRemarks);
    }

    // *** Add Remarks Value ***
    const remarkChangeHandler = (value, i) => {
        const inputData = [...remarks];
        inputData[i] = value.target.value;
        setRemarks(inputData);
    }

    // *** Delete Remarks ***
    const deleteRemarkHandler = (i) => {
        const deleteValue = [...remarks];
        deleteValue.splice(i, 1);
        setRemarks(deleteValue);
    }



    const handleselect = async (v) => {
        try {

            console.log(v);

            console.log(typeof v);

            if (!v) return

            const isAtmosphericPressure = allMasterData.some((values, index) => values.instrument_type_id === Number(v) && values.ins_dis_name === "MECHANICAL")
            const isFrequency = allMasterData.some((values, index) => values.instrument_type_id === Number(v) && values.ins_dis_name === "ELECTRO TECHNICAL")

            setdiciplineParameters((prev) => ({
                ...prev,
                isAtmosphericPressure: isAtmosphericPressure,
                isFrequency: isFrequency
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

        try {

            const uncertainty_parameters_id_array = [];
            umpListItems.map((item) => {
                uncertainty_parameters_id_array.push({ uncertainty_master_parameter_id: item.uncertainty_master_parameter_id });
            });
            setloading(true);
            const bodyData = {
                lab_id: auth.labId,
                instrument_type_id: value.instrument,
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
                //remarks,
                remarks: cleanedRemarks,

                uncertainty_master_parameters: uncertainty_parameters_id_array,
                selectedFormatdoc: value.documentFormat,
                description: value.description
            };

            let response = await fetch(config.Calibmaster.URL + "/api/design-procedures/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            });
            response = await response.json();
            // return console.log(response);

            const newNotification = {
                title: "Defined Procedure added Successfully",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            dispatch(umpListActions.removeAllUMPItem());
            navigate("/dashboard/procedures");
            setloading(false);
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


    return (
        <>

            <DefineProcedureForm
                initialData={null}
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
                mode='create'
            />
        </>





    )
};

export default DefineProcedure;