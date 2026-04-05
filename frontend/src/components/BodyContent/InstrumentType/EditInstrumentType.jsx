import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner, Input, Select, Button, CheckboxToggle, Modal, ButtonIcon } from 'react-rainbow-components';
import "./style.css";
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from '../../../context/auth-context';
import { useNavigate } from "react-router-dom";
import {
    populateUomData, populateDisciplineData, populateGroupData, populateInstrumentData,
    findInstrumentValue, findUOMValue
} from './HelperFunction';
import Loader from '../../UI/Loader';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import InstrumentVariantForm from '../Forms/InstrumentVariantForm';
import { Form, notification } from 'antd';
import GlobalNotification from '../../../utils/GlobalNotification';

const EditInstrumentType = () => {

    const [id, setId] = useState("");
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

    const [type, setType] = useState("");

    const [loading, setloading] = useState(false);
    const [error, setError] = useState("");

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    let instrumentTypeId = useSelector((state) => state.labIdKey.current);

    const [instrumentErr, setInstrumentErr] = useState("");
    const [instrumentFullNameErr, setInstrumentFullNameErr] = useState("");
    const [inputRangesData, setinputRangesData] = useState([]);
    const [instrument_variant_type, setinstrument_variant_type] = useState([])

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
            let getUomData = await populateUomData(uomResonse.data);
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
    }, []);

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

            console.log(data, "data");

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

    // *** fetchinstrumentTypeId ***
    async function fetchinstrumentTypeId() {
        try {
            setloading(true);
            const response = await fetch(config.Calibmaster.URL + "/api/instrument-types/fetch/" + id, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            const data = await response.json();
            setInstrumentValue(data?.result?.instrument_id);
            setInstrumentTypeSpec(data?.result?.instrument_type_spec);

            setRangeMinimum(data?.result?.range_minimum);
            setrangeMinimumUOMId(data?.result?.range_minimum_uom_id);

            setRangeMaximum(data?.result?.range_maximum);
            setrangeMaximumUOMId(data?.result?.range_maximum_uom_id);

            setLeastCount(data?.result?.least_count);
            setLeastCountUOMId(data?.result?.least_count_uom_id);

            setSizeSpec(data?.result?.size_spec);
            setSizeSpecUomId(data?.result?.size_spec_uom_id);
            setType(data?.result?.type)

            setCustomFullName(data?.result?.instrument_full_name);

            if (data?.result.ranges?.length === 0) {
                setinputRangesData([]);
            } else {
                setinputRangesData(data?.result.ranges);
            }


            // Set fullName.name
            let getInsName = await findInstrumentValue(data?.result?.instrument_id, instrument);
            setFullName((prevName) => ({
                ...prevName,
                ...{ name: data?.result?.instrument?.instrument_name }
            }));

            // Set fullName.rangeMin
            setFullName(prevName => ({
                ...prevName,
                ...{ rangeMin: data?.result?.range_minimum }
            }));

            // Set fullName.rangeMax
            setFullName(prevName => ({
                ...prevName,
                ...{ rangeMax: data?.result?.range_maximum }
            }));

            // Set fullName.rangeUom
            await findInstrumentValue(data?.result?.range_maximum_uom_id, UOM);
            setFullName(prevName => ({
                ...prevName,
                ...{ rangeUom: data?.result?.range_maximum_uom?.uom_printsysmbol }
            }));

            // Set fullName.lc
            setFullName(prevName => ({
                ...prevName,
                ...{ lc: data?.result?.least_count }
            }));

            // Set fullName.lcUOM
            await findInstrumentValue(data?.result?.least_count_uom_id, UOM);
            setFullName(prevName => ({
                ...prevName,
                ...{ lcUOM: data?.result?.least_count_uom?.uom_printsysmbol }
            }));

            // Set fullName.size
            setFullName(prevName => ({
                ...prevName,
                ...{ size: data?.result?.size_spec }
            }));

            // Set fullName.sizeUom
            let sizeUomName = await findInstrumentValue(data?.result?.size_spec_uom_id, UOM);
            setFullName(prevName => ({
                ...prevName,
                ...{ sizeUom: data?.result?.size_spec_uom?.uom_printsysmbol }
            }));

            const formValues = {
                instrument_id: data?.result?.instrument_id,
                instrument_type_spec: data?.result?.instrument_type_spec,
                instrument_full_name: data?.result?.instrument_full_name,
                lab_type: data?.result?.labtype || "",
                type: data?.result?.type || [],
                parameters: data?.result?.ranges?.map((row) => {
                    const paramName = Object.keys(row).find(
                        (key) => key !== "InstrumentUOMID" && 
                                 key !== "InstrumentparameterUOM" && 
                                 key !== "Symbols" && 
                                 key !== "SymbolPos"
                    );
                    return {
                        parameterName: paramName,
                        value: row[paramName],
                        uom_id: row.InstrumentUOMID,
                        Symbols: row.Symbols || "",
                        SymbolPos: row.SymbolPos || "Prefix",
                    };
                }) || [],
            };

            form.setFieldsValue(formValues);


        } catch (error) {
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setloading(false);
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        try {
            if (instrumentTypeId) {
                setId(instrumentTypeId);
                fetchinstrumentTypeId();
            }
        } catch (error) {
            console.log(error);
        }

    }, [instrumentTypeId, id]);


    const [isAddParameterFromModal, setIsAddParameterFromModal] = useState(false);
    const [newParamName, setNewParamName] = useState("");

    const handleAddParameterFromModal = () => {
        const trimmedName = newParamName.trim();
        if (!trimmedName) return;

        // Check for duplicates in inputRangesData (case-insensitive)
        const isDuplicate = inputRangesData.some(item =>
            Object.keys(item).some(k =>
                k !== "InstrumentUOMID" && k !== "InstrumentparameterUOM" && k.toLowerCase() === trimmedName.toLowerCase()
            )
        );

        if (isDuplicate) {
            notification.error({
                message: "Duplicate Parameter",
                description: `"${trimmedName}" already exists. Please enter a unique parameter name or rename it.`,
                duration: 3,
            });
            return;
        }

        setinputRangesData([
            ...inputRangesData,
            {
                [trimmedName]: "",
                InstrumentUOMID: "",
                InstrumentparameterUOM: "",
            },
        ]);

        setNewParamName("");
        setIsAddParameterFromModal(false);
    };

    const handleRemoveParameter = (index) => {
        const updated = [...inputRangesData];
        updated.splice(index, 1);
        setinputRangesData(updated);
    };

    const handleMoveParameter = (fromIndex, toIndex) => {
        const updated = [...inputRangesData];
        if (toIndex < 0 || toIndex >= updated.length) return;
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setinputRangesData(updated);
    };

    const handleRenameParameter = (index, newName, oldName) => {
        const currentFormParams = form.getFieldValue("parameters") || [];
        const updatedFormParams = [...currentFormParams];
        if (updatedFormParams[index]) {
            updatedFormParams[index].parameterName = newName;
            form.setFieldsValue({ parameters: updatedFormParams });
        }

        setinputRangesData(prev => {
            const updated = [...prev];
            if (updated[index]) {
                const oldObj = updated[index];
                const value = oldObj[oldName];
                
                const newObj = { ...oldObj };
                if (oldName && oldName in newObj) {
                    delete newObj[oldName];
                }
                newObj[newName] = value !== undefined ? value : "";
                updated[index] = newObj;
            }
            return updated;
        });
    };

    const parameters = inputRangesData.map((param) => {
        const paramName = Object.keys(param).find(k =>
            k !== "InstrumentUOMID" && 
            k !== "InstrumentparameterUOM" && 
            k !== "Symbols" && 
            k !== "SymbolPos"
        );

        return {
            [paramName]: param[paramName],
            InstrumentUOMID: param.InstrumentUOMID,
            InstrumentparameterUOM: param.InstrumentparameterUOM,
            Symbols: param.Symbols || "",
            SymbolPos: param.SymbolPos || "Prefix",
        };
    });



    const CreateFullNameHandler = () => {
        const params = form.getFieldValue("parameters") || [];

        let name = fullName.name ? `${fullName.name} ` : "";

        params.forEach(param => {
            const value = param?.value?.toString().trim();
            const uomLabel = UOM.find(u => u.value === param.uom_id)?.label || "";

            if (value) {
                name += uomLabel && uomLabel.toLowerCase() !== "select"
                    ? `${value} ${uomLabel} `
                    : `${value} `;
            }
        });

        const result = name.trim();
        setCustomFullName(result);

        form.setFieldsValue({
            instrument_full_name: result
        });
    };


    const handleChange = (paramName, field, value, displayName = "") => {
        setinputRangesData((prev) => {
            const updated = [...prev];

            const index = updated.findIndex((item) =>
                Object.keys(item).some(k =>
                    k !== "InstrumentUOMID" &&
                    k !== "InstrumentparameterUOM" &&
                    k === paramName
                )
            );

            if (index === -1) return prev;

            const updatedParam = { ...updated[index] };

            if (field === "value") {
                updatedParam[paramName] = value;
            } else if (field === "uom_id") {
                updatedParam.InstrumentUOMID = value || "";
                updatedParam.InstrumentparameterUOM = displayName === "Select" ? "" : displayName || "";
            } else if (field === "Symbols") {
                updatedParam.Symbols = value;
            } else if (field === "SymbolPos") {
                updatedParam.SymbolPos = value;
            }

            updated[index] = updatedParam;
            return updated;
        });
    };


    const saveInstrumentType = async (value) => {


        setloading(true);
        try {

            const newInstrumentType = {
                instrument_type_id: id,
                instrument_id: value.instrument_id || instrumentValue,
                instrument_full_name: value.instrument_full_name || customFullName,
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
                labtype: value.lab_type,
                //rows: inputRangesData
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

            const response = await fetch(config.Calibmaster.URL + "/api/instrument-types/edit", requestOptions);
            const data = await response.json();
            console.log(data);

            setError("");
            setloading(false);
            GlobalNotification.success({
                title: 'Instrument Type Updated',
                description: 'The Instrument Type was Updated successfully.',
                duration: 2
            });
            navigate("/dashboard/instrument-types");

        } catch (err) {
            console.log(err);
            GlobalNotification.error({
                title: 'Updated Failed',
                description: err.message || 'Something went wrong!',
                duration: 2
            });
            setloading(false);
        }
    }


    return (
        <>
            <InstrumentVariantForm
                mode="edit"
                form={form}
                onSubmit={saveInstrumentType}
                onGenerateName={CreateFullNameHandler}
                onInstrumentChange={null}
                onAddNewVariantType={null}
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

        </>
    )
}

export default EditInstrumentType;