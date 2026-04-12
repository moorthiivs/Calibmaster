import React, { useEffect, useState, useContext, useMemo } from "react";
import { Row, Col, Card, Spin, Tooltip, Typography, Button, message, Modal, } from "antd";
import { FileDoneOutlined, FileTextOutlined, ArrowRightOutlined, } from "@ant-design/icons";
import DiskUsageVisualizer from "./DiskUsageVisualizer";
import DeleteItems from "./DeleteIteams";
import config from '../../../utils/config.js'
import { AuthContext } from "../../../context/auth-context";

const { Title, Text, Paragraph } = Typography;


const DeletedIndex = () => {
    const auth = useContext(AuthContext)
    const [loading, setLoading] = useState(true);
    const [deletedData, setDeletedData] = useState([]);
    const [diskUsage, setDiskUsage] = useState(null);
    const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [deletedStats, setDeletedStats] = useState({ srfItems: 0, srf: 0 });

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



    const handleRestore = async (id, lab_id, type) => {

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
                message.success(result.message || `${type} restored successfully!`);

                setDeletedData((prev) => ({
                    ...prev,
                    [selectedCategoryKey]: prev[selectedCategoryKey].filter(
                        (item) =>
                            item.srf_item_id !== id && item.srf_id !== id
                    ),
                }));
                setDeletedStats((prev) => {
                    if (type === "SRFItem") {
                        return { ...prev, srfItems: prev.srfItems - 1 };
                    } else {
                        return { ...prev, srf: prev.srf - 1 };
                    }
                });

            } else {
                message.error(result.message || `Failed to restore ${type}`);
            }
        } catch (error) {
            console.error("Restore error:", error);
            message.error(`Something went wrong while restoring ${type}`);
        }
    };


    const handleDeletePermanently = async (id, lab_id, type) => {

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
                message.success(result.message || `${type} Perment Deleted successfully!`);

                setDeletedData((prev) => ({
                    ...prev,
                    [selectedCategoryKey]: prev[selectedCategoryKey].filter(
                        (item) =>
                            item.srf_item_id !== id && item.srf_id !== id
                    ),
                }));
                setDeletedStats((prev) => {
                    if (type === "SRFItem") {
                        return { ...prev, srfItems: prev.srfItems - 1 };
                    } else {
                        return { ...prev, srf: prev.srf - 1 };
                    }
                });

            } else {
                message.error(result.message || `Failed to Delete ${type}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            message.error(`Something went wrong while Delete ${type}`);
        }
    };


    const handleBulkRestore = (selectedRowKeys) => {
        if (!selectedRowKeys.length) {
            message.warning("Please select at least one item to restore.");
            return;
        }

        const type = selectedCategoryKey === "srfItems" ? "SRFItem" : "SRF";

        Modal.confirm({
            title: "Confirm Restore",
            content: `Are you sure you want to restore ${selectedRowKeys.length} ${type}(s)?`,
            okText: "Restore",
            cancelText: "Cancel",
            okType: "primary",
            onOk: async () => {
                for (const data of selectedRowKeys) {
                    try {
                        await handleRestore(data.id, data.lab_id, type);
                    } catch (err) {
                        console.error("Error restoring:", err);
                        message.error(`Failed to restore ${type} with ID ${data.id}`);
                    }
                }
            },
        });
    };

    const handleBulkDelete = (selectedRowKeys) => {

        console.log(selectedRowKeys, "selectedRowKeys");

        if (!selectedRowKeys.length) {
            message.warning("Please select at least one item to delete.");
            return;
        }

        console.log(selectedCategoryKey);

        Modal.confirm({
            title: "Confirm Permanent Delete",
            content: `Are you sure you want to permanently delete ${selectedRowKeys.length} item(s)?`,
            okText: "Delete",
            cancelText: "Cancel",
            okType: "danger",
            onOk: async () => {
                for (const data of selectedRowKeys) {
                    await handleDeletePermanently(data.id, data.lab_id, selectedCategoryKey === "srfItems" ? "SRFItem" : "SRF");
                }
            },
        });
    };


    const statsData = useMemo(() => [
        { key: "srfItems", title: "Deleted SRF Items", data: deletedStats.srfItems, icon: <FileTextOutlined style={{ fontSize: 32, color: "#d35400" }} />, bgColor: "#fef3e6", tooltip: "Total number of deleted items within SRFs." },
        { key: "srf", title: "Deleted SRFs", data: deletedStats.srf, icon: <FileDoneOutlined style={{ fontSize: 32, color: "#2980b9" }} />, bgColor: "#eaf2f8", tooltip: "Total number of deleted Service Request Forms." },
    ], [deletedStats]);



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
