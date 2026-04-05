import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner, Input, Select, Button, Textarea, ButtonIcon, MultiSelect, Option } from 'react-rainbow-components';
import "./style.css";
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import { useDispatch, useSelector } from 'react-redux';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from '../../../context/auth-context';
import { sidebarActions } from '../../../store/sidebar';
import { populateUomData, populateDisciplineData, populateGroupData, populateInstrumentData } from './HelperFunction';
import { instrumentNameActions } from '../../../store/instrumentName';
import { CheckboxGroup } from 'react-rainbow-components';
import Loader from '../../UI/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import CreateInstrumentVariants from './InstrumentVariantsType/CreateInstrumentVariants';
import showConfirmationDialog from '../../../utils/showConfirmationToast';
import showErrorDialog from '../../../utils/showErrorToast';


const Type_options = [
    { value: 'Analog', label: 'Analog' },
    { value: 'Digital', label: 'Digital' }
];

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

    const [instrument_full_name, setinstrument_full_name] = useState("")

    const [rows, setRows] = useState([
        {
            rangeMin: "",
            rangeMax: "",
            rangeUom: "",
            rangeUomname: "",
            lc: "",
            lcUOM: "",
            lcUOMname: "",
            size: "",
            sizeUom: "",
            sizeUomname: ""
        }
    ]);




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

    const [instrumentErr, setInstrumentErr] = useState("");
    const [instrumentFullNameErr, setInstrumentFullNameErr] = useState("");

    const [isOpen, setisOpen] = useState(false)

    const [instrument_variant_type, setinstrument_variant_type] = useState([])

    const [instrument_full_name_type, setinstrument_full_name_type] = useState([])

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
    }, [isOpen]);


    // const CreateFullNameHandler = () => {
    //     let createValue = "";

    //     if (fullName.name) {
    //         createValue = fullName.name + " ";
    //     }
    //     if (fullName.rangeMin && fullName.rangeMax && fullName.rangeUom && fullName.rangeUom != "Select") {
    //         createValue = createValue + fullName.rangeMin + "-" + fullName.rangeMax + " " + fullName.rangeUom;
    //     }
    //     console.log(createValue);
    //     if (fullName.lc && fullName.lcUOM && fullName.lcUOM != "Select") {
    //         createValue = createValue + " LC " + fullName.lc + " " + fullName.lcUOM;
    //     }
    //     if (fullName.size && fullName.sizeUom && fullName.sizeUom != "Select") {
    //         createValue = createValue + " Size " + fullName.size + " " + fullName.sizeUom;
    //     }

    //     setCustomFullName(createValue);
    //     return;
    // }

    const handleInputChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    const addNewRow = () => {
        setRows([
            ...rows,
            {
                rangeMin: "",
                rangeMax: "",
                rangeUom: "",
                lc: "",
                lcUOM: "",
                size: "",
                sizeUom: ""
            }
        ]);
    };


    const deleteRow = async (index) => {
        const isRowEmpty = (row) => {
            // Check if all relevant fields in the row are empty
            return (
                !row.rangeMin &&
                !row.rangeMax &&
                (!row.rangeUom || row.rangeUom === "Select") &&
                !row.lc &&
                (!row.lcUOM || row.lcUOM === "Select") &&
                !row.size &&
                (!row.sizeUom || row.sizeUom === "Select")
            );
        };

        // Prevent deletion of the default row (index 0)
        if (index === 0) {
            alert("Default row cannot be deleted.");
            return;
        }

        if (isRowEmpty(rows[index])) {
            // If the row is empty, directly delete it without confirmation
            const updatedRows = rows.filter((_, i) => i !== index);
            setRows(updatedRows);

            // Regenerate the full name based on the updated rows
            const regenerateFullName = () => {
                let createValue = "";

                updatedRows.forEach((row, index) => {
                    let rowValue = "";

                    if (index === 0 && instrument_full_name) {
                        rowValue = instrument_full_name + " ";
                    }
                    if (row.rangeMin && row.rangeMax && row.rangeUom && row.rangeUomname !== "Select") {
                        rowValue = rowValue + row.rangeMin + "-" + row.rangeMax + " " + row.rangeUomname;
                    }
                    if (row.lc && row.lcUOM && row.lcUOMname !== "Select") {
                        rowValue = rowValue + " LC " + row.lc + " " + row.lcUOMname;
                    }
                    if (row.size && row.sizeUom && row.sizeUomname !== "Select") {
                        rowValue = rowValue + " Size " + row.size + " " + row.sizeUomname;
                    }

                    // Add row value to createValue, separated by commas
                    if (rowValue) {
                        if (createValue) {
                            createValue += ", "; // Add comma separator
                        }
                        createValue += rowValue;
                    }
                });

                return createValue;
            };

            // Update the customFullName state
            setCustomFullName(regenerateFullName());
        } else {
            const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

            if (!confirmDelete) {
                console.log("Cancel Delete!");
                return;
            }
            const updatedRows = rows.filter((_, i) => i !== index);
            setRows(updatedRows);

            // Regenerate the full name based on the updated rows
            const regenerateFullName = () => {
                let createValue = "";

                updatedRows.forEach((row, index) => {
                    let rowValue = "";

                    if (index === 0 && instrument_full_name) {
                        rowValue = instrument_full_name + " ";
                    }
                    if (row.rangeMin && row.rangeMax && row.rangeUom && row.rangeUomname !== "Select") {
                        rowValue = rowValue + row.rangeMin + "-" + row.rangeMax + " " + row.rangeUomname;
                    }
                    if (row.lc && row.lcUOM && row.lcUOMname !== "Select") {
                        rowValue = rowValue + " LC " + row.lc + " " + row.lcUOMname;
                    }
                    if (row.size && row.sizeUom && row.sizeUomname !== "Select") {
                        rowValue = rowValue + " Size " + row.size + " " + row.sizeUomname;
                    }

                    // Add row value to createValue, separated by commas
                    if (rowValue) {
                        if (createValue) {
                            createValue += ", "; // Add comma separator
                        }
                        createValue += rowValue;
                    }
                });

                return createValue;
            };

            // Update the customFullName state
            setCustomFullName(regenerateFullName());
        }

    };

    const CreateFullNameHandler = () => {

        if (!instrumentValue) {
            setInstrumentErr("Please select a Instrument")
            showErrorDialog('Warning', "Please select a Instrument", "warning")
            return;
        }

        if (type.length === 0) {
            showErrorDialog('Warning', "Please Select One Instrument Variant Types", "warning")
            return
        }
        let createValue = "";

        rows.forEach((row, index) => {
            let rowValue = "";

            if (index === 0 && instrument_full_name) {
                rowValue = instrument_full_name + " ";
            }
            if (row.rangeMin && row.rangeMax && row.rangeUom && row.rangeUomname !== "Select") {
                rowValue = rowValue + row.rangeMin + "-" + row.rangeMax + " " + row.rangeUomname;
            }
            if (row.lc && row.lcUOM && row.lcUOMname !== "Select") {
                rowValue = rowValue + " LC " + row.lc + " " + row.lcUOMname;
            }
            if (row.size && row.sizeUom && row.sizeUomname !== "Select") {
                rowValue = rowValue + " Size " + row.size + " " + row.sizeUomname;
            }
            // if (type[index]) {
            //     rowValue += " Type - " + type[index];
            // }
            // Add row value to createValue, separated by commas
            if (rowValue) {
                if (createValue) {
                    createValue += ", "; // Add comma separator
                }
                createValue += rowValue;
            }
        });

        setCustomFullName(createValue);
        GenerateFullnameType(createValue)
        return;
    };


    const GenerateFullnameType = (params) => {
        if (!type || type.length === 0) {
            setinstrument_full_name_type([]);
            return;
        }

        const fullname = type.map((types) => `${params} Type-${types}`);

        setinstrument_full_name_type(fullname);
    };



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

            const response = await fetch(`${config.Calibmaster.URL}/api/instrumentvariantstype/fetch`, requestOptions);

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


    const addInstrumentType = async () => {
        setloading(true);

        if (!instrumentValue) {
            setInstrumentErr("Please select a Instrument")
            setloading(false);
            return;
        }
        if (!customFullName) {
            setInstrumentFullNameErr("Please Enter Instrument Full Name")
            setloading(false);
            return;
        }

        try {

            const newInstrumentType = {
                instrument_id: instrumentValue,
                instrument_full_name: customFullName,
                instrument_type_spec: instrumentTypeSpec,
                range_minimum: rangeMinimum,
                range_minimum_uom_id: rangeMinimumUOMId,
                range_maximum: rangeMaximum,
                range_maximum_uom_id: rangeMaximumUOMId,
                least_count: leastCount,
                least_count_uom_id: leastCountUOMId,
                size_spec: sizeSpec,
                size_spec_uom_id: sizeSpecUomId,
                type,
                lab_id: auth.labId,
                rows

            }

            console.log(newInstrumentType);

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

            const newNotification = {
                title: "Instrument Type Created Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            dispatch(sidebarActions.changesidebar("List-Instrument-Type"));

        } catch (err) {
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

    const containerStyles = {
        maxWidth: 400,
    };


    return (
        <div className="masterlist">
            <div className="add__masterlist__container">

                <Card className="add__user__cards">

                    <div className="add__user__label">
                        <h3>Add Instrument Variants</h3>
                    </div>


                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <div >
                            <Select
                                label="Select Instrument"
                                options={instrument}
                                required={true}
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                onChange={async (e) => {
                                    setInstrumentValue(e.target.value);
                                    let index = e.target.selectedIndex;
                                    let thisValue = e.target[index].innerText;
                                    let updatedValue = { name: thisValue };
                                    setinstrument_full_name(thisValue)
                                    setFullName((shopCart) => ({
                                        ...shopCart,
                                        ...updatedValue
                                    }));

                                    dispatch(instrumentNameActions.changeInstrumentName(fullName));
                                    setInstrumentErr("");
                                }}
                            />
                            <span className="red">{instrumentErr}</span>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                            <Input
                                label="Instrument Variants"
                                placeholder="Instrument Variants"
                                type="text"
                                onChange={(e) => setInstrumentTypeSpec(e.target.value)}
                                disabled={false}
                            />
                        </div>

                    </div>


                    {/* 
                    <div className="add__user__form">
                        <div className="add__user__item">
                            <Input
                                label="Instrument Variants"
                                placeholder="Instrument Variants"
                                type="text"
                                onChange={(e) => setInstrumentTypeSpec(e.target.value)}
                                disabled={false}
                            />
                        </div>
                    </div> */}

                    {rows.map((row, index) => (
                        <div key={index} className="add__range__form">
                            <div className="add__user__item">
                                <Input
                                    label="Range Minimum"
                                    placeholder="Range Minimum"
                                    type="number"
                                    value={row.rangeMin}
                                    onChange={(e) =>
                                        handleInputChange(index, "rangeMin", e.target.value)
                                    }
                                    borderRadius="semi-rounded"
                                />
                            </div>

                            <div className="add__user__item">
                                <Input
                                    label="Range Maximum"
                                    placeholder="Range Maximum"
                                    type="number"
                                    value={row.rangeMax}
                                    onChange={(e) =>
                                        handleInputChange(index, "rangeMax", e.target.value)
                                    }
                                    borderRadius="semi-rounded"
                                />
                            </div>

                            <div className="add__user__item">
                                <Select
                                    label="Select UOM"
                                    options={UOM}
                                    value={row.rangeUom}
                                    onChange={(e) => {
                                        let selectedIndex = e.target.selectedIndex;
                                        let selectedValue = e.target[selectedIndex].innerText;
                                        handleInputChange(index, "rangeUomname", selectedValue);
                                        handleInputChange(index, "rangeUom", e.target.value);
                                    }}
                                    borderRadius="semi-rounded"
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="add__user__item">
                                <Input
                                    label="Least Count"
                                    placeholder="Least Count"
                                    type="number"
                                    value={row.lc}
                                    onChange={(e) =>
                                        handleInputChange(index, "lc", e.target.value)
                                    }
                                    borderRadius="semi-rounded"

                                />
                            </div>

                            <div className="add__user__item">
                                <Select
                                    label="Select UOM"
                                    options={UOM}
                                    value={row.lcUOM}
                                    onChange={(e) => {
                                        let selectedIndex = e.target.selectedIndex;
                                        let selectedValue = e.target[selectedIndex].innerText;
                                        handleInputChange(index, "lcUOMname", selectedValue)
                                        handleInputChange(index, "lcUOM", e.target.value)
                                    }}
                                    borderRadius="semi-rounded"
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="add__user__item">
                                <Input
                                    label="Size"
                                    placeholder="Size"
                                    type="number"
                                    value={row.size}
                                    onChange={(e) =>
                                        handleInputChange(index, "size", e.target.value)
                                    }
                                    borderRadius="semi-rounded"

                                />
                            </div>

                            <div className="add__user__item">
                                <Select
                                    label="Select UOM"
                                    options={UOM}
                                    value={row.sizeUom}
                                    onChange={(e) => {
                                        let selectedIndex = e.target.selectedIndex;
                                        let selectedValue = e.target[selectedIndex].innerText;
                                        handleInputChange(index, "sizeUomname", selectedValue)
                                        handleInputChange(index, "sizeUom", e.target.value)
                                    }}
                                    borderRadius="semi-rounded"
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="plus-button-container">
                                <button
                                    className="plus-button"
                                    onClick={() => addNewRow()}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>

                                <button
                                    className="delete-button"
                                    onClick={() => deleteRow(index)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Type Checkbox Start */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", }}>


                        {/* <CheckboxGroup
                            id="checkbox-group-1"
                            label="Type"
                            options={Type_options}
                            value={type}
                            onChange={(v) => { setType(v) }}
                            orientation="horizontal"
                        /> */}
                        <MultiSelect
                            id="multiselect-component-1"
                            label="Select Instrument Variant Types"
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            value={instrument_variant_type.filter(option => type.includes(option.value)).map(option => ({
                                label: option.label,
                                name: option.value
                            }))}
                            onChange={(selected) => {
                                const selectedNames = selected.map(item => item.name);
                                setType(selectedNames);
                            }}
                            bottomHelpText="You can select several options"
                            enableSearch
                            style={containerStyles}
                            showCheckbox
                            required={true}
                        >
                            {instrument_variant_type.map((option, index) => (
                                <Option key={index} name={option.value} label={option.label} />
                            ))}
                        </MultiSelect>


                        <div className='rainbow-p-right_large' style={{ marginTop: '0px' }}>
                            <ButtonIcon
                                variant='border-filled'
                                size='medium'
                                tooltip='Add New Instrument Type'
                                icon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={() => setisOpen(true)}

                            />
                        </div>


                        <div style={{ width: "auto", }}>
                            <Button
                                label="Generate Name"
                                className="rainbow-m-around_medium"
                                variant="outline-brand"
                                onClick={async () => {
                                    CreateFullNameHandler();
                                }}
                            />
                        </div>



                    </div>
                    {/* Type Checkbox End */}


                    {/* <div style={{ display: "flex", width: "100%", gap: "10px", margin: "20px" }}>

                        <div style={{ width: "80%" }}>
                            <Input
                                label="Instrument Full Name"
                                placeholder={"Instrument Full Name"}
                                type="text"
                                disabled={true}
                                required={true}
                                value={customFullName}
                                onChange={(e) => {
                                    setCustomFullName(e.target.value);
                                    setInstrumentFullNameErr("");
                                }}
                                //readOnly={true}
                                className="rainbow-p-around_medium add__srf__item"
                                borderRadius="semi-rounded"
                            />
                            <span className="red">{instrumentFullNameErr}</span>
                        </div>

                        <div style={{ width: "auto", marginTop: "22px" }}>
                            <Button
                                label="Generate Name"
                                className="rainbow-m-around_medium"
                                variant="outline-brand"
                                onClick={async () => {
                                    CreateFullNameHandler();
                                }}
                            />
                        </div>
                    </div> */}


                    <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>

                        {instrument_full_name_type.map((item, index) => (
                            <div style={{ width: "90%" }}>
                                <Input
                                    label="Instrument Full Name"
                                    placeholder={"Instrument Full Name"}
                                    type="text"
                                    disabled={true}
                                    required={true}
                                    value={item}
                                    onChange={(e) => {
                                        setCustomFullName(e.target.value);
                                        setInstrumentFullNameErr("");
                                    }}
                                    //readOnly={true}
                                    className="rainbow-p-around_medium add__srf__item"
                                    borderRadius="semi-rounded"
                                />
                                <span className="red">{instrumentFullNameErr}</span>
                            </div>
                        ))}



                    </div>




                    {/* Submit Button Start */}
                    <div className="add__user__item">
                        <CustomButton
                            label="Add Instrument Type"
                            variant="success"
                            onclick={addInstrumentType}
                        />
                    </div>
                    {/* Submit Button End */}

                    <p className="red center w100">{error}</p>

                    {(loading) ? <Loader /> : ""}

                </Card>

                {isOpen && (
                    <CreateInstrumentVariants isOpen={isOpen} onClose={() => setisOpen(false)} />
                )}


            </div>
        </div>
    )
}

export default CreateInstrumentType;