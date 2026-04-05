import React from 'react';
import { Row, Col, Card, Spin, Typography, Progress } from "antd";
import { HddOutlined, CheckCircleOutlined, StopOutlined, DatabaseOutlined, FolderOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

const DiskUsageVisualizer = ({ diskUsage }) => {
    if (!diskUsage) {
        return <Card><Spin /></Card>;
    }

    const usedPercentValue = parseFloat(diskUsage.usedPercent?.replace(' %', ''));
    const freePercentValue = (100 - usedPercentValue).toFixed(2);

    return (
        <Card>
            <Title level={4} style={{ marginBottom: '24px', textAlign: "left" }}>
                <HddOutlined /> Disk Usage Overview
            </Title>
            <Row gutter={[24, 24]} align="middle">
                <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                    <Progress
                        type="dashboard"
                        percent={usedPercentValue}
                        format={(percent) => `${percent}% Used`}
                    />
                    <div style={{ marginTop: 8 }}>
                        <Text>Free: {freePercentValue}%</Text>
                    </div>
                </Col>
                <Col xs={24} md={16}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card size="small" style={{ backgroundColor: '#e6f7ff' }}>
                                <DatabaseOutlined style={{ fontSize: 18, marginRight: 8, color: '#1890ff' }} />
                                <Text strong>Total Space</Text>
                                <Title level={5} style={{ margin: 0 }}>{diskUsage.totalGB}</Title>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
                                <StopOutlined style={{ fontSize: 18, marginRight: 8, color: '#faad14' }} />
                                <Text strong>Used Space</Text>
                                <Title level={5} style={{ margin: 0 }}>{diskUsage.usedGB}</Title>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                                <CheckCircleOutlined style={{ fontSize: 18, marginRight: 8, color: '#52c41a' }} />
                                <Text strong>Free Space</Text>
                                <Title level={5} style={{ margin: 0 }}>{diskUsage.freeGB}</Title>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small" style={{ backgroundColor: '#f0f0f0' }}>
                                <FolderOutlined style={{ fontSize: 18, marginRight: 8, color: '#8c8c8c' }} />
                                <Text strong>Project Size</Text>
                                <Title level={5} style={{ margin: 0 }}>{diskUsage.projectSize}</Title>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Card>
    );
};

export default DiskUsageVisualizer;
