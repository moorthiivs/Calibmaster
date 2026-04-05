import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Row, Col, Select, Spin } from "antd";

const { Option } = Select;

const UserForm = ({
    form,
    mode = "create",
    initialData = {},
    onSubmit,
    isLoading = false,
    error = "",
    departments = [],
    askcompany = false,
    companies = [],
    onDepartmentChange
}) => {

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
        <Card title={mode === "edit" ? "Edit User" : "Add User"}>
            <Form
                layout="vertical"
                form={form}
                autoComplete="off"
                onFinish={onSubmit}
                initialValues={initialData}
                onFieldsChange={handleFieldsChange}
                size="large"
            >
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: "Please enter name" }]}
                        >
                            <Input placeholder="Enter name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Please enter email" },
                                { type: "email", message: "Invalid email format" },
                            ]}
                        >
                            <Input placeholder="Enter email" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: "Please enter password" }]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Role"
                            name="department"
                            rules={[{ required: true, message: "Please select role" }]}
                        >
                            <Select placeholder="Select role" onChange={(value) => {
                                onDepartmentChange(value);
                                form.setFieldsValue({ department: value });
                            }} getPopupContainer={(triggerNode) => triggerNode.parentNode}>
                                {departments.map((role, idx) => (
                                    <Option key={idx} value={role.value}>
                                        {role.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {askcompany && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Customer"
                                    name="company"
                                    rules={[{ required: true, message: "Please select customer" }]}
                                >
                                    <Select placeholder="Select customer" onChange={(value) => {
                                        const selected = companies.find((c) => c.customer_id === value);
                                        //onCompanyChange(selected);
                                        const fullAddress = [
                                            selected.address1,
                                            selected.address2,
                                            selected.address3,
                                        ]
                                            .filter(Boolean)
                                            .join(", ");
                                        form.setFieldsValue({
                                            company: value,
                                            customerAddress: fullAddress,
                                        });

                                        console.log(fullAddress, "fullAddress");

                                    }}>
                                        {companies.map((c, idx) => (
                                            <Option key={idx} value={c.customer_id}>
                                                {c.customer_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item label="Customer Address" name="customerAddress">
                                    <Input.TextArea
                                        placeholder="Customer address"
                                        rows={4}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {error && (
                        <Col span={24}>
                            <p style={{ color: "red", textAlign: "center" }}>{error}</p>
                        </Col>
                    )}

                    <Col span={24}>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block disabled={mode === "edit" && !isDirty}>
                                {mode === "edit" ? "Update User" : "Add User"}
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

export default UserForm;
