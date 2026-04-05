import { Card, Col, Form, Row, Spin, Input, Select, InputNumber, Button, message } from 'antd';
import RemarksCard from '../DefineProcedure/RemarksCard';
import { useEffect, useState } from 'react';
import AddMasterEquipments from '../DefineProcedure/MasterEquipments/AddMasterEquipments';
import ListMasterEquipments from '../DefineProcedure/MasterEquipments/ListMasterEquipments';

const renderInputField = (key) => {
    switch (key) {
        case 'isAtmosphericPressure':
            return (
                <Form.Item
                    label="Atmospheric Pressure"
                    name="AtmosphericPressure"
                >
                    <Input placeholder="Atmospheric Pressure" />
                </Form.Item>
            );

        case 'isFrequency':
            return (
                <Form.Item
                    label="Frequency"
                    name="Frequency"
                >
                    <Input placeholder="Frequency" />
                </Form.Item>
            );

        default:
            return null;
    }
};


function DefineProcedureForm({
    mode = "create",
    initialData = {},
    onSubmit,
    alldocformat,
    instrumentList,
    diciplineParameters,
    handleselect,
    masterList,
    addEquipmets,
    setAddEquipmets,
    masterListError,
    setMasterListError,
    remarks,
    addRemarksHandler,
    remarkChangeHandler,
    deleteRemarkHandler,
    isLoading = false,
}) {

    const [form] = Form.useForm();


    const updateMean = (field) => {
        const values = form.getFieldValue(field) || {};
        const nums = [values.start, values.middle, values.end].filter(Boolean);

        if (nums.length === 0) {
            form.setFieldsValue({ [field]: { ...values, mean: '' } });
            return;
        }

        // Determine max decimal places
        const maxDecimals = nums.reduce((max, num) => {
            const decimals = (num.toString().split('.')[1] || '').length;
            return Math.max(max, decimals);
        }, 0);

        const sum = nums.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
        const mean = (sum / nums.length).toFixed(maxDecimals);

        form.setFieldsValue({ [field]: { ...values, mean } });
    };



    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                calibrationProcedure: initialData.calibrationProcedure || '',
                refStd: initialData.refStd || '',
                validity: initialData.validity || '',
                traceability: initialData.traceability || '',
                documentFormat: initialData.documentFormat || '',
                instrument: initialData.instrument || '',
                temperature: {
                    start: initialData.temperature?.start || '',
                    middle: initialData.temperature?.middle || '',
                    end: initialData.temperature?.end || '',
                    mean: initialData.temperature?.mean || '',
                },
                humidity: {
                    start: initialData.humidity?.start || '',
                    middle: initialData.humidity?.middle || '',
                    end: initialData.humidity?.end || '',
                    mean: initialData.humidity?.mean || '',
                },
                AtmosphericPressure: initialData.AtmosphericPressure,
                Frequency: initialData.Frequency,
                description: initialData.description
            });


        }
    }, []);


    const validateEnvValues = () => {
        const temp = form.getFieldValue("temperature") || {};
        const hum = form.getFieldValue("humidity") || {};

        const tempValues = [temp.start, temp.middle, temp.end].filter(Boolean).map(Number);
        const humValues = [hum.start, hum.middle, hum.end].filter(Boolean).map(Number);

        // Temperature tolerance 20 ± 2 => 18 to 22
        const tempValid = tempValues.every(v => v >= 18 && v <= 22);

        // Humidity tolerance 50 ± 10 => 40 to 60
        const humValid = humValues.every(v => v >= 40 && v <= 60);

        if (!tempValid) {
            message.error("❗ Temperature must be within 20 ± 2°C (Range: 18 to 22)");
            return false;
        }

        if (!humValid) {
            message.error("❗ Humidity must be within 50 ± 10% (Range: 40 to 60)");
            return false;
        }

        return true;
    };




    return (
        <Card title={mode === "edit" ? "Edit DefineProcedure" : "Create DefineProcedure"}>
            <Form
                layout="vertical"
                form={form}
                //onFinish={onSubmit}
                onFinish={(values) => {
                    if (!validateEnvValues()) return; // ❗ Stop submit if invalid
                    onSubmit(values);                 // ✅ Continue submit
                }}
                //initialValues={initialData}
                size="large"
            >
                <Row gutter={16}>

                    {/* Calibration Procedure */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="CALIBRATION PROCEDURE"
                            name="calibrationProcedure"
                            rules={[{ required: true, message: "Please enter calibration procedure" }]}
                        >
                            <Input placeholder="CALIBRATION PROCEDURE" />
                        </Form.Item>
                    </Col>

                    {/* Ref Std */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="REF.STD"
                            name="refStd"
                        >
                            <Input placeholder="REF.STD" />
                        </Form.Item>
                    </Col>

                    {/* Validity */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="VALIDITY"
                            name="validity"
                            rules={[{ required: true, message: "Please enter validity" }]}
                        >
                            <Input placeholder="VALIDITY" />
                        </Form.Item>
                    </Col>

                    {/* Traceability */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="TRACEABILITY"
                            name="traceability"
                            rules={[{ required: true, message: "Please enter traceability" }]}
                        >
                            <Input placeholder="TRACEABILITY" />
                        </Form.Item>
                    </Col>

                    {/* Temperature */}
                    <Col xs={24} md={24}>
                        <Form.Item label="TEMPERATURE (°C)">
                            <Input.Group compact>
                                <Form.Item
                                    name={['temperature', 'start']}
                                    noStyle
                                    rules={[{ required: true, message: 'Start temperature is required' }]}
                                >
                                    <Input
                                        placeholder="Start"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                temperature: {
                                                    ...form.getFieldValue('temperature'),
                                                    start: e.target.value,
                                                },
                                            })

                                            updateMean("temperature")
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item name={['temperature', 'middle']} noStyle>
                                    <Input
                                        placeholder="Middle"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                temperature: {
                                                    ...form.getFieldValue('temperature'),
                                                    middle: e.target.value,
                                                },

                                            })
                                            updateMean("temperature")
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name={['temperature', 'end']}
                                    noStyle
                                    rules={[{ required: true, message: 'End temperature is required' }]}
                                >
                                    <Input
                                        placeholder="End"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                temperature: {
                                                    ...form.getFieldValue('temperature'),
                                                    end: e.target.value,
                                                },
                                            })
                                            updateMean("temperature")
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item shouldUpdate noStyle>
                                    {/* {() => {
                                        const values = form.getFieldValue('temperature') || {};
                                        const nums = [values.start, values.middle, values.end].filter(Boolean);
                                        const mean =
                                            nums.length > 0
                                                ? (nums.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / nums.length).toFixed(2)
                                                : '';
                                        return <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />;
                                    }} */}


                                    {() => {
                                        const values = form.getFieldValue('temperature') || {};
                                        const nums = [values.start, values.middle, values.end].filter(Boolean);

                                        if (nums.length === 0) return <Input style={{ width: '25%' }} value="" placeholder="Mean" disabled />;

                                        // Determine max decimal places from inputs
                                        const maxDecimals = nums.reduce((max, num) => {
                                            const decimals = (num.toString().split('.')[1] || '').length;
                                            return Math.max(max, decimals);
                                        }, 0);

                                        const sum = nums.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                        const mean = (sum / nums.length).toFixed(maxDecimals);

                                        return (
                                            <Form.Item name={['temperature', 'mean']} noStyle>
                                                <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />
                                            </Form.Item>
                                        )
                                        //return <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />;
                                    }}

                                </Form.Item>
                            </Input.Group>
                        </Form.Item>
                    </Col>

                    {/* Humidity */}
                    <Col xs={24} md={24}>
                        <Form.Item label="HUMIDITY (RH %)">
                            <Input.Group compact>
                                <Form.Item
                                    name={['humidity', 'start']}
                                    noStyle
                                    rules={[{ required: true, message: 'Start humidity is required' }]}
                                >
                                    <Input
                                        placeholder="Start"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                humidity: {
                                                    ...form.getFieldValue('humidity'),
                                                    start: e.target.value,
                                                },
                                            })
                                            updateMean('humidity');
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item name={['humidity', 'middle']} noStyle>
                                    <Input
                                        placeholder="Middle"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                humidity: {
                                                    ...form.getFieldValue('humidity'),
                                                    middle: e.target.value,
                                                },
                                            })
                                            updateMean('humidity');
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name={['humidity', 'end']}
                                    noStyle
                                    rules={[{ required: true, message: 'End humidity is required' }]}
                                >
                                    <Input
                                        placeholder="End"
                                        style={{ width: '25%' }}
                                        onChange={(e) => {
                                            form.setFieldsValue({
                                                humidity: {
                                                    ...form.getFieldValue('humidity'),
                                                    end: e.target.value,
                                                },
                                            })
                                            updateMean('humidity');
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item shouldUpdate noStyle>

                                    {/* {() => {
                                        const values = form.getFieldValue('humidity') || {};
                                        const nums = [values.start, values.middle, values.end].filter(Boolean);
                                        const mean = nums.length > 0 ? (nums.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / nums.length).toFixed(4) : '';
                                        return <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />;
                                    }} */}

                                    {() => {
                                        const values = form.getFieldValue('humidity') || {};
                                        const nums = [values.start, values.middle, values.end].filter(Boolean);

                                        if (nums.length === 0) return <Input style={{ width: '25%' }} value="" placeholder="Mean" disabled />;

                                        // Determine max decimal places from inputs
                                        const maxDecimals = nums.reduce((max, num) => {
                                            const decimals = (num.toString().split('.')[1] || '').length;
                                            return Math.max(max, decimals);
                                        }, 0);

                                        const sum = nums.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                        const mean = (sum / nums.length).toFixed(maxDecimals);

                                        return (
                                            <Form.Item name={['humidity', 'mean']} noStyle>
                                                <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />
                                            </Form.Item>
                                        )
                                        //return <Input style={{ width: '25%' }} value={mean} placeholder="Mean" disabled />;
                                    }}

                                </Form.Item>
                            </Input.Group>
                        </Form.Item>
                    </Col>



                    {/* Select Document Format */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Select Document Format"
                            name="documentFormat"
                        //rules={[{ required: true, message: "Please select document format" }]}
                        >
                            <Select placeholder="Select Doc Format">
                                {/* Map your doc format here */}
                                {alldocformat.map(doc => (
                                    <Select.Option key={doc.formatName} value={doc.formatName}>
                                        {doc.formatName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Select Instrument */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Select Instrument"
                            name="instrument"
                            rules={[{ required: true, message: "Please select instrument" }]}
                        >
                            <Select
                                placeholder="Select Instrument"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option?.children?.toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={handleselect}
                            >
                                {instrumentList.map(inst => (
                                    <Select.Option key={inst.value} value={inst.value}>
                                        {inst.label}
                                    </Select.Option>
                                ))}
                            </Select>

                        </Form.Item>
                    </Col>


                    {/* Dynamic Discipline Parameters */}
                    {Object.keys(diciplineParameters).map((key) => {
                        if (key.startsWith("is") && diciplineParameters[key]) {
                            return (
                                <Col xs={24} md={12} key={key}>
                                    {renderInputField(key)}
                                </Col>
                            );
                        }
                        return null;
                    })}


                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Description"
                            name="description"
                        >
                            <Input.TextArea
                                placeholder="Description"
                                autoSize={{ minRows: 2, maxRows: 4 }}
                            />
                        </Form.Item>
                    </Col>


                </Row>



                <Card  style={{ marginTop: "10px" }}>
                    <h3 className='title'>Add Master Equipments</h3>
                    <div className="input_group">
                        <AddMasterEquipments
                            masterList={masterList}
                            addEquipmets={addEquipmets}
                            setAddEquipmets={setAddEquipmets}
                            setMasterListError={setMasterListError}
                        />
                    </div>
                    {masterListError && <span style={{ color: 'red' }}>{masterListError}</span>}
                    <ListMasterEquipments
                        addEquipmets={addEquipmets}
                        setAddEquipmets={setAddEquipmets}
                    />
                </Card>



                <RemarksCard
                    remarks={remarks}
                    addRemarksHandler={addRemarksHandler}
                    remarkChangeHandler={remarkChangeHandler}
                    deleteRemarkHandler={deleteRemarkHandler}
                />



                <Form.Item style={{ marginTop: "20px" }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                    >
                        {mode === "edit" ? "Update Procedure" : "Create Procedure"}
                    </Button>
                </Form.Item>

            </Form>





            <Spin size="large" spinning={isLoading} fullscreen />
        </Card>
    );
}

export default DefineProcedureForm;
