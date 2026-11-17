/**
 * DEPRECATED: This separate QR Code page is currently not in use.
 * The QR Code generation functionality has been integrated directly into the 'SRF Items List' 
 * action menu for better item-level access and improved workflow.
 */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Card, Typography, Space, Input, Modal, Spin } from 'antd';
import { QrcodeOutlined, DownloadOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import QRCode from 'react-qr-code';
import { AuthContext } from '../../../context/auth-context';
import GlobalNotification from '../../../utils/GlobalNotification';
import config from '../../../utils/config.json';

const { Title, Text } = Typography;

const QRCodePage = () => {
    const [equipments, setEquipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedEq, setSelectedEq] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [sortBy, setSortBy] = useState("latest_srf_item_id");
    const [sortOrder, setSortOrder] = useState("DESC");

    const abortControllerRef = useRef(null);

    const auth = useContext(AuthContext);

    const fetchEquipments = async (p = page, l = limit, s = searchText, sb = sortBy, so = sortOrder) => {
        if (!auth.token || !auth.labId) return;

        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setLoading(true);
            const response = await fetch(`${config.Calibmaster.URL}/api/qr/equipments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    labId: auth.labId,
                    page: p,
                    limit: l,
                    search: s,
                    sortBy: sb,
                    sortOrder: so
                })
            });

            const data = await response.json();
            if (data.code === 200) {
                setEquipments(data.data || []);
                setTotalItems(data.pagination?.totalItems || (data.data?.length || 0));
            } else {
                GlobalNotification.error({
                    title: 'Fetch Failed',
                    description: data.message || 'Failed to fetch equipment list',
                });
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching equipments:', error);
                GlobalNotification.error({
                    title: 'Error',
                    description: 'An error occurred while fetching equipments.',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchEquipments(1, limit, searchText, sortBy, sortOrder);
        }, 350);

        return () => clearTimeout(timer);
    }, [searchText, auth.token, auth.labId]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const handleTableChange = (paginationObj, filtersObj, sorterObj) => {
        const newPage = paginationObj?.current || 1;
        const newLimit = paginationObj?.pageSize || 20;
        let newSortBy = sortBy;
        let newSortOrder = sortOrder;

        if (sorterObj && sorterObj.field) {
            newSortBy = sorterObj.field;
            newSortOrder = sorterObj.order === "ascend" ? "ASC" : "DESC";
        }

        setPage(newPage);
        setLimit(newLimit);
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        fetchEquipments(newPage, newLimit, searchText, newSortBy, newSortOrder);
    };

    const handleShowQR = (record) => {
        setSelectedEq(record);
        setModalVisible(true);
    };

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white"; // Add white background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${selectedEq.identification_details}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const printQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${selectedEq.identification_details}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        .container { text-align: center; padding: 20px; border: 1px dashed #ccc; }
                        h2 { margin-bottom: 5px; }
                        p { margin-top: 0; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${svg.outerHTML}
                        <h2>${selectedEq.identification_details}</h2>
                        <p>${selectedEq.make || 'N/A'} - ${selectedEq.model || 'N/A'}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const columns = [
        {
            title: 'Equipment No',
            dataIndex: 'identification_details',
            key: 'identification_details',
            sorter: (a, b) => a.identification_details.localeCompare(b.identification_details),
            render: text => <Text strong>{text}</Text>
        },
        {
            title: 'Make',
            dataIndex: 'make',
            key: 'make',
            render: text => text || 'N/A'
        },
        {
            title: 'Model',
            dataIndex: 'model',
            key: 'model',
            render: text => text || 'N/A'
        },
        {
            title: 'Serial No',
            dataIndex: 'serial_no',
            key: 'serial_no',
            render: text => text || 'N/A'
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<QrcodeOutlined />} 
                    onClick={() => handleShowQR(record)}
                >
                    View QR
                </Button>
            ),
        },
    ];

    return (
        <Card 
            title={<Title level={4} style={{ margin: 0 }}>Equipment QR Codes</Title>}
            extra={
                <Input 
                    placeholder="Search equipment..." 
                    prefix={<SearchOutlined />} 
                    value={searchText}
                    onChange={handleSearch}
                    style={{ width: 250 }}
                    allowClear
                    size='large'
                />
            }
        >
            <Table 
                columns={columns} 
                dataSource={equipments} 
                rowKey="identification_details"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total: totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title="Equipment QR Code"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="print" icon={<PrinterOutlined />} onClick={printQR}>
                        Print
                    </Button>,
                    <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadQR}>
                        Download PNG
                    </Button>
                ]}
                centered
                width={400}
            >
                {selectedEq && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                        <div 
                            style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px', cursor: 'pointer' }}
                            onClick={() => window.open(selectedEq.qrUrl, '_blank')}
                            title="Click to test the QR code link"
                        >
                            <QRCode 
                                id="qr-code-svg"
                                value={selectedEq.qrUrl} 
                                size={200}
                                level="H"
                            />
                        </div>
                        <Title level={4} style={{ margin: '0 0 8px 0' }}>{selectedEq.identification_details}</Title>
                        <Text type="secondary" style={{ display: 'block' }}>Make: {selectedEq.make || 'N/A'}</Text>
                        <Text type="secondary" style={{ display: 'block' }}>Model: {selectedEq.model || 'N/A'}</Text>
                        <Text type="secondary" style={{ display: 'block' }}>Serial: {selectedEq.serial_no || 'N/A'}</Text>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default QRCodePage;
