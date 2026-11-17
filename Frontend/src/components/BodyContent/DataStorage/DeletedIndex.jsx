import React, { useEffect, useState, useContext, useMemo } from "react";
import { Row, Col, Card, Spin, Tooltip, Typography, Button, Modal, Table, Space, Tag, Popconfirm } from "antd";
import { FileDoneOutlined, FileTextOutlined, ArrowRightOutlined, FileExcelOutlined, ReloadOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import DiskUsageVisualizer from "./DiskUsageVisualizer";
import DeleteItems from "./DeleteIteams";
import config from '../../../utils/config.json'
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";

const { Title, Text, Paragraph } = Typography;


const DeletedIndex = () => {
    const auth = useContext(AuthContext)
    const [loading, setLoading] = useState(true);
    const [deletedData, setDeletedData] = useState([]);
    const [diskUsage, setDiskUsage] = useState(null);
    const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [deletedStats, setDeletedStats] = useState({ srfItems: 0, srf: 0, excel: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch disk usage
                const diskRes = await fetch(config.Calibmaster.URL + "/api/data-storage/disk-usage", {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + auth.token
                    }
                });
                const diskJson = await diskRes.json();
                setDiskUsage(diskJson);

                // Fetch deleted stats
                const statsRes = await fetch(config.Calibmaster.URL + "/api/data-storage/deleted-stats", {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + auth.token
                    }
                });
                const statsJson = await statsRes.json();
                setDeletedStats(statsJson.stats);
                setDeletedData(statsJson.data)
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    const handleRestore = async (id, lab_id, type, showNotification = true) => {

        console.log(id, lab_id, type);

        try {
            const url =
                type === "SRFItem"
                    ? `${config.Calibmaster.URL}/api/data-storage/restoresrf_item`
                    : `${config.Calibmaster.URL}/api/data-storage/restoresrf`;

            const body =
                type === "SRFItem" ? { srf_item_id: id } : { srf_id: id };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (response.ok && result.status === "SUCCESS") {
                if (showNotification) {
                    GlobalNotification.success({
                        title: "Restored",
                        description: result.message || `${type} restored successfully!`
                    });
                }

                setDeletedData((prev) => ({
                    ...prev,
                    [selectedCategoryKey]: (prev[selectedCategoryKey] || []).filter(
                        (item) =>
                            item.srf_item_id !== id && item.srf_id !== id
                    ),
                }));
                setDeletedStats((prev) => {
                    if (type === "SRFItem") {
                        return { ...prev, srfItems: Math.max(0, prev.srfItems - 1) };
                    } else {
                        return { ...prev, srf: Math.max(0, prev.srf - 1) };
                    }
                });
                return true;
            } else {
                if (showNotification) {
                    GlobalNotification.error({
                        title: "Restore Failed",
                        description: result.message || `Failed to restore ${type}`
                    });
                }
                return false;
            }
        } catch (error) {
            console.error("Restore error:", error);
            if (showNotification) {
                GlobalNotification.error({
                    title: "Error",
                    description: `Something went wrong while restoring ${type}`
                });
            }
            return false;
        }
    };


    const handleDeletePermanently = async (id, lab_id, type, showNotification = true) => {

        try {
            const url =
                type === "SRFItem"
                    ? `${config.Calibmaster.URL}/api/data-storage/destoryitem`
                    : `${config.Calibmaster.URL}/api/data-storage/destorysrf`;

            const body = type === "SRFItem" ? { srf_item_id: id, lab_id } : { srf_id: id, lab_id };

            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (response.ok && result.status === "SUCCESS") {
                if (showNotification) {
                    GlobalNotification.success({
                        title: "Deleted Permanently",
                        description: result.message || `${type} permanently deleted successfully!`
                    });
                }

                setDeletedData((prev) => ({
                    ...prev,
                    [selectedCategoryKey]: (prev[selectedCategoryKey] || []).filter(
                        (item) =>
                            item.srf_item_id !== id && item.srf_id !== id
                    ),
                }));
                setDeletedStats((prev) => {
                    if (type === "SRFItem") {
                        return { ...prev, srfItems: Math.max(0, prev.srfItems - 1) };
                    } else {
                        return { ...prev, srf: Math.max(0, prev.srf - 1) };
                    }
                });
                return true;
            } else {
                if (showNotification) {
                    GlobalNotification.error({
                        title: "Delete Failed",
                        description: result.message || `Failed to Delete ${type}`
                    });
                }
                return false;
            }
        } catch (error) {
            console.error("Delete error:", error);
            if (showNotification) {
                GlobalNotification.error({
                    title: "Error",
                    description: `Something went wrong while Delete ${type}`
                });
            }
            return false;
        }
    };


    // ─── Excel-specific handlers ───────────────────────────────────────────────
    const handleRestoreExcel = async (cmeid) => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/calibmasterexcel/restore-calibmaster-excel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
                body: JSON.stringify({ cmeid }),
            });
            const result = await res.json();
            if (res.ok) {
                GlobalNotification.success({
                    title: "Excel Restored",
                    description: result.msg || 'Excel file restored successfully!'
                });
                setDeletedData(prev => ({ ...prev, excel: prev.excel.filter(e => e.cmeid !== cmeid) }));
                setDeletedStats(prev => ({ ...prev, excel: prev.excel - 1 }));
            } else {
                GlobalNotification.error({
                    title: "Restore Failed",
                    description: result.msg || 'Failed to restore Excel file'
                });
            }
        } catch (err) {
            GlobalNotification.error({
                title: "Error",
                description: 'Something went wrong while restoring'
            });
        }
    };

    const handleHardDeleteExcel = async (cmeid) => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/calibmasterexcel/destroy-calibmaster-excel`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
                body: JSON.stringify({ cmeid }),
            });
            const result = await res.json();
            if (res.ok) {
                GlobalNotification.success({
                    title: "Excel Deleted",
                    description: result.msg || 'Excel file permanently deleted!'
                });
                setDeletedData(prev => ({ ...prev, excel: prev.excel.filter(e => e.cmeid !== cmeid) }));
                setDeletedStats(prev => ({ ...prev, excel: Math.max(0, prev.excel - 1) }));
            } else {
                GlobalNotification.error({
                    title: "Delete Failed",
                    description: result.msg || 'Failed to permanently delete Excel file'
                });
            }
        } catch (err) {
            GlobalNotification.error({
                title: "Error",
                description: 'Something went wrong while deleting'
            });
        }
    };


    const handleBulkRestore = (selectedRowKeys) => {
        if (!selectedRowKeys || !selectedRowKeys.length) {
            GlobalNotification.warning({
                title: "Selection Required",
                description: "Please select at least one item to restore."
            });
            return;
        }

        const type = selectedCategoryKey === "srfItems" ? "SRFItem" : "SRF";
        const label = selectedCategoryKey === "srfItems" ? "SRF item(s)" : "SRF(s)";

        Modal.confirm({
            title: "Confirm Restore",
            content: `Are you sure you want to restore ${selectedRowKeys.length} ${label}?`,
            okText: "Restore",
            cancelText: "Cancel",
            okType: "primary",
            onOk: async () => {
                let successCount = 0;
                for (const data of selectedRowKeys) {
                    try {
                        const success = await handleRestore(data.id, data.lab_id, type, false);
                        if (success) successCount++;
                    } catch (err) {
                        console.error("Error restoring:", err);
                    }
                }
                if (successCount > 0) {
                    GlobalNotification.success({
                        title: "Bulk Restore Complete",
                        description: `Successfully restored ${successCount} ${label}.`
                    });
                } else {
                    GlobalNotification.error({
                        title: "Bulk Restore Failed",
                        description: `Failed to restore selected ${label}.`
                    });
                }
            },
        });
    };

    const handleBulkDelete = (selectedRowKeys) => {
        if (!selectedRowKeys || !selectedRowKeys.length) {
            GlobalNotification.warning({
                title: "Selection Required",
                description: "Please select at least one item to delete."
            });
            return;
        }

        const type = selectedCategoryKey === "srfItems" ? "SRFItem" : "SRF";
        const label = selectedCategoryKey === "srfItems" ? "SRF item(s)" : "SRF(s)";

        Modal.confirm({
            title: "Confirm Permanent Delete",
            content: `Are you sure you want to permanently delete ${selectedRowKeys.length} ${label}?`,
            okText: "Delete",
            cancelText: "Cancel",
            okType: "danger",
            onOk: async () => {
                let successCount = 0;
                for (const data of selectedRowKeys) {
                    try {
                        const success = await handleDeletePermanently(data.id, data.lab_id, type, false);
                        if (success) successCount++;
                    } catch (err) {
                        console.error("Error deleting:", err);
                    }
                }
                if (successCount > 0) {
                    GlobalNotification.success({
                        title: "Bulk Delete Complete",
                        description: `Successfully permanently deleted ${successCount} ${label}.`
                    });
                } else {
                    GlobalNotification.error({
                        title: "Bulk Delete Failed",
                        description: `Failed to delete selected ${label}.`
                    });
                }
            },
        });
    };


    const statsData = useMemo(() => [
        { key: "srfItems", title: "Deleted SRF Items", data: deletedStats.srfItems, icon: <FileTextOutlined style={{ fontSize: 32, color: "#d35400" }} />, bgColor: "#fef3e6", tooltip: "Total number of deleted items within SRFs." },
        { key: "srf", title: "Deleted SRFs", data: deletedStats.srf, icon: <FileDoneOutlined style={{ fontSize: 32, color: "#2980b9" }} />, bgColor: "#eaf2f8", tooltip: "Total number of deleted Service Request Forms." },
        { key: "excel", title: "Deleted Excel Files", data: deletedStats.excel ?? 0, icon: <FileExcelOutlined style={{ fontSize: 32, color: "#27ae60" }} />, bgColor: "#eafaf1", tooltip: "Calibmaster Excel sheets moved to trash." },
    ], [deletedStats]);

    // Inline component to render the Excel trash table
    const ExcelTrashTable = () => {
        const data = deletedData.excel || [];
        const columns = [
            { title: 'S.No', key: 'sno', width: 60, align: 'center', render: (_, __, i) => i + 1 },
            { title: 'File Name', dataIndex: 'fileName', key: 'fileName', render: t => <Tag color="green" className="font-mono text-xs">{t}</Tag> },
            { title: 'Procedure', dataIndex: 'procedure', key: 'procedure', render: t => t || 'N/A' },
            { title: 'Instrument', dataIndex: 'instrument', key: 'instrument', render: t => t || 'N/A' },
            {
                title: 'Deleted On', dataIndex: 'deletedAt', key: 'deletedAt', align: 'center',
                render: t => t ? <Space size={4}><CalendarOutlined className="text-slate-400" />{new Date(t).toLocaleDateString()}</Space> : 'N/A'
            },
            {
                title: 'Actions', key: 'actions', align: 'center', width: 200,
                render: (_, record) => (
                    <Space>
                        <Tooltip title="Restore">
                            <Button type="primary" ghost size="small" icon={<ReloadOutlined />} onClick={() => handleRestoreExcel(record.cmeid)}>
                                Restore
                            </Button>
                        </Tooltip>
                        <Popconfirm
                            title="Permanently Delete?"
                            description="This will delete the file from the database and disk. This action cannot be undone."
                            okText="Delete Forever"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleHardDeleteExcel(record.cmeid)}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />}>Delete Forever</Button>
                        </Popconfirm>
                    </Space>
                )
            },
        ];
        return (
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <Space>
                        <Button onClick={() => setSelectedCategoryKey(null)}>← Back</Button>
                        <Title level={4} className="m-0">🗑️ Deleted Excel Files ({data.length})</Title>
                    </Space>
                </div>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="cmeid"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No deleted Excel files' }}
                    className="shadow-sm rounded-xl overflow-hidden"
                />
                <style>{`
                    .ant-table-thead > tr > th { background: #f8fafc !important; font-weight: 700 !important; font-size: 13px !important; }
                    .ant-table-tbody > tr > td { font-size: 13px !important; }
                `}</style>
            </div>
        );
    };



    if (loading) {
        return <div style={styles.spinnerContainer}><Spin size="large" /></div>;
    }

    const selectedStat = selectedCategoryKey ? statsData.find(s => s.key === selectedCategoryKey) : null;

    return (
        <div >
            {!selectedStat ? (
                <>
                    <Row gutter={[24, 32]}>
                        <Col span={24}>
                            <DiskUsageVisualizer diskUsage={diskUsage} />
                        </Col>
                        <Col span={24}>
                            <Title level={2} style={styles.headerTitle}>
                                <span role="img" aria-label="trash can">🗑️</span> Deleted Items Overview
                            </Title>
                            <Row gutter={[24, 24]}>
                                {statsData.map((stat) => (
                                    <Col xs={24} sm={12} md={8} key={stat.key}>
                                        <Tooltip title={stat.tooltip} placement="bottom">
                                            <Card
                                                hoverable
                                                style={{
                                                    ...styles.statCard,
                                                    backgroundColor: stat.bgColor,
                                                    transform: hoveredCard === stat.key ? 'translateY(-8px)' : 'translateY(0)',
                                                    boxShadow: hoveredCard === stat.key ? '0 12px 24px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
                                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                }}
                                                bodyStyle={styles.cardBody}
                                                onMouseEnter={() => setHoveredCard(stat.key)}
                                                onMouseLeave={() => setHoveredCard(null)}
                                            >
                                                <div style={styles.cardContent}>
                                                    <div style={styles.cardHeader}>{stat.icon}<Title level={2} style={styles.statCount}>{stat.data}</Title></div>
                                                    <div style={styles.cardInfo}>
                                                        <Text style={styles.statTitle}>{stat.title}</Text>
                                                        {/* <Text style={styles.detailText}>{stat.data.lastDeleted ? `Last deletion: ${new Date(stat.data.lastDeleted).toLocaleDateString()}` : 'No recent deletions'}</Text> */}
                                                    </div>
                                                    <Button type="text" style={styles.detailsLink} onClick={() => setSelectedCategoryKey(stat.key)}>View Details <ArrowRightOutlined /></Button>
                                                </div>
                                            </Card>
                                        </Tooltip>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                </>
            ) : selectedCategoryKey === 'excel' ? (
                <ExcelTrashTable />
            ) : (
                <DeleteItems
                    items={deletedData[selectedStat.key]}
                    onRestore={handleRestore}
                    onDelete={handleDeletePermanently}
                    onBack={() => setSelectedCategoryKey(null)}
                    categoryTitle={selectedStat.title}
                    categoryKey={selectedStat.key}
                    handleBulkRestore={handleBulkRestore}
                    handleBulkDelete={handleBulkDelete}
                />
            )}
        </div>
    );
};



export default DeletedIndex;

const styles = {
    container: { padding: "24px", backgroundColor: "#f9fafb", minHeight: "100vh", },
    headerTitle: { marginBottom: "16px", fontWeight: 700, color: "#34495e", textAlign: "left" },
    spinnerContainer: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", },
    statCard: {
        borderRadius: "16px",
        border: "none",
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    cardBody: {
        padding: "24px",
        width: '100%',
        flexGrow: 1,
        display: 'flex',
    },
    cardContent: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%', flexGrow: 1 },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' },
    cardInfo: { flexGrow: 1 },
    statCount: { fontSize: "42px", fontWeight: 700, margin: "0 !important", color: "#2c3e50" },
    statTitle: { fontSize: "16px", color: "#34495e", fontWeight: 600, display: 'block' },
    detailText: { fontSize: "13px", color: "#7f8c8d", marginTop: '4px' },
    detailsLink: { marginTop: '24px', fontWeight: 600, color: '#3498db', padding: 0, height: 'auto' },
};