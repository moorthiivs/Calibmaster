import React, { useContext, useEffect, useState } from 'react';
import "./style.css";
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from '../../../context/auth-context';
import { useNavigate } from "react-router-dom";
import { populateUomData, populateDisciplineData, populateGroupData, populateInstrumentData } from './HelperFunction';
import { instrumentNameActions } from '../../../store/instrumentName';
import { populateUomWithsysmbol } from '../Instrument/HelperFunction';
import CreateInstrumentVariants from './InstrumentVariantsType/CreateInstrumentVariants';
import InstrumentVariantForm from '../Forms/InstrumentVariantForm';
import { Form, notification } from 'antd';
import GlobalNotification from '../../../utils/GlobalNotification';


const CreateInstrumentType = () => {

    const [instrument, setInstrument] = useState([]);
    const [instrumentValue, setInstrumentValue] = useState("");

    const [instrumentTypeSpec, setInstrumentTypeSpec] = useState("");

    const [fullName, setFullName] = useState({
        name: "",
        rangeMin: "",
        rangeMax: "",
        rangeUom: "",
        lc: "",
        lcUOM: "",
        size: "",
        sizeUom: ""
    });

    const [customFullName, setCustomFullName] = useState("");

    const [UOM, setUOM] = useState([]);
    const [uomValue, setUomValue] = useState("");

    const [rangeMinimum, setRangeMinimum] = useState("");
    const [rangeMinimumUOMId, setrangeMinimumUOMId] = useState("");

    const [rangeMaximum, setRangeMaximum] = useState("");
    const [rangeMaximumUOMId, setrangeMaximumUOMId] = useState("");


    const [leastCount, setLeastCount] = useState("");
    const [leastCountUOMId, setLeastCountUOMId] = useState("");

    const [sizeSpec, setSizeSpec] = useState("");
    const [sizeSpecUomId, setSizeSpecUomId] = useState("");

    const [type, setType] = useState([]);

    const [loading, setloading] = useState(false);
    const [error, setError] = useState("");

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [instrumentErr, setInstrumentErr] = useState("");
    const [instrumentFullNameErr, setInstrumentFullNameErr] = useState("");

    const [isOpen, setisOpen] = useState(false)

    const [instrument_variant_type, setinstrument_variant_type] = useState([])

    const [instrument_full_name_type, setinstrument_full_name_type] = useState([])

    const [parameters, setParameters] = useState([]);

    const [inputRangesData, setinputRangesData] = useState([]);

    const [form] = Form.useForm();

    async function fetchData() {
        setloading(true);

        try {
            const instrumentResonse = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            }).then((res) => res.json());
            let getInstrumentData = await populateInstrumentData(instrumentResonse.data);
            setInstrument(getInstrumentData);

            const uomResonse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            }).then((res) => res.json());
            //let getUomData = await populateUomData(uomResonse.data);
            let getUomData = await populateUomWithsysmbol(uomResonse.data);
            setUOM(getUomData);

            setloading(false);
        } catch (error) {
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
        fetchData();
        fetchInstrumentVariantType()
    }, [isOpen]);


    const fetchInstrumentVariantType = async () => {
        setloading(true)
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/instrumentvariantstype/fetch?labid=${auth.labId}`, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();
                dispatch(notificationActions.changenotification({
                    title: errorData.message,
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                }));
                return;
            }

            const data = await response.json();
            const dropdownOptions = [
                ...data.data.map((item) => ({
                    value: item.instrumentVariantsType,
                    label: item.instrumentVariantsType,
                })),
            ];
            setinstrument_variant_type(dropdownOptions);
        } catch (error) {
            console.error("Error fetching grid data:", error);
        } finally {
            setloading(false)
        }
    }

    const fetchInstrumentParameterData = async (id) => {
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/instrument/instrument-parameters/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            const paramsData = data.map(param => ({
                ...param,
            }))
            setParameters(paramsData);

            form.setFieldsValue({
                parameters: paramsData.map(p => ({
                    parameterName: p.Instrumentparametername,
                    value: "",
                    uom_id: p.InstrumentUOMID || "",
                }))
            });

        } catch (error) {
            console.log("Error fetching instrument parameters:", error);
        } finally {

        }
    };

    useEffect(() => {

        if (parameters.length === 0) return;

        setinputRangesData((prev) => {
            const updated = [...prev];

            parameters.forEach((param, index) => {
                if (!updated[index]) {
                    // Add only missing input entry
                    updated[index] = {
                        [param.Instrumentparametername]: "",
                        InstrumentUOMID: param.InstrumentUOMID || "",
                        InstrumentparameterUOM: param.InstrumentparameterUOM || "",
                    };
                } else if (!updated[index][param.Instrumentparametername]) {
                    updated[index][param.Instrumentparametername] = "";
                }
            });

            return updated;
        });
    }, [parameters]);


    const [isAddParameterFromModal, setIsAddParameterFromModal] = useState(false);
    const [newParamName, setNewParamName] = useState("");

    const handleInstrumentSelect = async (instrumentId) => {
        setInstrumentValue(instrumentId);

        // Clear previous parameters before loading new ones
        setParameters([]);
        setinputRangesData([]);
        form.setFieldsValue({ parameters: [] });

        // Fetch new parameters for the selected instrument
        await fetchInstrumentParameterData(Number(instrumentId));

        // Update the fullName and Redux state
        const selected = instrument.find((inst) => inst.value === instrumentId);
        if (selected) {
            const updatedValue = { name: selected.label };
            setFullName((prev) => ({ ...prev, ...updatedValue }));
            dispatch(instrumentNameActions.changeInstrumentName(updatedValue));
        }
    };


    const CreateFullNameHandler = () => {
        const params = form.getFieldValue("parameters") || [];

        let name = fullName.name ? `${fullName.name} ` : "";

        params.forEach(param => {
            const value = param?.value?.toString().trim();
            const uomLabel = UOM.find(u => u.value === param.uom_id)?.label || "";

            if (value) {
                name += " " + (uomLabel && uomLabel.toLowerCase() !== "select"
                    ? `${value} ${uomLabel}`
                    : `${value}`);
            }
        });

        // Remove extra spaces in between
        const result = name.replace(/\s+/g, " ").trim();

        setCustomFullName(result);

        form.setFieldsValue({
            instrument_full_name: result
        });
    };

    const handleAddParameterFromModal = () => {
        const trimmedName = newParamName.trim();
        if (!trimmedName) return;
        const isDuplicate = parameters.some(
            (param) => param.Instrumentparametername.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
            notification.error({
                message: "Duplicate Parameter",
                description: `"${trimmedName}" already exists. Please enter a unique parameter name or rename it.`,
                duration: 3,
            });
            return;
        }
        const updatedParams = [
            ...parameters,
            {
                Instrumentparametername: trimmedName,
                value: "",
                InstrumentUOMID: "",
                InstrumentUOMName: "",
            },
        ];
        setParameters(updatedParams);
        const existingFormParams = form.getFieldValue("parameters") || [];
        form.setFieldsValue({
            parameters: [
                ...existingFormParams,
                {
                    parameterName: trimmedName,
                    value: "",
                    uom_id: "",
                },
            ],
        });
        setinputRangesData(prev => [
            ...prev,
            {
                parameterName: trimmedName,
                value: "",
                InstrumentUOMID: "",
                InstrumentparameterUOM: "",
            }
        ]);
        setNewParamName("");
        setIsAddParameterFromModal(false);
    };

    const handleRemoveParameter = (indexToRemove) => {
        // Remove from local state
        const updated = [...parameters];
        updated.splice(indexToRemove, 1);
        setParameters(updated);

        // Remove from AntD form field
        const currentFormParams = form.getFieldValue("parameters") || [];
        const updatedFormParams = [...currentFormParams];
        updatedFormParams.splice(indexToRemove, 1);
        form.setFieldsValue({ parameters: updatedFormParams });
    };

    const handleMoveParameter = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= parameters.length) return;
        
        // Move in local state
        const updatedParams = [...parameters];
        const [movedParam] = updatedParams.splice(fromIndex, 1);
        updatedParams.splice(toIndex, 0, movedParam);
        setParameters(updatedParams);

        // Move in inputRangesData
        const updatedInputRanges = [...inputRangesData];
        if (updatedInputRanges[fromIndex] && updatedInputRanges[toIndex]) {
            const [movedInput] = updatedInputRanges.splice(fromIndex, 1);
            updatedInputRanges.splice(toIndex, 0, movedInput);
            setinputRangesData(updatedInputRanges);
        }

        // Move in AntD form field
        const currentFormParams = form.getFieldValue("parameters") || [];
        const updatedFormParams = [...currentFormParams];
        const [movedFormParam] = updatedFormParams.splice(fromIndex, 1);
        updatedFormParams.splice(toIndex, 0, movedFormParam);
        form.setFieldsValue({ parameters: updatedFormParams });
    };

    const handleRenameParameter = (index, newName, oldName) => {
        // Update Form FIRST to avoid losing data in useEffect
        const currentFormParams = form.getFieldValue("parameters") || [];
        const updatedFormParams = [...currentFormParams];
        if (updatedFormParams[index]) {
            updatedFormParams[index].parameterName = newName;
            form.setFieldsValue({ parameters: updatedFormParams });
        }

        const currentParams = [...parameters];
        if (currentParams[index]) {
            currentParams[index].Instrumentparametername = newName;
            setParameters(currentParams);
        }

        const currentRanges = [...inputRangesData];
        if (currentRanges[index]) {
            const oldObj = currentRanges[index];
            const value = oldObj[oldName];
            
            const newObj = { ...oldObj };
            if (oldName && oldName in newObj) {
                delete newObj[oldName];
            }
            newObj[newName] = value !== undefined ? value : "";
            currentRanges[index] = newObj;
            setinputRangesData(currentRanges);
        }
    };

    const addInstrumentType = async (value) => {

        setloading(true);
        try {

            const newInstrumentType = {
                instrument_id: instrumentValue,
                //instrument_full_name: customFullName,
                instrument_full_name: value.instrument_full_name,
                instrument_type_spec: value.instrument_type_spec,
                range_minimum: rangeMinimum,
                range_minimum_uom_id: rangeMinimumUOMId,
                range_maximum: rangeMaximum,
                range_maximum_uom_id: rangeMaximumUOMId,
                least_count: leastCount,
                least_count_uom_id: leastCountUOMId,
                size_spec: sizeSpec,
                size_spec_uom_id: sizeSpecUomId,
                type: value.type || null,
                lab_id: auth.labId,
                labtype: value.lab_type,
                //rows: inputRangesData,
                rows: value.parameters
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newInstrumentType)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/instrument-types/create", requestOptions);
            const data = await response.json();
            console.log(data);

            setError("");
            setloading(false);

            GlobalNotification.success({
                title: 'Instrument Type Created',
                description: 'The Instrument Type was created successfully.',
            });
            navigate("/dashboard/instrument-types");

        } catch (err) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: err.message || 'Something went wrong!',
            });
            setloading(false);
        }
    }


    const handleChange = (paramName, field, value, displayName = null) => {
        setinputRangesData(prev => {
            // Clone the array
            const updated = [...prev];
            const paramIndex = parameters.findIndex(p => p.Instrumentparametername === paramName);

            if (paramIndex === -1) return prev;

            // Ensure the object at the correct index exists
            if (!updated[paramIndex]) updated[paramIndex] = {};

            // Clean parameterName/value if accidentally set
            delete updated[paramIndex].parameterName;
            delete updated[paramIndex].value;

            if (field === "value") {
                updated[paramIndex] = {
                    ...updated[paramIndex],
                    [paramName]: value
                };
            }

            if (field === "uom_id") {
                updated[paramIndex] = {
                    ...updated[paramIndex],
                    InstrumentUOMID: value || "",
                    InstrumentparameterUOM: displayName === "Select" ? "" : displayName || ""
                };
            }

            if (field === "Symbols") {
                updated[paramIndex] = {
                    ...updated[paramIndex],
                    Symbols: value || ""
                };
            }

            if (field === "SymbolPos") {
                updated[paramIndex] = {
                    ...updated[paramIndex],
                    SymbolPos: value || "Prefix"
                };
            }

            return updated;
        });
    };


    return (
        <>
            <InstrumentVariantForm
                mode="create"
                form={form}
                onSubmit={addInstrumentType}
                onGenerateName={CreateFullNameHandler}
                onInstrumentChange={handleInstrumentSelect}
                onAddNewVariantType={() => setisOpen(true)}
                isLoading={loading}
                instrumentOptions={instrument}
                parameters={parameters}
                uomOptions={UOM}
                variantTypeOptions={instrument_variant_type}
                isAddParameterFromModal={isAddParameterFromModal}
                onOpenAddParameterModal={() => setIsAddParameterFromModal(true)}
                handleAddParameterFromModal={handleAddParameterFromModal}
                newParamName={newParamName}
                setIsAddParameterFromModal={setIsAddParameterFromModal}
                setNewParamName={setNewParamName}
                handleRemoveParameter={handleRemoveParameter}
                handleChange={handleChange}
                handleMoveParameter={handleMoveParameter}
                handleRenameParameter={handleRenameParameter}
            />
            {isOpen && (
                <CreateInstrumentVariants isOpen={isOpen} onClose={() => setisOpen(false)} />
            )}

        </>

    )
}

export default CreateInstrumentType;
