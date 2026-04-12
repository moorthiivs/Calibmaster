import React, { useEffect, useState } from "react";
import { Select, Input, Spin, Row, Col, Button, Form, Card, message, Tooltip } from "antd";
import config from "../../../utils/config.js";
import { PlusOutlined } from "@ant-design/icons";
import CreateInstrumentVariants from "../InstrumentType/InstrumentVariantsType/CreateInstrumentVariants";

const LAB_TYPES = ["NABL", "NON-NABL", "SERVICE"];
const CALIBRATION_LOCATIONS = ["Metrology Lab", "Onsite"];
const CALIBRATION_REMINDER_OPTIONS = [
    { value: 0, label: "No Reminder" },
    { value: "1", label: "1 Reminder 7 days before" },
    { value: "2", label: "2 Reminders 15 days before" }
];

const RANGE_VALIDATED_PARAMS = [
    "rangemin",
    "rangemax",
    "range",
    "go",
    "no go",
    "nogo",
];

const AddItemForm = ({
    mode = "create",
    options = [],
    loading = false,
    onChange,
    auth,
    makes,
    models,
    onSubmit,
    setInstrument_name,
    setDescription,
    form,
    instrumentCategories,
    UOM
}) => {

    const [labType, setLabType] = useState("NABL");
    const [customRemarksVisible, setCustomRemarksVisible] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [instrumentOptions, setInstrumentOptions] = useState([]);
    const [instrumentLoading, setInstrumentLoading] = useState(false);
    const [initialValues, setInitialValues] = useState({});
    const [parameters, setParameters] = useState([]);
    const [acceptRanges, setAcceptRanges] = useState(null);

    const INSTRUMENT_VARIANTS = instrumentCategories || ["Variable", "Attribute"];

    const [variantTypeOptions, setvariantTypeOptions] = useState([]);
    const [isvariantTypeOpen, setisvariantTypeOpen] = useState(false);

    const shouldValidateRange = (parameterName) => {
        if (!parameterName) return false;
        const normalized = parameterName.toString().toLowerCase().trim();
        return RANGE_VALIDATED_PARAMS.includes(normalized);
    };

    // ✅ Normalize accept range data to always return an array
    const normalizeRanges = (rangeData) => {
        if (!rangeData) return [];
        if (Array.isArray(rangeData)) return rangeData;
        return [rangeData];
    };

    // ✅ NEW: Filter ranges to only include enabled ones (isEnable === true)
    // If isEnable is undefined/null, treat as enabled (backward compatibility)
    const filterEnabledRanges = (rangesArray) => {
        if (!rangesArray || rangesArray.length === 0) return [];
        return rangesArray.filter((range) => {
            // If isEnable property doesn't exist, treat as enabled (backward compatibility)
            if (range.isEnable === undefined || range.isEnable === null) return true;
            // Only include if explicitly true
            return range.isEnable === true;
        });
    };

    // ✅ Check if value is within any of the ENABLED ranges
    const isValueInAnyRange = (num, rangesArray) => {
        return rangesArray.some(range => num >= range.min && num <= range.max);
    };

    // ✅ Find the specific range a value falls into (for decimal validation)
    const findMatchingRange = (num, rangesArray) => {
        return rangesArray.find(range => num >= range.min && num <= range.max);
    };

    // ✅ Build display string for all ENABLED ranges
    const buildRangeDisplayString = (rangesArray) => {
        if (!rangesArray || rangesArray.length === 0) return "";
        return rangesArray
            .map(r => `${r.min} – ${r.max} ${r.unitsymbol || r.unit || ""}`.trim())
            .join("  OR  ");
    };

    const handleValuesChange = (changedValues, allValues) => {
        if (changedValues.remarks === "Others") {
            setCustomRemarksVisible(true);
        } else if (changedValues.remarks) {
            setCustomRemarksVisible(false);
        }

        if (changedValues.labType) {
            setLabType(changedValues.labType);
        }

        if (mode === 'edit') {
            const isFormChanged = Object.keys(allValues).some(
                (key) => allValues[key] !== initialValues[key]
            );
            setIsDirty(isFormChanged);
        }

        if (changedValues.instrumentType) {
            const datas = instrumentOptions.find(
                (value) => value.id === changedValues.instrumentType
            );
            if (mode !== "edit" || !allValues.type) {
                form.setFieldsValue({ type: datas?.type || "" });
            }
        }

        if (onChange) onChange(allValues);
    };

    useEffect(() => {
        if (labType === "NABL") {
            form.setFieldsValue({ calibrationAt: "Metrology Lab" });
        } else {
            form.setFieldsValue({ calibrationAt: undefined });
        }
    }, [labType]);

    useEffect(() => {
        const { labType, Category } = form.getFieldsValue();
        if (!labType) return;
        setInstrumentLoading(true);

        fetch(`${config.Calibmaster.URL}/api/instrument-types/filter`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
            },
            body: JSON.stringify({
                labType: labType,
                category: Category || null,
                lab_id: auth.labId
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                const options = data.data.map((item, i) => ({
                    id: item.instrument_type_id,
                    sno: i + 1,
                    name: item.type ? `${item.instrument_full_name}` : item.instrument_full_name,
                    units: item.ins_uom_name,
                    inst_name: item.instrument_name,
                    Ranges: item.ranges,
                    type: item.type,
                    AcceptRanges: item.Acceptrange,
                }));
                setInstrumentOptions(options);
            })
            .catch((err) => {
                console.error("Failed to fetch instrument types", err);
                setInstrumentOptions([]);
            })
            .finally(() => setInstrumentLoading(false));
    }, [form.getFieldValue("labType"), form.getFieldValue("Category")]);

    // ✅ NEW: Auto-load parameters when instrumentOptions are loaded (for programmatic initialization)
    useEffect(() => {
        if (instrumentOptions.length > 0) {
            const currentTypeId = form.getFieldValue("instrumentType");
            if (currentTypeId) {
                const selectedOption = instrumentOptions.find(opt => opt.id === currentTypeId);
                if (selectedOption && (!form.getFieldValue("parameters") || form.getFieldValue("parameters").length === 0)) {
                    // Populate Instrument Name & Description
                    setInstrument_name(selectedOption.inst_name);
                    setDescription(selectedOption.name);

                    // Populate Accept Ranges
                    if (Array.isArray(selectedOption.AcceptRanges)) {
                        const map = {};
                        selectedOption.AcceptRanges.forEach((r) => {
                            if (!map[r.labtype]) map[r.labtype] = [];
                            map[r.labtype].push({
                                min: r.min,
                                max: r.max,
                                unit: r.unit,
                                unitsymbol: r.unitsymbol || r.unit,
                                decimalPlace: r.decimalPlace,
                                isEnable: r.isEnable !== undefined ? r.isEnable : true,
                            });
                        });
                        setAcceptRanges(map);
                    }

                    // Populate Parameters
                    if (selectedOption.Ranges) {
                        const preparedParams = selectedOption.Ranges.map(rangeItem => {
                            const keys = Object.keys(rangeItem).filter(k =>
                                k !== "InstrumentUOMID" &&
                                k !== "InstrumentparameterUOM" &&
                                k !== "Symbols" &&
                                k !== "SymbolPos"
                            );
                            return keys.map(k => ({
                                parameterName: k,
                                value: rangeItem[k],
                                uom_id: rangeItem.InstrumentUOMID,
                                Symbols: rangeItem.Symbols || "",
                                SymbolPos: rangeItem.SymbolPos || ""
                            }));
                        }).flat();

                        setParameters(preparedParams);
                        form.setFieldsValue({ parameters: preparedParams });
                    }
                }
            }
        }
    }, [instrumentOptions]);

    useEffect(() => {
        if (mode === 'edit') {
            const currentValues = form.getFieldsValue();
            setInitialValues(currentValues);
            form.setFieldsValue({
                instrumentType: form.getFieldValue("intrument_type_id"),
            });

            const fieldAcceptRanges = form.getFieldValue("acceptRanges");
            if (fieldAcceptRanges && typeof fieldAcceptRanges === "object") {
                setAcceptRanges(fieldAcceptRanges);
            }

            const selectedInstrument = instrumentOptions.find(
                (opt) => opt.id === form.getFieldValue("intrument_type_id")
            );

            // ✅ CHANGED: Include isEnable in the range object
            if (selectedInstrument?.AcceptRanges) {
                const map = {};
                selectedInstrument.AcceptRanges.forEach((r) => {
                    if (!map[r.labtype]) {
                        map[r.labtype] = [];
                    }
                    map[r.labtype].push({
                        min: r.min,
                        max: r.max,
                        unit: r.unit,
                        unitsymbol: r.unitsymbol || r.unit,
                        decimalPlace: r.decimalPlace,
                        isEnable: r.isEnable !== undefined ? r.isEnable : true, // ✅ preserve isEnable
                    });
                });
                setAcceptRanges(map);
            }
        }
    }, [mode, form, instrumentOptions]);

    const instrumentTypefetch = async () => {
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
                return;
            }

            const data = await response.json();
            const dropdownOptions = [
                ...data.data.map((item) => ({
                    value: item.instrumentVariantsType,
                    label: item.instrumentVariantsType,
                })),
            ];
            setvariantTypeOptions(dropdownOptions);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        instrumentTypefetch();
    }, []);

    const selectedLabType = Form.useWatch("labType", form);

    // ✅ CHANGED: Get ONLY enabled ranges as normalized & filtered array
    const activeAcceptRanges = (() => {
        if (!acceptRanges || !selectedLabType) return [];
        const allRanges = normalizeRanges(acceptRanges[selectedLabType]);
        return filterEnabledRanges(allRanges); // ✅ Only enabled ranges
    })();

    useEffect(() => {
        if (!acceptRanges || !selectedLabType) return;

        if (!acceptRanges[selectedLabType]) {
            const params = form.getFieldValue("parameters") || [];
            params.forEach((_, index) => {
                form.setFields([
                    {
                        name: ["parameters", index, "value"],
                        errors: [],
                    },
                ]);
            });
        }
    }, [selectedLabType]);

    // ✅ Re-validate using ONLY enabled activeAcceptRanges
    useEffect(() => {
        const params = form.getFieldValue("parameters") || [];

        params.forEach((param, index) => {
            const paramRaw = form.getFieldValue(["parameters", index, "parameterName"]);
            const value = param?.value;

            if (!shouldValidateRange(paramRaw)) return;

            // ✅ If no enabled ranges exist, clear errors (no validation needed)
            if (activeAcceptRanges.length === 0 || value === undefined || value === "") {
                form.setFields([
                    {
                        name: ["parameters", index, "value"],
                        errors: [],
                    },
                ]);
                return;
            }

            const num = Number(value);
            if (Number.isNaN(num)) return;

            if (!isValueInAnyRange(num, activeAcceptRanges)) {
                const rangeStr = buildRangeDisplayString(activeAcceptRanges);
                form.setFields([
                    {
                        name: ["parameters", index, "value"],
                        errors: [`Allowed range: ${rangeStr}`],
                    },
                ]);
            } else {
                form.setFields([
                    {
                        name: ["parameters", index, "value"],
                        errors: [],
                    },
                ]);
            }
        });
    }, [activeAcceptRanges, form]);

    return (
        <Card title={mode === "edit" ? "Edit Items" : "Add Items"}>
            <Spin spinning={loading}>
                <Form
                    layout="vertical"
                    form={form}
                    size="large"
                    onValuesChange={handleValuesChange}
                    onFinish={onSubmit}
                    initialValues={{
                        labType: mode !== "edit" ? "NABL" : "",
                        Category: mode !== "edit" ? "Variable" : "",
                        calibrationAt: "Metrology Lab",
                    }}
                    validateTrigger="onChange"
                >
                    <Row gutter={16}>
                        {/* Lab Type */}
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Lab Type" name="labType" rules={[{ required: true }]}>
                                <Select options={LAB_TYPES.map((lt) => ({ value: lt, label: lt }))} allowClear />
                            </Form.Item>
                        </Col>

                        {/* Id / Asset Number */}
                        <Col xs={24} sm={12} md={8}>
                            <Tooltip title="Enter the Asset ID and press Enter to auto-fill instrument details">
                                <Form.Item
                                    label="ID / Asset Number"
                                    name="assetId"
                                    rules={[{ required: true }]}
                                >
                                    <Input
                                        placeholder="Enter asset ID"
                                        onPressEnter={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            const assetId = form.getFieldValue("assetId");
                                            const selectedLabType = form.getFieldValue("labType");

                                            if (!assetId || !selectedLabType) return;

                                            try {
                                                const res = await fetch(`${config.Calibmaster.URL}/api/srf/findbyAssestid`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        Authorization: "Bearer " + auth.token,
                                                    },
                                                    body: JSON.stringify({
                                                        assetId: assetId,
                                                        labType: selectedLabType,
                                                        lab_id: auth.labId
                                                    }),
                                                });

                                                const result = await res.json();

                                                if (!result?.data) {
                                                    message.warning("No matching asset found in the database");
                                                    return;
                                                }

                                                if (result?.data) {
                                                    const apiData = result.data;
                                                    form.setFieldsValue({
                                                        Category: apiData.intrument_type?.instrument_type_spec?.trim() || apiData.category,
                                                        instrumentType: apiData.intrument_type_id,
                                                        make: apiData.make,
                                                        model: apiData.model,
                                                        serialNumber: apiData.serial_no,
                                                        reminderFrequency: apiData.reminder_frequency,
                                                        reminderDays: apiData.reminder_days,
                                                        calibrationAt: labType === "NABL" ? 'Metrology Lab' : apiData.calibrationAt,
                                                        labType: apiData.labtype,
                                                        remarks: apiData.remarks || "Others",
                                                        parameters: Array.isArray(apiData.ranges)
                                                            ? apiData.ranges.map((row) => {
                                                                const paramName = Object.keys(row).find(
                                                                    (key) => key !== "InstrumentUOMID" &&
                                                                        key !== "InstrumentparameterUOM" &&
                                                                        key !== "Symbols" &&
                                                                        key !== "SymbolPos"
                                                                );
                                                                // Fallback to instrument type ranges if item ranges don't have symbols
                                                                const typeRange = apiData.intrument_type?.ranges?.[0] || {}; 
                                                                
                                                                return {
                                                                    parameterName: paramName || "",
                                                                    value: row[paramName] || "",
                                                                    uom_id: row.InstrumentUOMID || "",
                                                                    Symbols: row.Symbols || typeRange.Symbols || "",
                                                                    SymbolPos: row.SymbolPos || typeRange.SymbolPos || ""
                                                                };
                                                            })
                                                            : []
                                                    });
                                                    setInstrument_name(apiData.intrument_type?.instrument?.instrument_name || '');
                                                    setDescription(apiData.intrument_type?.instrument_full_name || apiData.instrument_description);
                                                }
                                            } catch (err) {
                                                console.error("Failed to fetch asset details", err);
                                                message.error("Error fetching asset details. Please try again.");
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Tooltip>
                        </Col>

                        {/* Instrument Variant */}
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Category of Instruments" name="Category">
                                <Select options={INSTRUMENT_VARIANTS.map((v) => ({ value: v, label: v }))} allowClear />
                            </Form.Item>
                        </Col>

                        {/* Instrument Name */}
                        <Col xs={24} sm={12} md={16}>
                            <Form.Item
                                label="Instrument Name"
                                name="instrumentType"
                                rules={[{ required: true, message: "Please select an Instrument Type" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search Instrument Type"
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                    loading={instrumentLoading}
                                    options={instrumentOptions.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                        ...item,
                                    }))}
                                    allowClear
                                    // ✅ CHANGED: Include isEnable when building accept ranges
                                    onChange={(selectedValue, selectedOption) => {
                                        setInstrument_name(selectedOption.inst_name);
                                        setDescription(selectedOption.name);

                                        if (Array.isArray(selectedOption.AcceptRanges)) {
                                            const map = {};
                                            selectedOption.AcceptRanges.forEach((r) => {
                                                if (!map[r.labtype]) {
                                                    map[r.labtype] = [];
                                                }
                                                map[r.labtype].push({
                                                    min: r.min,
                                                    max: r.max,
                                                    unit: r.unit,
                                                    unitsymbol: r.unitsymbol || r.unit,
                                                    decimalPlace: r.decimalPlace,
                                                    isEnable: r.isEnable !== undefined ? r.isEnable : true, // ✅ Include isEnable
                                                });
                                            });

                                            setAcceptRanges((prev) => ({
                                                ...(prev || {}),
                                                ...map,
                                            }));
                                        } else {
                                            setAcceptRanges(null);
                                        }

                                        if (selectedOption.Ranges) {
                                            const preparedParams = selectedOption.Ranges.map(rangeItem => {
                                                const keys = Object.keys(rangeItem).filter(k =>
                                                    k !== "InstrumentUOMID" &&
                                                    k !== "InstrumentparameterUOM" &&
                                                    k !== "Symbols" &&
                                                    k !== "SymbolPos"
                                                );
                                                return keys.map(k => ({
                                                    parameterName: k,
                                                    value: rangeItem[k],
                                                    uom_id: rangeItem.InstrumentUOMID,
                                                    Symbols: rangeItem.Symbols || "",   // Preserve hidden field
                                                    SymbolPos: rangeItem.SymbolPos || "" // Preserve hidden field
                                                }));
                                            }).flat();

                                            setParameters(preparedParams);
                                            form.setFieldsValue({ parameters: preparedParams });
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        {/* Type */}
                        {form.getFieldValue("Category") === "Variable" && (
                            <>
                                <Col xs={14} sm={10} md={4}>
                                    <Form.Item label="Instrument Type" name="type">
                                        <Select allowClear placeholder="Please Instrument Type" showCheckbox>
                                            {variantTypeOptions && variantTypeOptions.map(opt => (
                                                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={2} sm={2} md={4}>
                                    <Form.Item label=" ">
                                        <Button icon={<PlusOutlined />} onClick={() => setisvariantTypeOpen(true)} disabled={mode === "edits"}>
                                            New Type
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        {/* ✅ CHANGED: Validator uses ONLY enabled ranges */}
                        <Form.List name="parameters">
                            {(fields) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <Row key={key} gutter={16} style={{ width: '100%' }}>
                                            <Col xs={24} sm={12} style={{ paddingLeft: "15px" }}>
                                                <Form.Item
                                                    {...restField}
                                                    label={form.getFieldValue(['parameters', index, 'parameterName']) || `Parameter ${index + 1}`}
                                                    name={[name, 'value']}
                                                    rules={[
                                                        { required: true, message: 'Value is required' },
                                                        {
                                                            validator: (_, value) => {
                                                                const paramRaw = form.getFieldValue(["parameters", index, "parameterName"]);

                                                                if (!shouldValidateRange(paramRaw)) {
                                                                    return Promise.resolve();
                                                                }

                                                                // ✅ If no ENABLED ranges exist, skip validation entirely
                                                                // if (activeAcceptRanges.length === 0 || value === "" || value === undefined || value === null) {
                                                                //     return Promise.resolve();
                                                                // }
                                                                if (activeAcceptRanges.length === 0) {
                                                                    return Promise.resolve();
                                                                }

                                                                // Step 3: If value is empty, let required rule handle it
                                                                if (value === "" || value === undefined || value === null) {
                                                                    return Promise.resolve();
                                                                }


                                                                const trimmedValue = value.toString().trim();

                                                                const isValidNumber = /^-?\d+(\.\d+)?$/.test(trimmedValue);
                                                                if (!isValidNumber) {
                                                                    return Promise.reject(
                                                                        new Error("Please enter a valid number (no spaces or special characters)")
                                                                    );
                                                                }

                                                                const num = Number(trimmedValue);

                                                                // ✅ Check if value falls within any ENABLED range only
                                                                if (!isValueInAnyRange(num, activeAcceptRanges)) {
                                                                    const rangeStr = buildRangeDisplayString(activeAcceptRanges);
                                                                    return Promise.reject(
                                                                        new Error(`Value ${trimmedValue} is out of range. Allowed: ${rangeStr}`)
                                                                    );
                                                                }

                                                                // ✅ Decimal check using the MATCHED enabled range's decimalPlace
                                                                const matchedRange = findMatchingRange(num, activeAcceptRanges);
                                                                if (matchedRange && matchedRange.decimalPlace !== undefined && matchedRange.decimalPlace !== null) {
                                                                    const decimalPart = trimmedValue.split(".")[1];
                                                                    if (decimalPart && decimalPart.length > matchedRange.decimalPlace) {
                                                                        return Promise.reject(
                                                                            new Error(`Allowed decimal places: ${matchedRange.decimalPlace}`)
                                                                        );
                                                                    }
                                                                }

                                                                return Promise.resolve();
                                                            },
                                                        }
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder={
                                                            shouldValidateRange(
                                                                form.getFieldValue(["parameters", index, "parameterName"])
                                                            ) && activeAcceptRanges.length > 0
                                                                ? `Allowed: ${buildRangeDisplayString(activeAcceptRanges)}`
                                                                : "Enter value"
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    {...restField}
                                                    label="UOM"
                                                    name={[name, 'uom_id']}
                                                    rules={[{ required: true, message: 'Select UOM' }]}
                                                >
                                                    <Select placeholder="Select UOM">
                                                        {UOM.map((uom) => (
                                                            <Select.Option key={uom.value} value={uom.value}>
                                                                {uom.label}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    ))}
                                </>
                            )}
                        </Form.List>

                        {/* Make */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Make" name="make" rules={[{ required: true }]} validateTrigger="onChange">
                                <Select placeholder='Search to Select Make' showSearch options={makes && makes.map((v) => ({ value: v.name, label: v.name }))} allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                            </Form.Item>
                        </Col>

                        {/* Model */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Model" name="model" rules={[{ required: true }]} validateTrigger="onChange">
                                <Select placeholder='Search to Select Model' showSearch options={models && models.map((v) => ({ value: v.name, label: v.name }))} allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                            </Form.Item>
                        </Col>

                        {/* Serial Number */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Serial Number" name="serialNumber">
                                <Input placeholder="Enter serial number" />
                            </Form.Item>
                        </Col>

                        {/* Frequency in Months */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Next Calibration (in Months)" name="reminderFrequency">
                                <Input type="number" min={0} placeholder="e.g., 6" />
                            </Form.Item>
                        </Col>

                        {/* Calibration Reminder */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Next Calibration Reminder" name="reminderDays">
                                <Select options={CALIBRATION_REMINDER_OPTIONS} getPopupContainer={(triggerNode) => triggerNode.parentNode} />
                            </Form.Item>
                        </Col>

                        {/* Calibration At */}
                        {(labType === "NABL" || labType === "NON-NABL") && (
                            <Col span={8} xs={24} sm={12} md={8}>
                                <Form.Item
                                    label="Calibration At"
                                    name="calibrationAt"
                                    rules={[{ required: true, message: "Please select Calibration At" }]}
                                >
                                    <Select
                                        disabled={labType === "NABL" && mode !== "edit"}
                                        options={CALIBRATION_LOCATIONS.map((loc) => ({
                                            label: loc,
                                            value: loc,
                                        }))}
                                        getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {/* Remarks Dropdown */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item
                                label="Condition Of Item"
                                name="remarks"
                                rules={[{ required: true, message: "Please select a remark" }]}
                            >
                                <Select
                                    options={options}
                                    placeholder="Select remark"
                                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                />
                            </Form.Item>
                        </Col>

                        {/* Custom Remarks */}
                        {customRemarksVisible && (
                            <Col span={8} xs={24} sm={12} md={8}>
                                <Form.Item
                                    label="Enter Condition of DUC"
                                    name="customRemarks"
                                    rules={[{ required: true, message: "Please enter custom remark" }]}
                                >
                                    <Input placeholder="Describe condition..." />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    <Row justify="center">
                        <Col>
                            <Form.Item shouldUpdate>
                                {() => {
                                    const hasErrors = form
                                        .getFieldsError()
                                        .some(({ errors }) => errors.length > 0);

                                    return (
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            disabled={hasErrors || (mode === "edit" && !isDirty)}
                                        >
                                            {mode === "edit" ? "Update Item" : "Add Item"}
                                        </Button>
                                    );
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Spin>

            {isvariantTypeOpen && (
                <CreateInstrumentVariants isOpen={isvariantTypeOpen} onClose={() => setisvariantTypeOpen(false)} fetchData={instrumentTypefetch} />
            )}
        </Card>
    );
};

export default AddItemForm;
