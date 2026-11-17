import React from "react";
import { Card, Typography, Divider, Button, Flex, Space } from "antd";
import { EyeOutlined, SaveOutlined } from "@ant-design/icons";
import "./styles/CertificatePreview.css";

const { Title, Text } = Typography;

const CertificatePreview = ({ preview, formatTemplate, handleSave, isLoading, labId }) => {
    return (
        <Card className="certificate-card" bordered={false} title={
            <Flex className="certificate-header">
                <div style={{ marginTop: "18px" }}>
                    <EyeOutlined className="icon" />
                </div>
                <div>
                    <Title level={4} >Preview & Save</Title>
                </div>
            </Flex>
        }>


            <Card>
                <div className="preview-card">
                    <Text strong className="subtitle">Certificate Number Preview</Text>
                    <div className="preview-text">
                        {preview || "No preview available"}
                    </div>

                    <Divider />

                    <div className="template-info">
                        <p>
                            <strong>Template:</strong>{" "}
                            <code className="code-block">{formatTemplate || "..."}</code>
                        </p>
                    </div>
                </div>
            </Card>


            <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                block
                loading={isLoading}
                onClick={handleSave}
                disabled={isLoading || !formatTemplate}
                className="certificate-button"
            >
                {isLoading ? "Saving..." : "Save Certificate Format"}
            </Button>



        </Card>
    );
};

export default CertificatePreview;
