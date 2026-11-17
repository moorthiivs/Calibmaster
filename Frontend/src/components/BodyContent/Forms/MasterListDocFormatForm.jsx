import { Form, Input, DatePicker, Select, Button, Row, Col, Card } from 'antd';
import dayjs from 'dayjs';

const MasterListDocFormatForm = ({
    mode = 'create',
    form,
    docs = [],
    filteredDetails = [],
    onSubmit,
    loading = false,
    initialValues = {},
    onValuesChange
}) => {
    return (
        <Card title={mode === "edit" ? "Edit Master List Document" : "Add Master List Document"}>
            <Form
                form={form}
                layout="vertical"
                size="large"
                initialValues={{
                    ...initialValues,
                    revStartDate: initialValues.revStartDate ? dayjs(initialValues.revStartDate) : null,
                    revEndDate: initialValues.revEndDate ? dayjs(initialValues.revEndDate) : null,
                }}
                onFinish={onSubmit}
                onValuesChange={onValuesChange}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Master List Doc Name"
                            name="mslId"
                            rules={[{ required: true, message: 'Please select document name' }]}
                        >
                            <Select placeholder="Select Doc Name" allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode}>
                                {docs.map(doc => (
                                    <Select.Option key={doc.mslId} value={doc.mslId} >
                                        {doc.mslDocName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Master List Doc Details"
                            name="detailId"
                            rules={[{ required: true, message: 'Please select document details' }]}
                        >
                            <Select placeholder="Select Doc Details" allowClear getPopupContainer={(triggerNode) => triggerNode.parentNode}>
                                {filteredDetails.map(detail => (
                                    <Select.Option key={detail.detailId} value={detail.detailId}>
                                        {detail.groupName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Format Name"
                            name="formatName"
                            rules={[{ required: true, message: 'Please enter format name' }]}
                        >
                            <Input placeholder="Enter format name" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Section No"
                            name="sectionNo"
                            rules={[{ required: true, message: 'Please enter section number' }]}
                        >
                            <Input placeholder="Enter section number" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision No"
                            name="revNo"
                            rules={[{ required: true, message: 'Please enter revision number' }]}
                        >
                            <Input placeholder="Enter revision number" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision Start Date"
                            name="revStartDate"
                            rules={[{ required: true, message: 'Please select revision start date' }]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Revision End Date"
                            name="revEndDate"
                            rules={[{ required: true, message: 'Please select revision end date' }]}
                        >
                            <DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
                    <Button type="primary" htmlType="submit" loading={loading} >
                        {mode === 'edit' ? 'Update Document' : 'Create Document'}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default MasterListDocFormatForm;
