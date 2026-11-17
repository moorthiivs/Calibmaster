import { Form, Input, DatePicker, Select, Row, Col, Card, Button } from 'antd';
import dayjs from 'dayjs';
const { Option } = Select;
const MasterListDocDetailForm = ({
    mode = 'create',
    form,
    docs = [],
    initialValues = {},
    onSubmit,
    loading = false,
}) => {
    return (
        <Card title={mode === "edit" ? "Edit Master List DocDetail" : "Add Master List DocDetail"}>
            <Form
                form={form}
                layout="vertical"
                size="large"
                initialValues={{
                    ...initialValues,
                    issueRevDate: initialValues.issueRevDate ? dayjs(initialValues.issueRevDate) : null,
                    effectiveStartDate: initialValues.effectiveStartDate ? dayjs(initialValues.effectiveStartDate) : null,
                    effectiveEndDate: initialValues.effectiveEndDate ? dayjs(initialValues.effectiveEndDate) : null,
                }}
                onFinish={onSubmit}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Master List Doc Name"
                            name="mslId"
                            rules={[{ required: true, message: 'Please select document' }]}
                        >
                            <Select placeholder="Select Doc Name" allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode}>
                                {docs.map(doc => (
                                    <Option key={doc.mslId} value={doc.mslId}>{doc.mslDocName}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Group Name"
                            name="groupName"
                            rules={[{ required: true, message: 'Please enter group name' }]}
                        >
                            <Input placeholder="Enter group name" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Document Number"
                            name="docNumber"
                            rules={[{ required: true, message: 'Please enter document number' }]}
                        >
                            <Input placeholder="Enter document number" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Document Title"
                            name="docTitle"
                            rules={[{ required: true, message: 'Please enter document title' }]}
                        >
                            <Input placeholder="Enter document title" />
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
                            label="Issue/Revision Date"
                            name="issueRevDate"
                            rules={[{ required: true, message: 'Please select issue/revision date' }]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Effective Start Date"
                            name="effectiveStartDate"
                            rules={[{ required: true, message: 'Please select start date' }]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Effective End Date"
                            name="effectiveEndDate"
                            dependencies={['effectiveStartDate']}
                            rules={[
                                { required: true, message: 'Please select Effective End Date' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const start = getFieldValue('effectiveStartDate');
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

                    <Col span={12}>
                        <Form.Item label="Retention Period" name="retentionPeriod">
                            <Input placeholder="Enter retention period (optional)" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="Possession" name="possession">
                            <Input placeholder="Enter possession (optional)" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"

                    >
                        {mode === 'edit' ? 'Update Document' : 'Create Document'}
                    </Button>

                </Form.Item>
            </Form>
        </Card>

    );
};

export default MasterListDocDetailForm;
