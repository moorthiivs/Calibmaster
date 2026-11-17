import React, { useState, useContext } from 'react';
import { Button, Input, Table, message, Alert, Card, Typography, Space, Divider, Tag, Tooltip } from 'antd';
import { PlayCircleOutlined, ToolOutlined, CheckCircleOutlined, InfoCircleOutlined, SwapOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";

const { Title, Text } = Typography;

const SequenceGapAnalyzer = ({ labId }) => {
    const auth = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);

    const [ulrConfig, setUlrConfig] = useState({
        fullStartUlr: "CC-239926000034627F",
        startRunningNumber: "34627"
    });

    const [certConfig, setCertConfig] = useState({
        prefix: "SAN/26/06/",
        startRunningNumber: "3938"
    });

    const [srfConfig, setSrfConfig] = useState({
        prefix: "",
        startRunningNumber: ""
    });

    const [inwardConfig, setInwardConfig] = useState({
        prefix: "",
        startRunningNumber: ""
    });

    // ── Renumber Sequence state ──────────────────────────────────────────────
    const [renumberConfig, setRenumberConfig] = useState({
        prefix: "SAN/26/06/",
        startNumber: "",
        endNumber: "",
        expectedNumber: ""
    });
    const [renumberLoading, setRenumberLoading] = useState(false);
    const [renumberPreview, setRenumberPreview] = useState(null);
    const [renumberApplied, setRenumberApplied] = useState(false);
    // ────────────────────────────────────────────────────────────────────────

    const analyzeGaps = async (isApply = false) => {
        if (!labId) return message.warning("Please select a lab in the first tab");
        setIsLoading(true);
        try {
            const payload = {
                labId,
                ulr: ulrConfig,
                certificate: certConfig,
                srf: srfConfig,
                inward: inwardConfig,
                isApply
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/analyze-gaps`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                if (isApply) {
                    message.success("Sequences successfully fixed!");
                    setResults(null);
                } else {
                    message.success("Analysis complete");
                    setResults(result.data);
                }
            } else {
                message.error(result.message || "Error analyzing gaps");
            }
        } catch (error) {
            console.error(error);
            message.error("Failed to communicate with server");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Renumber handlers ────────────────────────────────────────────────────
    const handleRenumberPreview = async () => {
        if (!labId) return message.warning("Please select a lab in the first tab");
        const { prefix, startNumber, expectedNumber } = renumberConfig;
        if (!prefix || !startNumber || !expectedNumber) {
            return message.warning("Please fill in Certificate Prefix, Start Number, and Expected Number.");
        }
        setRenumberLoading(true);
        setRenumberPreview(null);
        setRenumberApplied(false);
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/renumber-sequence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    labId,
                    prefix: renumberConfig.prefix,
                    startNumber: renumberConfig.startNumber,
                    endNumber: renumberConfig.endNumber || undefined,
                    expectedNumber: renumberConfig.expectedNumber,
                    isApply: false
                })
            });
            const result = await response.json();
            if (response.ok) {
                setRenumberPreview(result);
                if (result.willChange === 0) {
                    message.info("No changes needed — all certificates in range already match.");
                } else {
                    message.success(`Preview ready: ${result.willChange} certificate(s) will be renumbered.`);
                }
            } else {
                message.error(result.message || "Error generating preview");
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to communicate with server");
        } finally {
            setRenumberLoading(false);
        }
    };

    const handleRenumberApply = async () => {
        if (!labId) return message.warning("Please select a lab in the first tab");
        setRenumberLoading(true);
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/certificate-format/renumber-sequence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    labId,
                    prefix: renumberConfig.prefix,
                    startNumber: renumberConfig.startNumber,
                    endNumber: renumberConfig.endNumber || undefined,
                    expectedNumber: renumberConfig.expectedNumber,
                    isApply: true
                })
            });
            const result = await response.json();
            if (response.ok) {
                message.success(result.message || "Renumbering applied successfully!");
                setRenumberPreview(null);
                setRenumberApplied(true);
            } else {
                message.error(result.message || "Error applying renumbering");
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to communicate with server");
        } finally {
            setRenumberLoading(false);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    const columns = [
        { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
        { title: 'Item ID', dataIndex: 'itemId', key: 'itemId', width: 100 },
        { title: 'Current Value', dataIndex: 'oldVal', key: 'oldVal', render: text => <Text type="danger">{text}</Text> },
        { title: 'Expected Value', dataIndex: 'newVal', key: 'newVal', render: text => <Text type="success" strong>{text}</Text> },
    ];

    const renumberColumns = [
        { title: 'Item ID', dataIndex: 'itemId', key: 'itemId', width: 90 },
        {
            title: 'Current Certificate No',
            dataIndex: 'oldVal',
            key: 'oldVal',
            render: text => <Text type="danger" style={{ fontFamily: 'monospace' }}>{text}</Text>
        },
        {
            title: '→',
            key: 'arrow',
            width: 40,
            render: () => <SwapOutlined style={{ color: '#888' }} />
        },
        {
            title: 'New Certificate No',
            dataIndex: 'newVal',
            key: 'newVal',
            render: text => <Text type="success" strong style={{ fontFamily: 'monospace' }}>{text}</Text>
        },
    ];

    return (
        <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
            <Alert 
                message="Sequence Gap Analyzer" 
                description="Use this tool to detect and fix missing or skipped sequence numbers in ULRs and Certificates for active items. This simulates the behavior of the fix-ulr-certificate-gap script."
                type="info" 
                showIcon 
                icon={<InfoCircleOutlined />}
            />
            
            <div className="flex gap-4">
                <Card title="ULR Configuration" size="small" className="flex-1 shadow-sm border-gray-200">
                    <Space direction="vertical" className="w-full">
                        <div>
                            <Text type="secondary" className="text-xs">Full Start ULR (e.g. CC-239926000034627F)</Text>
                            <Input 
                                value={ulrConfig.fullStartUlr} 
                                onChange={e => setUlrConfig({...ulrConfig, fullStartUlr: e.target.value})}
                                placeholder="CC-2399..." 
                            />
                        </div>
                        <div>
                            <Text type="secondary" className="text-xs">Start Running Number (e.g. 34627)</Text>
                            <Input 
                                value={ulrConfig.startRunningNumber} 
                                onChange={e => setUlrConfig({...ulrConfig, startRunningNumber: e.target.value})}
                                placeholder="34627" 
                            />
                        </div>
                    </Space>
                </Card>

                <Card title="Certificate Configuration" size="small" className="flex-1 shadow-sm border-gray-200">
                    <Space direction="vertical" className="w-full">
                        <div>
                            <Text type="secondary" className="text-xs">Certificate Prefix (e.g. SAN/26/06/)</Text>
                            <Input 
                                value={certConfig.prefix} 
                                onChange={e => setCertConfig({...certConfig, prefix: e.target.value})}
                                placeholder="SAN/26/06/" 
                            />
                        </div>
                        <div>
                            <Text type="secondary" className="text-xs">Start Running Number (e.g. 3938)</Text>
                            <Input 
                                value={certConfig.startRunningNumber} 
                                onChange={e => setCertConfig({...certConfig, startRunningNumber: e.target.value})}
                                placeholder="3938" 
                            />
                        </div>
                    </Space>
                </Card>
            </div>

            <div className="flex gap-4">
                <Card title="SRF Configuration" size="small" className="flex-1 shadow-sm border-gray-200">
                    <Space direction="vertical" className="w-full">
                        <div>
                            <Text type="secondary" className="text-xs">SRF Prefix (e.g. SAN/SRF/26/06/)</Text>
                            <Input 
                                value={srfConfig.prefix} 
                                onChange={e => setSrfConfig({...srfConfig, prefix: e.target.value})}
                                placeholder="SAN/SRF/26/06/" 
                            />
                        </div>
                        <div>
                            <Text type="secondary" className="text-xs">Start Running Number (e.g. 1)</Text>
                            <Input 
                                value={srfConfig.startRunningNumber} 
                                onChange={e => setSrfConfig({...srfConfig, startRunningNumber: e.target.value})}
                                placeholder="1" 
                            />
                        </div>
                    </Space>
                </Card>

                <Card title="Inward Configuration" size="small" className="flex-1 shadow-sm border-gray-200">
                    <Space direction="vertical" className="w-full">
                        <div>
                            <Text type="secondary" className="text-xs">Inward Prefix (e.g. IWDI260626)</Text>
                            <Input 
                                value={inwardConfig.prefix} 
                                onChange={e => setInwardConfig({...inwardConfig, prefix: e.target.value})}
                                placeholder="IWDI260626" 
                            />
                        </div>
                        <div>
                            <Text type="secondary" className="text-xs">Start Running Number (e.g. 1)</Text>
                            <Input 
                                value={inwardConfig.startRunningNumber} 
                                onChange={e => setInwardConfig({...inwardConfig, startRunningNumber: e.target.value})}
                                placeholder="1" 
                            />
                        </div>
                    </Space>
                </Card>
            </div>

            <div className="flex justify-center mt-2">
                <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    size="large" 
                    onClick={() => analyzeGaps(false)}
                    loading={isLoading}
                    className="px-8 font-semibold bg-blue-600"
                >
                    Run Dry Analysis
                </Button>
            </div>

            {results !== null && (
                <Card 
                    title={<span className="text-blue-700"><ToolOutlined /> Analysis Results</span>} 
                    className="mt-4 shadow-sm border-blue-200"
                    extra={
                        results.length > 0 ? (
                            <Button 
                                type="primary" 
                                danger 
                                icon={<CheckCircleOutlined />}
                                onClick={() => analyzeGaps(true)}
                                loading={isLoading}
                            >
                                Apply Fix to Database
                            </Button>
                        ) : (
                            <Text type="success" strong><CheckCircleOutlined /> All sequences are correct!</Text>
                        )
                    }
                >
                    {results.length > 0 ? (
                        <>
                            <Alert 
                                message={`Found ${results.length} items that need updating.`} 
                                type="warning" 
                                showIcon 
                                className="mb-3"
                            />
                            {Object.entries(
                                results.reduce((acc, curr) => {
                                    if (!acc[curr.type]) acc[curr.type] = [];
                                    acc[curr.type].push(curr);
                                    return acc;
                                }, {})
                            ).map(([type, items]) => (
                                <div key={type} className="mb-4">
                                    <Title level={5} className="mb-2 text-gray-700 dark:text-gray-200">{type} Updates ({items.length})</Title>
                                    <Table 
                                        dataSource={items} 
                                        columns={columns.filter(c => c.key !== 'type')} 
                                        rowKey={(record) => `${record.type}-${record.itemId}`}
                                        size="small"
                                        pagination={{ pageSize: 10 }}
                                        bordered
                                    />
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
                            <Title level={5}>No gaps found!</Title>
                            <Text type="secondary">The sequences for active items match your configuration perfectly.</Text>
                        </div>
                    )}
                </Card>
            )}

            {/* ════════════════════════════════════════════════════════════════
                NEW FEATURE: Renumber Running Sequence
                ════════════════════════════════════════════════════════════════ */}
            <Divider>
                <Space>
                    <SwapOutlined style={{ color: '#7c3aed' }} />
                    <span style={{ color: '#7c3aed', fontWeight: 600 }}>Renumber Running Sequence</span>
                </Space>
            </Divider>

            <Alert
                message="Renumber Running Sequence"
                description={
                    <span>
                        Use this tool to <strong>shift certificate running numbers</strong> within a specific range.
                        For example, if current numbers start at <code>5717</code> but should start at <code>5718</code>,
                        enter the range and expected start — all numbers shift by the offset automatically.
                        Always <strong>Preview</strong> before applying.
                    </span>
                }
                type="warning"
                showIcon
                icon={<SwapOutlined />}
            />

            <Card
                title={
                    <Space>
                        <SwapOutlined style={{ color: '#7c3aed' }} />
                        <span style={{ color: '#7c3aed' }}>Renumber Configuration</span>
                    </Space>
                }
                size="small"
                className="shadow-sm"
                style={{ borderColor: '#c4b5fd' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Certificate Prefix */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Certificate Prefix <Text type="danger">*</Text>
                            <Tooltip title="The prefix of your certificate numbers, e.g. SAN/26/06/">
                                <InfoCircleOutlined style={{ marginLeft: 4, color: '#888' }} />
                            </Tooltip>
                        </Text>
                        <Input
                            value={renumberConfig.prefix}
                            onChange={e => {
                                setRenumberConfig({ ...renumberConfig, prefix: e.target.value });
                                setRenumberPreview(null);
                                setRenumberApplied(false);
                            }}
                            placeholder="e.g. SAN/26/06/"
                            style={{ borderColor: '#c4b5fd' }}
                            prefix={<Tag color="purple" style={{ marginRight: 4 }}>PREFIX</Tag>}
                        />
                    </div>

                    {/* Start Number */}
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Start Number — Current <Text type="danger">*</Text>
                            <Tooltip title="The first number in the range to renumber. E.g. 5717">
                                <InfoCircleOutlined style={{ marginLeft: 4, color: '#888' }} />
                            </Tooltip>
                        </Text>
                        <Input
                            type="number"
                            value={renumberConfig.startNumber}
                            onChange={e => {
                                setRenumberConfig({ ...renumberConfig, startNumber: e.target.value });
                                setRenumberPreview(null);
                                setRenumberApplied(false);
                            }}
                            placeholder="e.g. 5717"
                            style={{ borderColor: '#c4b5fd' }}
                        />
                    </div>

                    {/* End Number (optional) */}
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            End Number — Optional
                            <Tooltip title="The last number in the range. Leave blank to renumber all from Start onwards.">
                                <InfoCircleOutlined style={{ marginLeft: 4, color: '#888' }} />
                            </Tooltip>
                        </Text>
                        <Input
                            type="number"
                            value={renumberConfig.endNumber}
                            onChange={e => {
                                setRenumberConfig({ ...renumberConfig, endNumber: e.target.value });
                                setRenumberPreview(null);
                                setRenumberApplied(false);
                            }}
                            placeholder="e.g. 6034 (optional)"
                            style={{ borderColor: '#c4b5fd' }}
                        />
                    </div>

                    {/* Expected Start Number */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Expected Start Number — New <Text type="danger">*</Text>
                            <Tooltip title="The new starting number. E.g. if Start=5717 and Expected=5718, all numbers shift +1.">
                                <InfoCircleOutlined style={{ marginLeft: 4, color: '#888' }} />
                            </Tooltip>
                        </Text>
                        <Input
                            type="number"
                            value={renumberConfig.expectedNumber}
                            onChange={e => {
                                setRenumberConfig({ ...renumberConfig, expectedNumber: e.target.value });
                                setRenumberPreview(null);
                                setRenumberApplied(false);
                            }}
                            placeholder="e.g. 5718"
                            style={{ borderColor: '#c4b5fd' }}
                        />
                        {renumberConfig.startNumber && renumberConfig.expectedNumber && (
                            <div style={{ marginTop: 6 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Offset:{' '}
                                    <Tag color={parseInt(renumberConfig.expectedNumber, 10) - parseInt(renumberConfig.startNumber, 10) >= 0 ? 'green' : 'red'}>
                                        {parseInt(renumberConfig.expectedNumber, 10) - parseInt(renumberConfig.startNumber, 10) >= 0 ? '+' : ''}
                                        {parseInt(renumberConfig.expectedNumber, 10) - parseInt(renumberConfig.startNumber, 10)}
                                    </Tag>
                                </Text>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
                    <Button
                        icon={<EyeOutlined />}
                        size="large"
                        onClick={handleRenumberPreview}
                        loading={renumberLoading}
                        style={{ borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 600, minWidth: 160 }}
                    >
                        Preview Changes
                    </Button>
                    {renumberPreview && renumberPreview.willChange > 0 && (
                        <Button
                            type="primary"
                            danger
                            icon={<ThunderboltOutlined />}
                            size="large"
                            onClick={handleRenumberApply}
                            loading={renumberLoading}
                            style={{ fontWeight: 600, minWidth: 200 }}
                        >
                            Run &amp; Apply ({renumberPreview.willChange} records)
                        </Button>
                    )}
                </div>
            </Card>

            {/* Success banner after apply */}
            {renumberApplied && (
                <Alert
                    message="Renumbering applied successfully!"
                    description="All certificate numbers in the specified range have been updated in the database."
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                />
            )}

            {/* Preview table */}
            {renumberPreview !== null && !renumberApplied && (
                <Card
                    title={
                        <Space>
                            <EyeOutlined style={{ color: '#7c3aed' }} />
                            <span style={{ color: '#7c3aed' }}>
                                Preview — {renumberPreview.willChange} certificate(s) will be renumbered
                            </span>
                        </Space>
                    }
                    size="small"
                    style={{ borderColor: '#c4b5fd' }}
                    className="shadow-sm"
                >
                    <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Tag color="blue">Total in range: {renumberPreview.totalInRange}</Tag>
                        <Tag color="orange">Will change: {renumberPreview.willChange}</Tag>
                        <Tag color={renumberPreview.offset >= 0 ? 'green' : 'red'}>
                            Offset: {renumberPreview.offset >= 0 ? '+' : ''}{renumberPreview.offset}
                        </Tag>
                    </div>
                    {renumberPreview.willChange === 0 ? (
                        <div className="text-center py-6">
                            <CheckCircleOutlined style={{ fontSize: 32, color: '#22c55e' }} />
                            <Title level={5} style={{ marginTop: 8 }}>No changes needed</Title>
                            <Text type="secondary">All certificates in the range already have correct numbers.</Text>
                        </div>
                    ) : (
                        <Table
                            dataSource={renumberPreview.data}
                            columns={renumberColumns}
                            rowKey={(record) => `ren-${record.itemId}`}
                            size="small"
                            pagination={{ pageSize: 15 }}
                            bordered
                            scroll={{ x: true }}
                        />
                    )}
                </Card>
            )}
            {/* ═══════════════════════════════════════════════════════════════ */}
        </div>
    );
};

export default SequenceGapAnalyzer;
