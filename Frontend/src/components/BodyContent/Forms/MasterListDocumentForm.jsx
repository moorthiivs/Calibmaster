import { Form, Input, DatePicker, Button, Card, Row, Col, Spin } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

export default function MasterListDocumentForm({
    mode = "create",
    form,
    initialValues = {},
    onSubmit,
    loading = false,
}) {
    const [isDirty, setIsDirty] = useState(false);


    const handleFinish = (values) => {
        const formatted = {
            ...values,
            startDate: values.startDate?.toISOString(),
            endDate: values.endDate?.toISOString(),
        };
        onSubmit(formatted);
    };

    const handleFieldsChange = () => {
        if (mode === 'edit') {
            const touched = form.isFieldsTouched(true);
            setIsDirty(touched);
        }
    };
    return (
        <Card title={mode === "edit" ? "Edit Master List Document" : "Add Master List Document"}>
            <Form
                form={form}
                layout="vertical"
                size="large"
                initialValues={{
                    ...initialValues,
                    startDate: initialValues.startDate ? dayjs(initialValues.startDate) : null,
                    endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
                }}
                onFinish={handleFinish}
                onFieldsChange={handleFieldsChange}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Document Name"
                            name="docName"
                            rules={[{ required: true, message: 'Please enter document name' }]}
                        >
                            <Input placeholder="Enter document name" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision Number"
                            name="revisionNo"
                            rules={[{ required: true, message: 'Please enter revision number' }]}
                        >
                            <Input placeholder="Enter revision number" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision Start Date"
                            name="startDate"
                            rules={[{ required: true, message: 'Please select start date' }]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision End Date"
                            name="endDate"
                            dependencies={['startDate']}
                            rules={[
                                { required: true, message: 'Please select end date' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const start = getFieldValue('startDate');
                                        if (!value || !start || value.isAfter(start)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error('End date must be after start date')
                                        );
                                    },
                                }),
                            ]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                        disabled={
                            mode === "edit" &&
                            (!isDirty ||
                                !!form
                                    .getFieldsError()
                                    .some(({ errors }) => errors.length > 0))
                        }
                    >
                        {mode === 'edit' ? 'Update Document' : 'Create Document'}
                    </Button>

                </Form.Item>
            </Form>


            {loading && (
                <div style={{ textAlign: "center" }}>
                    <Spin />
                </div>
            )}
        </Card>
    );
}
