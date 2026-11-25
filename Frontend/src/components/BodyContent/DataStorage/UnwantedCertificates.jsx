import React, { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Modal,
    Popconfirm,
    Row,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    ClearOutlined,
    DeleteOutlined,
    FilePdfOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";

const { Title, Text } = Typography;

const CATEGORY_META = {
    UNLINKED_ORPHAN: { label: "Unlinked Orphan", color: "red" },
    SUPERSEDED: { label: "Superseded Regeneration", color: "orange" },
    DELETED_ITEM: { label: "Deleted SRF Item", color: "volcano" },
};

const TYPE_META = {
    certificate: { label: "Certificate", color: "blue" },
    observation: { label: "Observation", color: "purple" },
    draft: { label: "Draft", color: "default" },
};

const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
    if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
};

const UnwantedCertificates = ({
    items = [],
    summary,
    loading,
    token,
    onRefresh,
    onBack,
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const selectedBytes = useMemo(() => {
        const keySet = new Set(selectedRowKeys);
        return items.reduce((acc, it) => (keySet.has(it.key) ? acc + (it.sizeBytes || 0) : acc), 0);
    }, [items, selectedRowKeys]);

    const safeBulkCount = useMemo(
        () =>
            items.filter(
                (it) => it.category === "UNLINKED_ORPHAN" || it.category === "SUPERSEDED"
            ).length,
        [items]
    );

    const safeBulkBytes = useMemo(
        () =>
            items
                .filter((it) => it.category === "UNLINKED_ORPHAN" || it.category === "SUPERSEDED")
                .reduce((acc, it) => acc + (it.sizeBytes || 0), 0),
        [items]
    );

    const executeDelete = async (payload) => {
        try {
            setDeleting(true);
            const res = await fetch(
                `${config.Calibmaster.URL}/api/data-storage/unwanted-certificates`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify(payload),
                }
            );
            const result = await res.json();
            if (res.ok && result.status === "SUCCESS") {
                GlobalNotification.success({
                    title: "Cleanup Complete",
                    description:
                        result.message ||
                        `Deleted ${result.deletedCount} file(s), freed ${result.freedFormatted}.`,
                });
                setSelectedRowKeys([]);
                if (onRefresh) await onRefresh();
            } else {
                GlobalNotification.error({
                    title: "Cleanup Failed",
                    description: result.message || "Unable to delete selected files.",
                });
            }
        } catch (err) {
            console.error("Cleanup error:", err);
            GlobalNotification.error({
                title: "Error",
                description: "Something went wrong while deleting unwanted files.",
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteSelected = () => {
        if (!selectedRowKeys.length) {
            GlobalNotification.warning({
                title: "Selection Required",
                description: "Please select at least one file to delete.",
            });
            return;
        }
        Modal.confirm({
            title: "Permanently Delete Selected Files?",
            icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
            content: `You are about to permanently delete ${selectedRowKeys.length} unwanted file(s) (${formatBytes(selectedBytes)}). Active latest certificates are never affected.`,
            okText: "Delete Permanently",
            okType: "danger",
            cancelText: "Cancel",
            onOk: () => executeDelete({ mode: "selected", selectedKeys: selectedRowKeys }),
        });
    };

    const handleCleanAllSafe = () => {
        Modal.confirm({
            title: "Clean All Unlinked & Superseded Files?",
            icon: <WarningOutlined style={{ color: "#fa8c16" }} />,
            content: `This will permanently delete ${safeBulkCount} unlinked orphan and superseded regeneration file(s) (${formatBytes(safeBulkBytes)}) from disk. Active certificates and soft-deleted SRF Trash items are kept untouched.`,
            okText: "Clean All Safe Files",
            okType: "danger",
            cancelText: "Cancel",
            onOk: () => executeDelete({ mode: "all_safe", includeDeletedItems: false }),
        });
    };

    const columns = [
        {
            title: "File Name",
            dataIndex: "fileName",
            key: "fileName",
            ellipsis: true,
            render: (name) => (
                <Tooltip title={name}>
                    <Tag icon={<FilePdfOutlined />} className="font-mono text-xs">
                        {name}
                    </Tag>
                </Tooltip>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 130,
            filters: [
                { text: "Certificate", value: "certificate" },
                { text: "Observation", value: "observation" },
                { text: "Draft", value: "draft" },
            ],
            onFilter: (value, record) => record.type === value,
            render: (type) => {
                const meta = TYPE_META[type] || { label: type, color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
            width: 195,
            filters: [
                { text: "Unlinked Orphan", value: "UNLINKED_ORPHAN" },
                { text: "Superseded Regeneration", value: "SUPERSEDED" },
                { text: "Deleted SRF Item", value: "DELETED_ITEM" },
            ],
            onFilter: (value, record) => record.category === value,
            render: (cat) => {
                const meta = CATEGORY_META[cat] || { label: cat, color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: "Linked Item / SRF",
            key: "linked",
            width: 210,
            render: (_, record) => {
                if (!record.srfitemId && !record.srfNumber) {
                    return <Text type="secondary">Not linked to any item</Text>;
                }
                return (
                    <Space direction="vertical" size={0}>
                        {record.srfNumber && <Text strong>SRF: {record.srfNumber}</Text>}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Item ID: {record.srfitemId}
                            {record.identificationDetails ? ` (${record.identificationDetails})` : ""}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: "Size",
            dataIndex: "sizeBytes",
            key: "sizeBytes",
            width: 110,
            sorter: (a, b) => a.sizeBytes - b.sizeBytes,
            render: (_, record) => <Text strong>{record.sizeFormatted}</Text>,
        },
        {
            title: "Last Modified",
            dataIndex: "modifiedAt",
            key: "modifiedAt",
            width: 175,
            sorter: (a, b) => new Date(a.modifiedAt) - new Date(b.modifiedAt),
            render: (dt) => (dt ? new Date(dt).toLocaleString() : "-"),
        },
        {
            title: "Action",
            key: "action",
            width: 110,
            fixed: "right",
            render: (_, record) => (
                <Popconfirm
                    title="Delete this file permanently?"
                    description={`Frees ${record.sizeFormatted}. Cannot be undone.`}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    onConfirm={() =>
                        executeDelete({ mode: "selected", selectedKeys: [record.key] })
                    }
                >
                    <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>
                        Delete
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div style={{ padding: "8px 0" }}>
            <Space
                style={{
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    flexWrap: "wrap",
                }}
            >
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
                        Back
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                        Unwanted Certificates & Observations
                    </Title>
                </Space>

                <Space wrap>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        loading={loading}
                    >
                        Rescan Disk
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!selectedRowKeys.length || deleting}
                        loading={deleting}
                        onClick={handleDeleteSelected}
                    >
                        Delete Selected ({selectedRowKeys.length})
                        {selectedRowKeys.length ? ` • ${formatBytes(selectedBytes)}` : ""}
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<ClearOutlined />}
                        disabled={safeBulkCount === 0 || deleting}
                        loading={deleting}
                        onClick={handleCleanAllSafe}
                    >
                        Clean All Unlinked & Superseded ({safeBulkCount})
                    </Button>
                </Space>
            </Space>

            <Alert
                type="info"
                showIcon
                icon={<SafetyCertificateOutlined />}
                style={{ marginBottom: 16 }}
                message="Safe Cleanup Protection Enabled"
                description={`Active latest certificates (${summary?.activeFileCount ?? 0} file(s)) are automatically excluded. Files created/modified within the last ${summary?.graceMinutes ?? 60} minutes (${summary?.protectedRecentCount ?? 0} recent file(s)) are also protected from deletion.`}
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ backgroundColor: "#fff1f0", borderRadius: 10 }}>
                        <Text type="secondary">Total Reclaimable</Text>
                        <Title level={4} style={{ margin: "4px 0 0" }}>
                            {summary?.totalFormatted || "0 B"} ({summary?.totalCount ?? 0} files)
                        </Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ backgroundColor: "#fff7e6", borderRadius: 10 }}>
                        <Text type="secondary">Unlinked Orphans</Text>
                        <Title level={4} style={{ margin: "4px 0 0" }}>
                            {summary?.byCategory?.UNLINKED_ORPHAN?.formatted || "0 B"} (
                            {summary?.byCategory?.UNLINKED_ORPHAN?.count ?? 0})
                        </Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ backgroundColor: "#fffbe6", borderRadius: 10 }}>
                        <Text type="secondary">Superseded Regenerations</Text>
                        <Title level={4} style={{ margin: "4px 0 0" }}>
                            {summary?.byCategory?.SUPERSEDED?.formatted || "0 B"} (
                            {summary?.byCategory?.SUPERSEDED?.count ?? 0})
                        </Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card size="small" style={{ backgroundColor: "#f6ffed", borderRadius: 10 }}>
                        <Text type="secondary">Observations vs Certificates</Text>
                        <Title level={4} style={{ margin: "4px 0 0" }}>
                            {summary?.byType?.observation?.count ?? 0} Obs /{" "}
                            {summary?.byType?.certificate?.count ?? 0} Cert
                        </Title>
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={items}
                rowKey="key"
                loading={loading || deleting}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                scroll={{ x: 1000 }}
                locale={{ emptyText: "No unwanted or orphaned certificate files found." }}
            />
        </div>
    );
};

export default UnwantedCertificates;
