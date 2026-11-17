import React, { useEffect } from "react";
import {
    Form,
    Input,
    Select,
    Button,
    Card,
    Row,
    Col,
    Spin,
    InputNumber,
    Divider,
    Switch,
} from "antd";
import {
    ArrowLeftOutlined,
    PlusOutlined,
    MinusCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const { Option } = Select;

const LAB_TYPES = ["NABL", "NON-NABL", "SERVICE"];

const InstrumentForm = ({
    form,
    mode = "create",
    initialData = {},
    onSubmit,
    isLoading = false,
    error = "",
    uomOptions = [],
    disciplineOptions = [],
    groupOptions = [],
    enableGroup = false,
    onDisciplineChange,
    onAddParameters,
    UOMwithSymbol,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
        }
    }, [initialData, form]);

    const selectedLabTypes = Form.useWatch("labType", form) || [];
    const acceptRanges = Form.useWatch("accept_ranges", form) || {};

    // Check if a specific range is enabled
    const isRangeEnabled = (lab, rangeIndex) => {
        return acceptRanges?.[lab]?.[rangeIndex]?.isEnable ?? true;
    };

    // ✅ CHANGED: Only toggle isEnable flag, DO NOT clear any values
    const handleToggleChange = (lab, rangeIndex, checked) => {
        const currentRanges = form.getFieldValue(["accept_ranges", lab]) || [];

        if (currentRanges[rangeIndex]) {
            // Only update the isEnable flag, preserve all other values
            currentRanges[rangeIndex] = {
                ...currentRanges[rangeIndex],
                isEnable: checked,
            };

            form.setFieldsValue({
                accept_ranges: {
                    ...form.getFieldValue("accept_ranges"),
                    [lab]: currentRanges,
                },
            });

            // ✅ Clear validation errors when disabling
            if (!checked) {
                setTimeout(() => {
                    form.validateFields([
                        ["accept_ranges", lab, rangeIndex, "min"],
                        ["accept_ranges", lab, rangeIndex, "max"],
                        ["accept_ranges", lab, rangeIndex, "unit"],
                        ["accept_ranges", lab, rangeIndex, "decimalPlace"],
                    ]).catch(() => { });
                }, 0);
            }
        }
    };

    return (
        <Card
            title={
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {mode === "edit" && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate("/dashboard/instruments")}
                        />
                    )}
                    <span>
                        {mode === "edit" ? "Edit Instrument" : "Add Instrument"}
                    </span>
                </div>
            }
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={onSubmit}
                autoComplete="off"
                initialValues={{
                    ...initialData,
                    labType: initialData.labType ?? [],
                    accept_ranges: initialData.accept_ranges ?? {},
                }}
                size="large"
            >
                <Row gutter={16}>
                    {/* Left Column */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Instrument Name"
                            name="name"
                            rules={[
                                { required: true, message: "Please enter instrument name" },
                            ]}
                        >
                            <Input placeholder="Enter instrument name" />
                        </Form.Item>

                        <Form.Item
                            label="Select UOM"
                            name="uom"
                            rules={[{ required: true, message: "Please select UOM" }]}
                        >
                            <Select placeholder="Choose UOM">
                                {uomOptions.map((uom) => (
                                    <Option key={uom.value} value={uom.value}>
                                        {uom.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Right Column */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Select Discipline"
                            name="discipline"
                            rules={[
                                { required: true, message: "Please select discipline" },
                            ]}
                        >
                            <Select
                                placeholder="Choose Discipline"
                                onChange={(value) => {
                                    form.setFieldsValue({ discipline: value, group: "" });
                                    onDisciplineChange(value);
                                }}
                            >
                                {disciplineOptions.map((item) => (
                                    <Option key={item.value} value={item.value}>
                                        {item.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Select Group"
                            name="group"
                            rules={[{ required: true, message: "Please select group" }]}
                        >
                            <Select placeholder="Choose Group" disabled={enableGroup}>
                                {groupOptions.map((grp, idx) => (
                                    <Option key={idx} value={grp.value}>
                                        {grp.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                {/* LAB TYPE MULTI SELECT */}
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lab Type"
                            name="labType"
                            rules={[{ required: true }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select Lab Types"
                                options={LAB_TYPES.map((lt) => ({
                                    value: lt,
                                    label: lt,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* DYNAMIC ACCEPT RANGE SECTIONS */}
                {selectedLabTypes.map((lab) => (
                    <div key={lab}>
                        <Divider orientation="left">{lab} Accept Ranges</Divider>

                        <Form.List name={["accept_ranges", lab]}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => {
                                        const enabled = isRangeEnabled(lab, name);

                                        return (
                                            <Card
                                                key={key}
                                                size="small"
                                                style={{
                                                    marginBottom: 16,
                                                    background: enabled ? "#fafafa" : "#fff7e6",
                                                    border: enabled
                                                        ? "1px dashed #d9d9d9"
                                                        : "1px dashed #faad14",
                                                    borderRadius: 8,
                                                    opacity: enabled ? 1 : 0.65,
                                                    transition: "all 0.3s ease",
                                                    position: "relative",
                                                }}
                                                title={
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                textDecoration: !enabled
                                                                    ? "line-through"
                                                                    : "none",
                                                                color: !enabled
                                                                    ? "#999"
                                                                    : "inherit",
                                                            }}
                                                        >
                                                            {`Range ${name + 1}`}
                                                        </span>

                                                        {/* ✅ Disabled badge indicator */}
                                                        {!enabled && (
                                                            <span
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: "#faad14",
                                                                    background: "#fffbe6",
                                                                    border: "1px solid #ffe58f",
                                                                    borderRadius: 4,
                                                                    padding: "1px 8px",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                Temporarily Disabled
                                                            </span>
                                                        )}

                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "isEnable"]}
                                                            valuePropName="checked"
                                                            noStyle
                                                            initialValue={true}
                                                        >
                                                            <Switch
                                                                checkedChildren="Active"
                                                                unCheckedChildren="Paused"
                                                                onChange={(checked) =>
                                                                    handleToggleChange(
                                                                        lab,
                                                                        name,
                                                                        checked
                                                                    )
                                                                }
                                                                style={{
                                                                    backgroundColor: enabled
                                                                        ? "#52c41a"
                                                                        : "#faad14",
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </div>
                                                }
                                                extra={
                                                    fields.length > 1 ? (
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<MinusCircleOutlined />}
                                                            onClick={() => remove(name)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    ) : null
                                                }
                                            >
                                                {/* ✅ Overlay message when disabled */}
                                                {!enabled && (
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            color: "#faad14",
                                                            fontSize: 12,
                                                            marginBottom: 8,
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        This range is temporarily disabled. Values
                                                        are preserved and will be used when
                                                        re-enabled.
                                                    </div>
                                                )}

                                                <Row gutter={24}>
                                                    {/* Accept Range Min */}
                                                    <Col xs={24} sm={6}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={
                                                                <span
                                                                    style={{
                                                                        color: !enabled
                                                                            ? "#999"
                                                                            : "inherit",
                                                                    }}
                                                                >
                                                                    Accept Range Min
                                                                </span>
                                                            }
                                                            name={[name, "min"]}
                                                            rules={
                                                                enabled
                                                                    ? [
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                "Min is required",
                                                                        },
                                                                    ]
                                                                    : []
                                                            }
                                                        >
                                                            <InputNumber
                                                                min={0}
                                                                style={{
                                                                    width: "100%",
                                                                    backgroundColor: enabled
                                                                        ? "#fff"
                                                                        : "#f5f5f5",
                                                                    color: !enabled
                                                                        ? "#999"
                                                                        : "inherit",
                                                                }}
                                                                placeholder="Min"
                                                                disabled={!enabled}
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Accept Range Max */}
                                                    <Col xs={24} sm={6}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={
                                                                <span
                                                                    style={{
                                                                        color: !enabled
                                                                            ? "#999"
                                                                            : "inherit",
                                                                    }}
                                                                >
                                                                    Accept Range Max
                                                                </span>
                                                            }
                                                            name={[name, "max"]}
                                                            rules={
                                                                enabled
                                                                    ? [
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                "Max is required",
                                                                        },
                                                                        ({
                                                                            getFieldValue,
                                                                        }) => ({
                                                                            validator(
                                                                                _,
                                                                                value
                                                                            ) {
                                                                                const min =
                                                                                    getFieldValue(
                                                                                        [
                                                                                            "accept_ranges",
                                                                                            lab,
                                                                                            name,
                                                                                            "min",
                                                                                        ]
                                                                                    );
                                                                                if (
                                                                                    value !==
                                                                                    undefined &&
                                                                                    value !==
                                                                                    null &&
                                                                                    min !==
                                                                                    undefined &&
                                                                                    min !==
                                                                                    null &&
                                                                                    value <=
                                                                                    min
                                                                                ) {
                                                                                    return Promise.reject(
                                                                                        new Error(
                                                                                            "Max must be greater than Min"
                                                                                        )
                                                                                    );
                                                                                }
                                                                                return Promise.resolve();
                                                                            },
                                                                        }),
                                                                    ]
                                                                    : []
                                                            }
                                                        >
                                                            <InputNumber
                                                                min={0}
                                                                style={{
                                                                    width: "100%",
                                                                    backgroundColor: enabled
                                                                        ? "#fff"
                                                                        : "#f5f5f5",
                                                                    color: !enabled
                                                                        ? "#999"
                                                                        : "inherit",
                                                                }}
                                                                placeholder="Max"
                                                                disabled={!enabled}
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Unit */}
                                                    <Col xs={24} sm={6}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={
                                                                <span
                                                                    style={{
                                                                        color: !enabled
                                                                            ? "#999"
                                                                            : "inherit",
                                                                    }}
                                                                >
                                                                    Unit
                                                                </span>
                                                            }
                                                            name={[name, "unit"]}
                                                            rules={
                                                                enabled
                                                                    ? [
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                "Unit is required",
                                                                        },
                                                                    ]
                                                                    : []
                                                            }
                                                        >
                                                            <Select
                                                                placeholder="Select Unit"
                                                                disabled={!enabled}
                                                            >
                                                                {UOMwithSymbol.map((uom) => (
                                                                    <Option
                                                                        key={uom.value}
                                                                        value={uom.value}
                                                                    >
                                                                        {uom.label}
                                                                    </Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Decimal Place */}
                                                    <Col xs={24} sm={6}>
                                                        <Form.Item
                                                            {...restField}
                                                            label={
                                                                <span
                                                                    style={{
                                                                        color: !enabled
                                                                            ? "#999"
                                                                            : "inherit",
                                                                    }}
                                                                >
                                                                    Decimal Place
                                                                </span>
                                                            }
                                                            name={[name, "decimalPlace"]}
                                                            rules={
                                                                enabled
                                                                    ? [
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                "Select decimal place",
                                                                        },
                                                                    ]
                                                                    : []
                                                            }
                                                        >
                                                            <Select
                                                                placeholder="Select"
                                                                disabled={!enabled}
                                                            >
                                                                {[1, 2, 3, 4, 5].map((d) => (
                                                                    <Option key={d} value={d}>
                                                                        {d}
                                                                    </Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        );
                                    })}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add({ isEnable: true })}
                                            block
                                            icon={<PlusOutlined />}
                                            style={{ marginBottom: 16 }}
                                        >
                                            Add {lab} Range
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </div>
                ))}

                {/* Parameter Button */}
                <Row style={{ display: mode === "edit" ? "none" : "block" }}>
                    <Col span={24}>
                        <Form.Item>
                            <Button
                                icon={<PlusOutlined />}
                                onClick={onAddParameters}
                                type="dashed"
                                block
                            >
                                Add Instrument Parameters
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>

                {/* Error Message */}
                {error && (
                    <Row>
                        <Col span={24}>
                            <p style={{ color: "red", textAlign: "center" }}>{error}</p>
                        </Col>
                    </Row>
                )}

                {/* Submit */}
                <Row>
                    <Col span={24}>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                {mode === "edit" ? "Update Instrument" : "Add Instrument"}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            {isLoading && (
                <div style={{ textAlign: "center" }}>
                    <Spin />
                </div>
            )}
        </Card>
    );
};

export default InstrumentForm;