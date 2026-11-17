import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Row, Col, Select, Spin } from "antd";

const { Option } = Select;

const CustomerForm = ({
    mode = "create",
    initialData = {},
    onSubmit,
    isLoading = false,
    titleOptions = [],
}) => {
    const [form] = Form.useForm();

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
        }
    }, [initialData]);


    const handleFieldsChange = () => {
        if (mode === 'edit') {
            const touched = form.isFieldsTouched(true);
            setIsDirty(touched);
        }
    };

    return (
        <Card title={mode === "edit" ? "Edit Customer" : "Create Customer"}>
            <Form
                layout="vertical"
                form={form}
                onFinish={onSubmit}
                initialValues={initialData}
                onFieldsChange={handleFieldsChange}
                size="large"
            >
                <Row gutter={[16, 0]} style={{ width: "100%" }}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Customer Name"
                            name="customerName"
                            rules={[{ required: true, message: "Please enter customer name" }]}
                        >
                            <Input placeholder="Customer Name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Customer Code" name="customerCode">
                            <Input placeholder="Customer Code" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Address Line 1"
                            name="address1"
                            rules={[{ required: true, message: "Please enter address" }]}
                        >
                            <Input placeholder="Address Line 1" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Address Line 2" name="address2">
                            <Input placeholder="Address Line 2" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Address Line 3" name="address3">
                            <Input placeholder="Address Line 3" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="City"
                            name="city"
                            rules={[{ required: true, message: "Please enter city" }]}
                        >
                            <Input placeholder="City" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="State"
                            name="state"
                            rules={[{ required: true, message: "Please enter state" }]}
                        >
                            <Input placeholder="State" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Pincode"
                            name="pinCode"
                            rules={[{ required: true, message: "Please enter pincode" }]}
                        >
                            <Input placeholder="Pincode" type="number" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Country" name="country">
                            <Input placeholder="Country" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="GST Number"
                            name="gst_number"
                            rules={[{ required: true, message: "Please enter GST number" }]}
                        >
                            <Input placeholder="GST Number" />
                        </Form.Item>
                    </Col>

                    {/* Contact Section */}
                    <Col xs={24} md={6}>
                        <Form.Item
                            label="Title"
                            name="contact_title"
                            rules={[{ required: true, message: "Please select title" }]}
                        >
                            <Select placeholder="Select title">
                                {titleOptions.map((opt, idx) => (
                                    <Option key={idx} value={opt.value}>
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={18}>
                        <Form.Item
                            label="Contact Name"
                            name="contact_fullname"
                            rules={[{ required: true, message: "Please enter contact name" }]}
                        >
                            <Input placeholder="Enter name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Contact Email"
                            name="contact_email"
                            rules={[
                                { required: true, message: "Please enter contact email" },
                                { type: "email", message: "Invalid email format" },
                            ]}
                        >
                            <Input placeholder="Contact Email" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Contact Phone 1"
                            name="contact_phone_1"
                            rules={[{ required: true, message: "Please enter phone number" }]}
                        >
                            <Input type="number" placeholder="Contact Phone 1" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Contact Phone 2" name="contact_phone_2">
                            <Input type="number" placeholder="Contact Phone 2" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Contract Agreement Days"
                            name="contract_days"
                            rules={[{ required: true, message: "Please select contract agreement days" }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select days"
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    option?.label?.toString().toLowerCase().includes(input.toLowerCase())
                                }
                                options={Array.from({ length: 50 }, (_, i) => ({
                                    label: `${i + 1}`,
                                    value: i + 1,
                                }))}
                            />
                        </Form.Item>
                    </Col>


                    <Col span={24}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                disabled={mode === "edit" && !isDirty}
                            >
                                {mode === "edit" ? "Update Customer" : "Create Customer"}
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

export default CustomerForm;
