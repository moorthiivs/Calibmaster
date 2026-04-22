import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Spin, Space, Modal, notification } from 'antd';
import {
    PlusOutlined, DeleteOutlined, RedoOutlined, ArrowLeftOutlined,
    HolderOutlined, CheckOutlined, CloseOutlined, EditOutlined
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import isEqual from 'lodash/isEqual';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks/usePermissions';

const { Option } = Select;
const ITEM_TYPE = 'PARAMETER_ROW';

/* ─────────────────────────────────────────────────────────────────
   InlineParamNameEditor — fully Tailwind
   ───────────────────────────────────────────────────────────────── */
const InlineParamNameEditor = ({ value, index, onConfirm, allParams }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { setDraft(value); }, [value]);

    const startEdit = useCallback((e) => {
        e.stopPropagation();
        setDraft(value);
        setError('');
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [value]);

    const cancel = useCallback(() => {
        setDraft(value);
        setError('');
        setEditing(false);
    }, [value]);

    const validate = useCallback((name) => {
        const trimmed = name.trim();
        if (!trimmed) return 'Parameter name cannot be empty';
        const isDuplicate = allParams.some(
            (p, idx) => idx !== index && p?.parameterName?.toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) return `"${trimmed}" already exists`;
        return '';
    }, [allParams, index]);

    const confirm = useCallback(() => {
        const trimmed = draft.trim();
        const err = validate(trimmed);
        if (err) { setError(err); inputRef.current?.focus(); return; }
        setEditing(false);
        setError('');
        if (trimmed !== value) onConfirm(index, trimmed, value);
    }, [draft, validate, value, index, onConfirm]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirm(); }
        if (e.key === 'Escape') cancel();
    }, [confirm, cancel]);

    const handleChange = useCallback((e) => {
        const v = e.target.value;
        setDraft(v);
        if (error) setError(validate(v));
    }, [error, validate]);

    /* ── View mode ─────────────────────────────────────── */
    if (!editing) {
        return (
            // `group` enables group-hover on the pencil button
            <div className="group inline-flex items-center gap-1 min-w-0 max-w-full">
                <span
                    className="font-semibold text-[13px] text-[#1d2939] whitespace-nowrap overflow-hidden text-ellipsis cursor-default select-none"
                    onDoubleClick={startEdit}
                    title="Double-click or click ✏ to rename"
                >
                    {value || `Parameter ${index + 1}`}
                </span>

                <button
                    type="button"
                    onClick={startEdit}
                    title="Rename parameter"
                    // hidden at rest, revealed on group hover
                    className="
                        inline-flex items-center justify-center
                        bg-transparent border-none p-[2px_4px] rounded
                        cursor-pointer text-[#98a2b3] text-[12px]
                        opacity-0 group-hover:opacity-100
                        transition-all duration-150
                        hover:text-[#1570ef] hover:bg-[#eff4ff]
                        flex-shrink-0
                    "
                >
                    <EditOutlined />
                </button>
            </div>
        );
    }

    /* ── Edit mode ─────────────────────────────────────── */
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            {/* Input row — blue ring normally, red ring on error */}
            <div
                className={`
                    flex items-center gap-1 bg-white rounded-md px-1 py-0.5
                    border-[1.5px] transition-all duration-150
                    ${error
                        ? 'border-[#f04438] shadow-[0_0_0_3px_rgba(240,68,56,0.12)]'
                        : 'border-[#2e90fa] shadow-[0_0_0_3px_rgba(46,144,250,0.15)]'
                    }
                `}
            >
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="
                        flex-1 border-none outline-none bg-transparent
                        font-semibold text-[13px] text-[#1d2939]
                        px-1 py-0.5 min-w-[60px]
                    "
                />

                {/* Confirm ✓ */}
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); confirm(); }}
                    title="Save (Enter)"
                    className="
                        inline-flex items-center justify-center
                        w-[22px] h-[22px] rounded border-none cursor-pointer
                        text-[11px] flex-shrink-0
                        bg-[#ecfdf3] text-[#039855]
                        hover:bg-[#d1fadf]
                        transition-colors duration-100
                    "
                >
                    <CheckOutlined />
                </button>

                {/* Cancel ✗ */}
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); cancel(); }}
                    title="Cancel (Esc)"
                    className="
                        inline-flex items-center justify-center
                        w-[22px] h-[22px] rounded border-none cursor-pointer
                        text-[11px] flex-shrink-0
                        bg-[#fff1f3] text-[#e31b54]
                        hover:bg-[#ffe4e8]
                        transition-colors duration-100
                    "
                >
                    <CloseOutlined />
                </button>
            </div>

            {/* Error message */}
            {/* {error && (
                <span className="text-[11px] text-[#f04438] pl-1.5 leading-snug">
                    {error}
                </span>
            )} */}
            {error && (
                notification.error({
                    message: "Please enter a valid parameter name",
                    description: error,
                })
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────
   DraggableRow — unchanged logic, Tailwind opacity
   ───────────────────────────────────────────────────────────────── */
const DraggableRow = ({ index, moveRow, children }) => {
    const ref = useRef(null);

    const [, drop] = useDrop({
        accept: ITEM_TYPE,
        hover(item, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            const rect = ref.current.getBoundingClientRect();
            const midY = (rect.bottom - rect.top) / 2;
            const clientY = monitor.getClientOffset().y - rect.top;
            if (dragIndex < hoverIndex && clientY < midY) return;
            if (dragIndex > hoverIndex && clientY > midY) return;
            moveRow(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ITEM_TYPE,
        item: { index },
        collect: (m) => ({ isDragging: m.isDragging() }),
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            className={`mb-4 transition-opacity duration-150 ${isDragging ? 'opacity-40' : 'opacity-100'}`}
        >
            {children}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────
   Main Form
   ───────────────────────────────────────────────────────────────── */
const InstrumentVariantForm = ({
    mode = 'create',
    form,
    onSubmit,
    onGenerateName,
    onInstrumentChange,
    onAddNewVariantType,
    isLoading = false,
    instrumentOptions = [],
    uomOptions = [],
    variantTypeOptions = [],
    parameters = [],
    isAddParameterFromModal,
    onOpenAddParameterModal,
    handleAddParameterFromModal,
    newParamName,
    setIsAddParameterFromModal,
    setNewParamName,
    handleRemoveParameter,
    handleChange,
    handleMoveParameter,
    handleRenameParameter,
}) => {
    const [isDirty, setIsDirty] = useState(false);
    const [initialSnapshot, setInitialSnapshot] = useState({});
    const [showSymbols, setShowSymbols] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { hasPermission } = usePermissions();

    const labTypeOptions = ['NABL', 'NON-NABL', 'SERVICE'];
    const CategoryOfItem = ['Variable', 'Attribute'];

    /* ── Sync parameters → form ──────────────────────── */
    useEffect(() => {
        if (!parameters.length) return;

        // Auto-enable symbols if any existing parameter has Symbols or SymbolPos
        const hasSymbolsData = parameters.some(p => p.Symbols && p.SymbolPos);

        if (hasSymbolsData) setShowSymbols(true);

        if (mode === 'edit') {
            const merged = parameters.map((param) => {
                const paramName = Object.keys(param).find(
                    (k) => k !== 'InstrumentUOMID' &&
                        k !== 'InstrumentparameterUOM' &&
                        k !== 'Symbols' &&
                        k !== 'SymbolPos'
                );
                return {
                    parameterName: paramName,
                    value: param[paramName] || '',
                    uom_id: param.InstrumentUOMID || '',
                    Symbols: param.Symbols || '',
                    SymbolPos: param.SymbolPos || 'Prefix'
                };
            });
            form.setFieldsValue({ parameters: merged });
        }
        if (mode === 'create') {
            const existing = form.getFieldValue('parameters') || [];
            const merged = parameters.map((param) => {
                const existingField = existing.find((f) => f?.parameterName === param.Instrumentparametername);
                return {
                    parameterName: param.Instrumentparametername,
                    value: existingField?.value || '',
                    uom_id: existingField?.uom_id || param.InstrumentUOMID || '',
                    Symbols: existingField?.Symbols || param.Symbols || '',
                    SymbolPos: existingField?.SymbolPos || param.SymbolPos || 'Prefix'
                };
            });
            form.setFieldsValue({ parameters: merged });
        }
    }, [parameters]);

    useEffect(() => {
        if (form && parameters.length) setInitialSnapshot(form.getFieldsValue(true));
    }, [form, parameters]);

    /* ── Submit ──────────────────────────────────────── */
    const handleFormSubmit = (values) => {
        const transformedParams = values.parameters.map((param) => {
            const uomLabel = uomOptions.find((u) => u.value === param.uom_id)?.label || '';
            const payload = {
                InstrumentUOMID: param.uom_id,
                InstrumentparameterUOM: uomLabel,
                [param.parameterName]: param.value
            };

            // Add symbols only if showSymbols is true and data exists
            if (showSymbols) {
                if (param.Symbols) payload.Symbols = param.Symbols;
                if (param.SymbolPos) payload.SymbolPos = param.SymbolPos;
            }

            return payload;
        });
        onSubmit({ ...values, parameters: transformedParams });
    };

    /* ── Rename ──────────────────────────────────────── */
    const handleRename = useCallback((index, trimmed, oldName) => {
        const params = form.getFieldValue('parameters') || [];
        params[index] = { ...params[index], parameterName: trimmed };
        form.setFieldsValue({ parameters: params });
        if (handleRenameParameter) handleRenameParameter(index, trimmed, oldName);
        setIsDirty(true);
    }, [form, handleRenameParameter]);

    /* ── Render ──────────────────────────────────────── */
    return (
        <Card
            title={
                <div className="flex items-center gap-2.5">
                    {mode === 'edit' && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/dashboard/instrument-types')}
                        />
                    )}
                    <span>{mode === 'edit' ? 'Edit Instrument Variants' : 'Add Instrument Variants'}</span>
                </div>
            }
        >
            <Spin spinning={isLoading} tip="Loading...">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    autoComplete="off"
                    size="large"
                    onValuesChange={(_, allValues) => {
                        (allValues.parameters || []).forEach((param) => {
                            if (!param?.parameterName) return;
                            const uomLabel = uomOptions.find((u) => u.value === param.uom_id)?.label || '';
                            handleChange(param.parameterName, 'value', param.value);
                            handleChange(param.parameterName, 'uom_id', param.uom_id, uomLabel);
                            if (showSymbols) {
                                handleChange(param.parameterName, 'Symbols', param.Symbols);
                                handleChange(param.parameterName, 'SymbolPos', param.SymbolPos);
                            }
                        });
                        setIsDirty(!isEqual(initialSnapshot, allValues));
                    }}
                >
                    {/* ── Basic Details ─────────────────────── */}
                    <Card title="Instrument Basic Details" variant="borderless">
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Select Instrument"
                                    name="instrument_id"
                                    rules={[{ required: true, message: 'Please select an instrument' }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Choose Instrument"
                                        onChange={onInstrumentChange}
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {instrumentOptions.map((opt) => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Instrument Variant Name" name="instrument_type_spec">
                                            <Select placeholder="Select variant Type">
                                                {CategoryOfItem.map((type) => (
                                                    <Select.Option key={type} value={type}>{type}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label="Lab Type"
                                            name="lab_type"
                                            rules={[{ required: true, message: 'Please select lab type' }]}
                                        >
                                            <Select placeholder="Select Lab Type" allowClear>
                                                {labTypeOptions.map((type) => (
                                                    <Option key={type} value={type}>{type}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    {/* ── Parameters ────────────────────────── */}
                    <Card
                        title="Instrument Parameters"
                        variant="borderless"
                        style={{ marginTop: 5 }}
                        extra={
                            <Button 
                                onClick={() => setShowSymbols(!showSymbols)}
                                size="middle"
                                shape="round"
                              
                            >
                                {showSymbols ? "Symbols Active" : "Enable Symbols"}
                            </Button>
                        }
                    >
                        <DndProvider backend={HTML5Backend}>
                            <Form.List name="parameters">
                                {(fields, { add, remove, move }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => {
                                            const allParams = form.getFieldValue('parameters') || [];
                                            const currentParamName = allParams[index]?.parameterName;

                                            const onRowMove = (from, to) => {
                                                move(from, to);
                                                if (handleMoveParameter) handleMoveParameter(from, to);
                                                setIsDirty(true);
                                            };

                                            return (
                                                <DraggableRow key={key} index={index} moveRow={onRowMove}>
                                                    {/* param-row-card */}
                                                    <div className="
                                                        bg-[#f9fafb] border border-[#e4e7ec] rounded-[10px]
                                                        px-4 py-3
                                                        transition-all duration-150
                                                        hover:border-[#c7d7fd] hover:shadow-sm
                                                    ">
                                                        <Row gutter={12} align="middle" wrap={false}>
                                                            {/* Drag handle */}
                                                            <Col flex="32px">
                                                                <div className="
                                                                    flex items-center cursor-grab
                                                                    text-[#c0c9d9] text-base px-1
                                                                    transition-colors duration-150
                                                                    hover:text-[#667085]
                                                                    active:cursor-grabbing
                                                                ">
                                                                    <HolderOutlined />
                                                                </div>
                                                            </Col>

                                                            {/* Value input */}
                                                            <Col flex="auto" style={{ minWidth: 0 }}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    label={
                                                                        <InlineParamNameEditor
                                                                            value={currentParamName || `Parameter ${index + 1}`}
                                                                            index={index}
                                                                            allParams={allParams}
                                                                            onConfirm={handleRename}
                                                                        />
                                                                    }
                                                                    name={[name, 'value']}
                                                                    rules={[{ required: true, message: 'Value is required' }]}
                                                                    style={{ marginBottom: 0 }}
                                                                >
                                                                    <Input placeholder="Enter value" />
                                                                </Form.Item>
                                                            </Col>

                                                            {/* UOM */}
                                                            <Col style={{ width: showSymbols ? 140 : 180, flexShrink: 0 }}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    label="UOM"
                                                                    name={[name, 'uom_id']}
                                                                    style={{ marginBottom: 0 }}
                                                                >
                                                                    <Select placeholder="Select UOM">
                                                                        {uomOptions.map((uom) => (
                                                                            <Option key={uom.value} value={uom.value}>{uom.label}</Option>
                                                                        ))}
                                                                    </Select>
                                                                </Form.Item>
                                                            </Col>

                                                            {/* Optional Symbols */}
                                                            {showSymbols && (
                                                                <>
                                                                    <Col style={{ width: 100, flexShrink: 0 }}>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            label="Symbol"
                                                                            name={[name, 'Symbols']}
                                                                            style={{ marginBottom: 0 }}
                                                                        >
                                                                            <Input placeholder="e.g. ±" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col style={{ width: 110, flexShrink: 0 }}>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            label="Position"
                                                                            name={[name, 'SymbolPos']}
                                                                            initialValue="Prefix"
                                                                            style={{ marginBottom: 0 }}
                                                                        >
                                                                            <Select placeholder="Position">
                                                                                <Option value="Prefix">Prefix</Option>
                                                                                <Option value="Suffix">Suffix</Option>
                                                                            </Select>
                                                                        </Form.Item>
                                                                    </Col>
                                                                </>
                                                            )}

                                                            {/* Delete */}
                                                            <Col flex="40px" style={{ flexShrink: 0 }}>
                                                                <div className="pt-7">
                                                                    <Button
                                                                        type="text"
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => {
                                                                            setIsDirty(true);
                                                                            remove(index);
                                                                            handleRemoveParameter(index);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </DraggableRow>
                                            );
                                        })}

                                        <Form.Item className="text-center mt-2">
                                            <Button
                                                type="dashed"
                                                onClick={onOpenAddParameterModal}
                                                icon={<PlusOutlined />}
                                            >
                                                Add Custom Parameter
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </DndProvider>
                    </Card>

                    {/* ── Full Name ─────────────────────────── */}
                    <Card title="Instrument Full Name" variant="borderless" style={{ marginTop: 5 }}>
                        <Row gutter={24} align="bottom">
                            <Col flex="auto">
                                <Form.Item
                                    name="instrument_full_name"
                                    label="Instrument Full Name"
                                    rules={[{ required: true, message: 'Please generate or enter the full name' }]}
                                >
                                    <Input.TextArea placeholder="Generated or custom full name" rows={2} />
                                </Form.Item>
                            </Col>
                            <Col>
                                <Form.Item>
                                    <Button icon={<RedoOutlined />} onClick={onGenerateName}>
                                        Generate Name
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* ── Variant Types + Submit ─────────────── */}
                    <Card variant="borderless" style={{ marginTop: 5 }}>
                        <Row gutter={24} align="middle">
                            <Col flex="auto">
                                <Form.Item label="Select Instrument Variant Types" name="type">
                                    <Select
                                        mode={mode === 'edit' ? undefined : 'multiple'}
                                        allowClear
                                        placeholder="Please select types"
                                    >
                                        {variantTypeOptions.map((opt) => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            {hasPermission("CREATE_INSTRUMENT_VARIANT") && (
                                <Col>
                                    <Form.Item label=" ">
                                        <Button
                                            icon={<PlusOutlined />}
                                            onClick={onAddNewVariantType}
                                            disabled={mode === 'edit'}
                                        >
                                            New Type
                                        </Button>
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                        <Form.Item style={{ marginTop: 30 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading}
                                block
                                disabled={mode === 'edit' && !isDirty}
                            >
                                {mode === 'edit' ? 'Update Instrument Variant' : 'Add Instrument Variant'}
                            </Button>
                        </Form.Item>
                    </Card>
                </Form>
            </Spin>

            {/* ── Add Parameter Modal ─────────────────── */}
            <Modal
                title="Add New Parameter"
                open={isAddParameterFromModal}
                onCancel={() => setIsAddParameterFromModal(false)}
                onOk={handleAddParameterFromModal}
                okText="Add"
                okButtonProps={{ disabled: !newParamName.trim() }}
            >
                <Form layout="vertical">
                    <Form.Item help="Note: Enter the name without spaces and without special symbols.">
                        <Input
                            autoFocus
                            value={newParamName}
                            onChange={(e) => setNewParamName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            placeholder="Enter parameter name"
                            onPressEnter={handleAddParameterFromModal}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default InstrumentVariantForm;