import React, { useEffect, useState } from "react";
import { Select, Input, Spin, Row, Col, Button, Form, Card, message, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";

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
    "nogo",
];

const OfflineAddItemForm = ({
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
    
    // Local Master Data Storage
    const [storedAllTypes, setStoredAllTypes] = useState([]);
    const [storedAssets, setStoredAssets] = useState([]);

    const shouldValidateRange = (parameterName) => {
        if (!parameterName) return false;
        const normalized = parameterName.toString().toLowerCase().trim();
        return RANGE_VALIDATED_PARAMS.includes(normalized);
    };

    const normalizeRanges = (rangeData) => {
        if (!rangeData) return [];
        if (Array.isArray(rangeData)) return rangeData;
        return [rangeData];
    };

    const filterEnabledRanges = (rangesArray) => {
        if (!rangesArray || rangesArray.length === 0) return [];
        return rangesArray.filter((range) => {
            if (range.isEnable === undefined || range.isEnable === null) return true;
            return range.isEnable === true;
        });
    };

    const isValueInAnyRange = (num, rangesArray) => {
        return rangesArray.some(range => num >= range.min && num <= range.max);
    };

    const findMatchingRange = (num, rangesArray) => {
        return rangesArray.find(range => num >= range.min && num <= range.max);
    };

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

    // Load Local Master Data
    useEffect(() => {
        const loadLocalData = async () => {
            if (!window.electron?.db) return;
            try {
                const types = await window.electron.db.getMasterData('allInstrument');
                if (types) setStoredAllTypes(types);

                const assets = await window.electron.db.getMasterData('assets');
                if (assets) setStoredAssets(assets);

                const variants = await window.electron.db.getMasterData('variantTypes');
                if (variants) {
                    setvariantTypeOptions(variants.map(v => ({
                        value: v.instrumentVariantsType,
                        label: v.instrumentVariantsType
                    })));
                }
            } catch (err) {
                console.error("Failed to load local master data:", err);
            }
        };
        loadLocalData();
    }, []);

    useEffect(() => {
        if (labType === "NABL") {
            form.setFieldsValue({ calibrationAt: "Metrology Lab" });
        } else {
            form.setFieldsValue({ calibrationAt: undefined });
        }
    }, [labType]);

    // Local Filtering for Instrument Types
    useEffect(() => {
        const { labType: selectedLabType, Category } = form.getFieldsValue();
        const currentTypeId = form.getFieldValue("instrumentType") || form.getFieldValue("intrument_type_id");
        
        if (storedAllTypes.length === 0) {
            console.log("No storedAllTypes found in local DB yet.");
            return;
        }

        setInstrumentLoading(true);
        
        // Match logic: Filtered list + Current instrument (to ensure labels show up in Edit mode)
        const filtered = storedAllTypes.filter(item => {
            const isCurrent = currentTypeId && item.instrument_type_id === currentTypeId;
            if (isCurrent) return true;

            const matchLabType = !selectedLabType || item.labtype === selectedLabType;
            const matchCategory = !Category || (item.instrument_type_spec && item.instrument_type_spec.trim().toLowerCase() === Category.toLowerCase());
            
            return matchLabType && matchCategory;
        });

        console.log(`Offline Filter: Found ${filtered.length} matching instrument types locally.`);

        const options = filtered.map((item, i) => ({
            id: item.instrument_type_id,
            sno: i + 1,
            label: item.instrument_full_name, // Match AntD Select expectation
            name: item.instrument_full_name,
            value: item.instrument_type_id,   // Match AntD Select expectation
            units: item.ins_uom_name,
            inst_name: item.instrument_name,
            Ranges: item.ranges,
            type: item.type,
            AcceptRanges: item.Acceptrange,
        }));
        
        setInstrumentOptions(options);
        setInstrumentLoading(false);
    }, [form.getFieldValue("labType"), form.getFieldValue("Category"), storedAllTypes, form.getFieldValue("instrumentType")]);

    useEffect(() => {
        if (instrumentOptions.length > 0) {
            const currentTypeId = form.getFieldValue("instrumentType") || form.getFieldValue("intrument_type_id");
            console.log("Offline Form: Checking parameters for instrument ID:", currentTypeId);
            
            if (currentTypeId) {
                const selectedOption = instrumentOptions.find(opt => opt.id === currentTypeId);
                if (selectedOption) {
                    setInstrument_name(selectedOption.inst_name);
                    setDescription(selectedOption.name);

                    console.log(`Offline Form: Found instrument type "${selectedOption.name}". Parameters:`, selectedOption.Ranges?.length || 0);

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

                    // Only set parameters if they are not already present (to avoid overwriting user input)
                    const currentParams = form.getFieldValue("parameters");
                    if (selectedOption.Ranges && (!currentParams || currentParams.length === 0)) {
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

                        console.log("Offline Form: Auto-filling parameters:", preparedParams.length);
                        setParameters(preparedParams);
                        form.setFieldsValue({ parameters: preparedParams });
                    }
                }
            }
        }
    }, [instrumentOptions, form.getFieldValue("instrumentType"), form.getFieldValue("intrument_type_id")]);

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

            if (selectedInstrument?.AcceptRanges) {
                const map = {};
                selectedInstrument.AcceptRanges.forEach((r) => {
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
        }
    }, [mode, form, instrumentOptions]);

    const selectedLabType = Form.useWatch("labType", form);

    const activeAcceptRanges = (() => {
        if (!acceptRanges || !selectedLabType) return [];
        const allRanges = normalizeRanges(acceptRanges[selectedLabType]);
        return filterEnabledRanges(allRanges);
    })();

    // Ported Validation logic
    useEffect(() => {
        const params = form.getFieldValue("parameters") || [];
        params.forEach((param, index) => {
            const paramRaw = form.getFieldValue(["parameters", index, "parameterName"]);
            const value = param?.value;

            if (!shouldValidateRange(paramRaw)) return;

            if (activeAcceptRanges.length === 0 || value === undefined || value === "") {
                form.setFields([{ name: ["parameters", index, "value"], errors: [] }]);
                return;
            }

            const num = Number(value);
            if (Number.isNaN(num)) return;

            if (!isValueInAnyRange(num, activeAcceptRanges)) {
                const rangeStr = buildRangeDisplayString(activeAcceptRanges);
                form.setFields([{
                    name: ["parameters", index, "value"],
                    errors: [`Allowed range: ${rangeStr}`],
                }]);
            } else {
                form.setFields([{ name: ["parameters", index, "value"], errors: [] }]);
            }
        });
    }, [activeAcceptRanges, form]);

    return (
        <Card title={mode === "edit" ? "Edit Items (Offline)" : "Add Items (Offline)"} style={{ borderColor: '#faad14' }}>
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
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Lab Type" name="labType" rules={[{ required: true }]}>
                                <Select options={LAB_TYPES.map((lt) => ({ value: lt, label: lt }))} allowClear />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Tooltip title="Enter Asset ID from local database and press Enter">
                                <Form.Item label="ID / Asset Number (Offline)" name="assetId" rules={[{ required: true }]}>
                                    <Input
                                        placeholder="Enter asset ID"
                                        onPressEnter={async (e) => {
                                            e.preventDefault();
                                            const assetId = form.getFieldValue("assetId");
                                            const labT = form.getFieldValue("labType");
                                            if (!assetId || !labT || storedAssets.length === 0) return;

                                            // Local lookup in stored assets
                                            const asset = storedAssets.find(a => 
                                                a.identification_details === assetId && 
                                                a.labtype === labT
                                            );

                                            if (!asset) {
                                                message.warning("No matching asset found in local database");
                                                return;
                                            }

                                            form.setFieldsValue({
                                                Category: asset.intrument_type?.instrument_type_spec?.trim() || asset.category,
                                                instrumentType: asset.intrument_type_id,
                                                make: asset.make,
                                                model: asset.model,
                                                serialNumber: asset.serial_no,
                                                reminderFrequency: asset.reminder_frequency,
                                                reminderDays: asset.reminder_days,
                                                calibrationAt: asset.labtype === "NABL" ? 'Metrology Lab' : asset.calibrationAt,
                                                remarks: asset.remarks || "Others",
                                                parameters: Array.isArray(asset.ranges)
                                                    ? asset.ranges.map((row) => {
                                                        const paramName = Object.keys(row).find(k => !["InstrumentUOMID", "InstrumentparameterUOM", "Symbols", "SymbolPos"].includes(k));
                                                        return {
                                                            parameterName: paramName || "",
                                                            value: row[paramName] || "",
                                                            uom_id: row.InstrumentUOMID || "",
                                                            Symbols: row.Symbols || "",
                                                            SymbolPos: row.SymbolPos || ""
                                                        };
                                                    }) : []
                                            });
                                            setInstrument_name(asset.intrument_type?.instrument?.instrument_name || '');
                                            setDescription(asset.intrument_type?.instrument_full_name || asset.instrument_description);
                                        }}
                                    />
                                </Form.Item>
                            </Tooltip>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Category of Instruments" name="Category">
                                <Select options={INSTRUMENT_VARIANTS.map((v) => ({ value: v, label: v }))} allowClear />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={16}>
                            <Form.Item label="Instrument Name (Local)" name="instrumentType" rules={[{ required: true }]}>
                                <Select
                                    showSearch
                                    placeholder="Search Local Instrument Types"
                                    loading={instrumentLoading}
                                    options={instrumentOptions.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                        ...item,
                                    }))}
                                    allowClear
                                    onChange={(selectedValue, selectedOption) => {
                                        setInstrument_name(selectedOption.inst_name);
                                        setDescription(selectedOption.name);

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
                                        } else {
                                            setAcceptRanges(null);
                                        }

                                        if (selectedOption.Ranges) {
                                            const preparedParams = selectedOption.Ranges.map(rangeItem => {
                                                const keys = Object.keys(rangeItem).filter(k => !["InstrumentUOMID", "InstrumentparameterUOM", "Symbols", "SymbolPos"].includes(k));
                                                return keys.map(k => ({
                                                    parameterName: k,
                                                    value: rangeItem[k],
                                                    uom_id: rangeItem.InstrumentUOMID,
                                                    Symbols: rangeItem.Symbols || "",
                                                    SymbolPos: rangeItem.SymbolPos || ""
                                                }));
                                            }).flat();
                                            form.setFieldsValue({ parameters: preparedParams });
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        {form.getFieldValue("Category") === "Variable" && (
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label="Instrument Type" name="type">
                                    <Select allowClear placeholder="Select variant" options={variantTypeOptions} />
                                </Form.Item>
                            </Col>
                        )}

                        <Form.List name="parameters">
                            {(fields) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <Row key={key} gutter={16} style={{ width: '100%' }}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    {...restField}
                                                    label={form.getFieldValue(['parameters', index, 'parameterName']) || `Parameter ${index + 1}`}
                                                    name={[name, 'value']}
                                                    rules={[
                                                        { required: true, message: 'Value is required' },
                                                        {
                                                            validator: (_, value) => {
                                                                const paramRaw = form.getFieldValue(["parameters", index, "parameterName"]);
                                                                if (!shouldValidateRange(paramRaw)) return Promise.resolve();
                                                                if (activeAcceptRanges.length === 0 || value === "" || value === undefined) return Promise.resolve();

                                                                const trimmedValue = value.toString().trim();
                                                                if (!/^-?\d+(\.\d+)?$/.test(trimmedValue)) return Promise.reject(new Error("Valid number required"));

                                                                const num = Number(trimmedValue);
                                                                if (!isValueInAnyRange(num, activeAcceptRanges)) {
                                                                    return Promise.reject(new Error(`Allowed: ${buildRangeDisplayString(activeAcceptRanges)}`));
                                                                }

                                                                const matchedRange = findMatchingRange(num, activeAcceptRanges);
                                                                if (matchedRange && matchedRange.decimalPlace != null) {
                                                                    const decimalPart = trimmedValue.split(".")[1];
                                                                    if (decimalPart && decimalPart.length > matchedRange.decimalPlace) {
                                                                        return Promise.reject(new Error(`Max decimals: ${matchedRange.decimalPlace}`));
                                                                    }
                                                                }
                                                                return Promise.resolve();
                                                            },
                                                        }
                                                    ]}
                                                >
                                                    <Input placeholder="Enter value" />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    {...restField}
                                                    label="UOM"
                                                    name={[name, 'uom_id']}
                                                    rules={[{ required: true, message: 'Select UOM' }]}
                                                >
                                                    <Select placeholder="Select UOM" options={UOM} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    ))}
                                </>
                            )}
                        </Form.List>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Make" name="make" rules={[{ required: true }]}>
                                <Select showSearch options={makes?.map(v => ({ value: v.name, label: v.name }))} allowClear />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Model" name="model" rules={[{ required: true }]}>
                                <Select showSearch options={models?.map(v => ({ value: v.name, label: v.name }))} allowClear />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Serial Number" name="serialNumber">
                                <Input placeholder="Enter serial number" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Next Calibration (Months)" name="reminderFrequency">
                                <Input type="number" min={0} placeholder="e.g., 6" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Reminder Settings" name="reminderDays">
                                <Select options={CALIBRATION_REMINDER_OPTIONS} />
                            </Form.Item>
                        </Col>

                        {(labType === "NABL" || labType === "NON-NABL") && (
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label="Calibration At" name="calibrationAt" rules={[{ required: true }]}>
                                    <Select options={CALIBRATION_LOCATIONS.map(loc => ({ label: loc, value: loc }))} disabled={labType === "NABL" && mode !== "edit"} />
                                </Form.Item>
                            </Col>
                        )}

                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Condition Of Item" name="remarks" rules={[{ required: true }]}>
                                <Select options={options} placeholder="Select remark" />
                            </Form.Item>
                        </Col>

                        {customRemarksVisible && (
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item label="Custom Condition" name="customRemarks" rules={[{ required: true }]}>
                                    <Input placeholder="Describe condition..." />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    <Row justify="center">
                        <Col>
                            <Form.Item shouldUpdate>
                                {() => {
                                    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                                    return (
                                        <Button type="primary" htmlType="submit" block disabled={hasErrors || (mode === "edit" && !isDirty)}>
                                            {mode === "edit" ? "Update Item" : "Add Item"}
                                        </Button>
                                    );
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </Card>
    );
};

export default OfflineAddItemForm;
