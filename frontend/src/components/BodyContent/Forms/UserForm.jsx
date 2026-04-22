import React, { useEffect, useState, useContext } from "react";
import { Form, Input, Button, Card, Row, Col, Select, Spin, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";

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

    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const auth = useContext(AuthContext);

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
        }
    }, [initialData]);

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const response = await fetch(config.Calibmaster.URL + "/api/roles/list", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({ labId: auth.labId }),
                });
                const data = await response.json();
                if (data.code === 200) {
                    setRoles(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, [auth.token]);

    // Auto-populate legacy department based on selected Role
    const handleRoleChange = (roleId) => {
        const selectedRole = roles.find(r => r.id === roleId);
        if (selectedRole) {
            // Map role name to legacy department if possible, otherwise use role name
            const roleName = selectedRole.name;
            let legacyDept = "Calibration"; // Default
            if (["CSD", "Calibration", "Accounts", "Client", "Manager", "admin"].includes(roleName)) {
                legacyDept = roleName;
            } else if (roleName.toLowerCase().includes("admin") || roleName.toLowerCase().includes("root")) {
                legacyDept = "Manager"; // Fallback for elevated roles
            } else {
                legacyDept = roleName; // Use custom role name as dept
            }
            
            form.setFieldsValue({ department: legacyDept });
            onDepartmentChange && onDepartmentChange(legacyDept);
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
                            rules={mode === 'create' ? [{ required: true, message: "Please enter password" }] : []}
                        >
                            <Input.Password placeholder={mode === 'edit' ? "Leave blank to keep current" : "Enter password"} />
                        </Form.Item>
                    </Col>

                    {/* Legacy Department (Hidden) */}
                    <Form.Item
                        name="department"
                        noStyle
                    >
                        <Input type="hidden" />
                    </Form.Item>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="RBAC Role"
                            name="roleId"
                            rules={[{ required: true, message: "Please select RBAC role" }]}
                        >
                            <Select placeholder="Select RBAC role" loading={loadingRoles} onChange={handleRoleChange}>
                                {roles.map((role) => (
                                    <Option key={role.id} value={role.id}>
                                        {role.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Title (e.g. Quality Manager)"
                            name="title"
                            rules={[{ required: true, message: "Please enter title" }]}
                        >
                            <Input placeholder="Enter title" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Signature Image"
                            name="signature"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) return e;
                                return e && e.fileList;
                            }}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                                <Button icon={<UploadOutlined />}>Click to Upload</Button>
                            </Upload>
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
                            <Button type="primary" htmlType="submit" block disabled={isLoading} loading={isLoading}>
                                {mode === "edit" ? "Update User" : "Add User"}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default UserForm;
