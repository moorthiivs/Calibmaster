import React, { useEffect, useState } from "react";
import { Select, Input, Spin, Row, Col, Button, Form, Card, message, Tooltip, Switch, Modal, Radio } from "antd";
import config from "../../../utils/config.json";
import { PlusOutlined, FileTextOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import GlobalNotification from "../../../utils/GlobalNotification";
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
    UOM,
    srfAssignedTo
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

    const [naModalVisible, setNaModalVisible] = useState(false);
    const [activeParamIndex, setActiveParamIndex] = useState(null);
    const [naSelection, setNaSelection] = useState(null);

    const [instrumentlevelUomId, setInstrumentlevelUomId] = useState(null);

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

    const [assignedEngineers, setAssignedEngineers] = useState([]);

    const fetchCalibrationEngineers = async () => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/users/get-calibration-engineers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId }),
            });
            const result = await res.json();
            if (result.status === "SUCCESS") {
                setAssignedEngineers(result.data.map(eng => ({ label: eng.name, value: eng.id })));
            }
        } catch (err) {
            console.error("Failed to fetch engineers", err);
        }
    };

    useEffect(() => {
        fetchCalibrationEngineers();
    }, []);

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
                    uom_id: item.uom_pk_id,
                }));
                setInstrumentOptions(options);
            })
            .catch((err) => {
                console.error("Failed to fetch instrument types", err);
                setInstrumentOptions([]);
            })
            .finally(() => setInstrumentLoading(false));
    }, [form.getFieldValue("labType"), form.getFieldValue("Category")]);

    useEffect(() => {
        if (instrumentlevelUomId) {
            form.setFieldsValue({ instrumentUOM: instrumentlevelUomId });
        }
    }, [instrumentlevelUomId, form]);

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

    const handleNaToggle = (index, checked) => {
        if (checked) {
            setActiveParamIndex(index);
            const currentVal = form.getFieldValue(['parameters', index, 'isNaN']);
            setNaSelection(currentVal && currentVal !== false ? currentVal : 'na');
            setNaModalVisible(true);
        } else {
            const parameters = form.getFieldValue('parameters');
            parameters[index].isNaN = false;
            form.setFieldsValue({ parameters: [...parameters] });
        }
    };



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
                        assignedTo: mode !== "edit" ? srfAssignedTo : undefined,
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
                                                    GlobalNotification.warning({
                                                        title: "No Matching Asset",
                                                        description: "No matching asset found in the database"
                                                    });
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
                                                                // Find matching range in instrument type for fallback symbols
                                                                const typeRange = (apiData.intrument_type?.ranges || []).find(r => r[paramName] !== undefined) || {};

                                                                return {
                                                                    parameterName: paramName || "",
                                                                    value: row[paramName] || "",
                                                                    uom_id: row.InstrumentUOMID || "",
                                                                    Symbols: row.Symbols || typeRange.Symbols || "",
                                                                    SymbolPos: row.SymbolPos || typeRange.SymbolPos || "Prefix",
                                                                    isNaN: row.isNaN || false
                                                                };
                                                            })
                                                            : []
                                                    });
                                                    setInstrument_name(apiData.intrument_type?.instrument?.instrument_name || '');
                                                    setDescription(apiData.intrument_type?.instrument_full_name || apiData.instrument_description);
                                                }
                                            } catch (err) {
                                                console.error("Failed to fetch asset details", err);
                                                GlobalNotification.error({
                                                    title: "Fetch Error",
                                                    description: "Error fetching asset details. Please try again."
                                                });
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
                        <Col xs={24} sm={12} md={12}>
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
                                        setInstrumentlevelUomId(selectedOption.uom_id);

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
                                                    Symbols: rangeItem.Symbols || "",
                                                    SymbolPos: rangeItem.SymbolPos || "",
                                                    isNaN: rangeItem.isNaN || false
                                                }));
                                            }).flat();

                                            setParameters(preparedParams);
                                            form.setFieldsValue({ parameters: preparedParams });
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        {/* Instrument UOM */}
                        <Col xs={24} sm={12} md={4}>
                            <Tooltip title={"Instrument UOM Use Like Parameter {{instrumentUOM}}"}>
                                <Form.Item
                                    label="Instrument UOM"
                                    name="instrumentUOM"
                                    rules={[{ required: true, message: "Please select an Instrument UOM" }]}
                                    initialValue={instrumentlevelUomId}
                                >
                                    <Select placeholder="UOM" >
                                        {UOM.map((uom) => (
                                            <Select.Option key={uom.value} value={uom.value} >
                                                {uom.label}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Tooltip>
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
                                        <Row key={key} gutter={16} style={{ width: '100vw', marginBottom: '0px' }} align="bottom">
                                            <Col xs={24} sm={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label={
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>{form.getFieldValue(['parameters', index, 'parameterName']) || `Param ${index + 1}`}</span>
                                                            <Tooltip title="Toggle N/A or Skip for this parameter on certificate">
                                                                <Form.Item
                                                                    name={[name, 'isNaN']}
                                                                    noStyle
                                                                    initialValue={false}
                                                                    valuePropName="checked"
                                                                    getValueProps={(value) => ({ checked: !!value })}
                                                                >
                                                                    <Switch
                                                                        size="small"
                                                                        onChange={(checked) => handleNaToggle(index, checked)}
                                                                    />
                                                                </Form.Item>
                                                            </Tooltip>
                                                        </div>
                                                    }
                                                    name={[name, 'value']}
                                                    rules={[
                                                        ({ getFieldValue }) => ({
                                                            required: !getFieldValue(['parameters', index, 'isNaN']),
                                                            message: 'Value is required'
                                                        }),
                                                        {
                                                            validator: (_, value) => {
                                                                const paramRaw = form.getFieldValue(["parameters", index, "parameterName"]);

                                                                if (!shouldValidateRange(paramRaw)) {
                                                                    return Promise.resolve();
                                                                }

                                                                if (activeAcceptRanges.length === 0) {
                                                                    return Promise.resolve();
                                                                }

                                                                if (value === "" || value === undefined || value === null) {
                                                                    return Promise.resolve();
                                                                }


                                                                const trimmedValue = value.toString().trim();

                                                                const isValidNumber = /^-?\d+(\.\d+)?$/.test(trimmedValue);
                                                                if (!isValidNumber) {
                                                                    return Promise.reject(
                                                                        new Error("Please enter a valid number")
                                                                    );
                                                                }

                                                                const num = Number(trimmedValue);

                                                                if (!isValueInAnyRange(num, activeAcceptRanges)) {
                                                                    const rangeStr = buildRangeDisplayString(activeAcceptRanges);
                                                                    return Promise.reject(
                                                                        new Error(`Range: ${rangeStr}`)
                                                                    );
                                                                }

                                                                const matchedRange = findMatchingRange(num, activeAcceptRanges);
                                                                if (matchedRange && matchedRange.decimalPlace !== undefined && matchedRange.decimalPlace !== null) {
                                                                    const decimalPart = trimmedValue.split(".")[1];
                                                                    if (decimalPart && decimalPart.length > matchedRange.decimalPlace) {
                                                                        return Promise.reject(
                                                                            new Error(`Max ${matchedRange.decimalPlace} dec.`)
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
                                                                ? `Range: ${buildRangeDisplayString(activeAcceptRanges)}`
                                                                : "Value"
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="UOM"
                                                    name={[name, 'uom_id']}
                                                    rules={[{ required: true, message: 'Select UOM' }]}
                                                >
                                                    <Select placeholder="UOM">
                                                        {UOM.map((uom) => (
                                                            <Select.Option key={uom.value} value={uom.value}>
                                                                {uom.label}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Symbol"
                                                    name={[name, 'Symbols']}
                                                >
                                                    <Input placeholder="e.g. +, -, ±" />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Position"
                                                    name={[name, 'SymbolPos']}
                                                    initialValue="Prefix"
                                                >
                                                    <Select placeholder="Position">
                                                        <Select.Option value="Prefix">Prefix</Select.Option>
                                                        <Select.Option value="Suffix">Suffix</Select.Option>
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
                                <Select
                                    placeholder='Search to Select Make'
                                    showSearch
                                    options={Array.isArray(makes) ? makes.map((v) => ({ value: v.name, label: v.name })) : []}
                                    allowClear
                                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                />
                            </Form.Item>
                        </Col>

                        {/* Model */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item label="Model" name="model" rules={[{ required: true }]} validateTrigger="onChange">
                                <Select
                                    placeholder='Search to Select Model'
                                    showSearch
                                    options={Array.isArray(models) ? models.map((v) => ({ value: v.name, label: v.name })) : []}
                                    allowClear
                                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                />
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
                            <Form.Item label="Next Calibration (in Months)" name="reminderFrequency" initialValue={6}>
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

                        {/* Assigned To */}
                        <Col span={8} xs={24} sm={12} md={8}>
                            <Form.Item
                                label="Assigned To (Calibration Engineer)"
                                name="assignedTo"
                                rules={[{ required: true, message: "Please assign an engineer" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select Calibration Engineer"
                                    options={assignedEngineers}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
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
            <Modal
                title={null}
                open={naModalVisible}
                onCancel={() => {
                    const parameters = form.getFieldValue('parameters');
                    if (activeParamIndex !== null && !parameters[activeParamIndex].isNaN) {
                        parameters[activeParamIndex].isNaN = false;
                        form.setFieldsValue({ parameters: [...parameters] });
                    }
                    setNaModalVisible(false);
                }}
                footer={null}
                centered
                width={500}
                className="rounded-2xl overflow-hidden"
            >
                <div className="p-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Display Settings</h3>
                    <p className="text-gray-500 text-sm mb-6">Configure how this parameter is handled in the final certificate.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Print N/A Option */}
                        <div
                            onClick={() => setNaSelection('na')}
                            className={`relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${naSelection === 'na'
                                ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100'
                                : 'border-gray-100 bg-gray-50/30 hover:border-blue-200 hover:bg-blue-50/20'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${naSelection === 'na' ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 group-hover:text-blue-400'
                                }`}>
                                <FileTextOutlined className="text-lg" />
                            </div>
                            <div className="font-bold text-gray-800 mb-1">Print N/A</div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                The field will remain in the table but display <span className="font-semibold">"N/A"</span> instead of a value.
                            </p>
                            {naSelection === 'na' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* Skip Field Option */}
                        <div
                            onClick={() => setNaSelection('skip')}
                            className={`relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${naSelection === 'skip'
                                ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-100'
                                : 'border-gray-100 bg-gray-50/30 hover:border-orange-200 hover:bg-orange-50/20'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${naSelection === 'skip' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 group-hover:text-orange-400'
                                }`}>
                                <EyeInvisibleOutlined className="text-lg" />
                            </div>
                            <div className="font-bold text-gray-800 mb-1">Skip Field</div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                The row will be <span className="font-semibold text-orange-600">completely removed</span> from the certificate table.
                            </p>
                            {naSelection === 'skip' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                const parameters = form.getFieldValue('parameters');
                                if (activeParamIndex !== null && !parameters[activeParamIndex].isNaN) {
                                    parameters[activeParamIndex].isNaN = false;
                                    form.setFieldsValue({ parameters: [...parameters] });
                                }
                                setNaModalVisible(false);
                            }}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const parameters = form.getFieldValue('parameters');
                                parameters[activeParamIndex].isNaN = naSelection;
                                form.setFieldsValue({ parameters: [...parameters] });
                                setNaModalVisible(false);
                            }}
                            className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg shadow-lg shadow-gray-200 transition-all active:scale-95"
                        >
                            Apply Selection
                        </button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

export default AddItemForm;