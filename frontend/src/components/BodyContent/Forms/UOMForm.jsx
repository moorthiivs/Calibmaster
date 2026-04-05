import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Row, Col, Spin } from "antd";

const UOMForm = ({
  form,
  mode = "create",
  initialData = {},
  onSubmit,
  isLoading = false,
  error = "",
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
    <Card title={mode === "edit" ? "Edit UOM" : "Add UOM"}>
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
              label="UOM Name"
              name="UOMName"
              rules={[{ required: true, message: "Please enter UOM name" }]}
            >
              <Input placeholder="E.g. Volt-Ampere" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Kind of Quantity"
              name="kindOfQuantity"
              rules={[{ required: true, message: "Please enter kind of quantity" }]}
            >
              <Input placeholder="E.g. Electrical Power" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Unit Symbol"
              name="UOMUnitSymbol"
              rules={[{ required: true, message: "Please enter unit symbol" }]}
            >
              <Input placeholder="E.g. VA" />
            </Form.Item>
          </Col>

          {error && (
            <Col span={24}>
              <p style={{ color: "red", textAlign: "center" }}>{error}</p>
            </Col>
          )}

          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" block disabled={mode === "edit" && !isDirty}>
                {mode === "edit" ? "Update UOM" : "Add UOM"}
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

export default UOMForm;
