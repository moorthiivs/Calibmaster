import { useContext, useEffect, useState } from 'react';
import {
    Table,
    DatePicker,
    Button,
    Select,
    Space,
    Row,
    Col,
    Typography,
    Card,
    Divider,
    Input,
} from 'antd';
import { DownloadOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createStyles } from 'antd-style';
import { AuthContext } from '../../../context/auth-context';
import config from '../../../utils/config.json'
import { usePermissions } from '../../../hooks/usePermissions';

import moment from 'moment';

dayjs.extend(isBetween);

const useStyle = createStyles(({ css, token }) => {
    const { antCls } = token;
    return {
        customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
    };
});


const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;





const InwardReports = () => {
    const auth = useContext(AuthContext)
    const { hasPermission } = usePermissions();
    const { styles } = useStyle();
    const [dateRange, setDateRange] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [tableData, setTableData] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setloading] = useState(false)



    const handleFilter = () => {
        fetchreportData()
    };

    const handleReset = () => {
        setDateRange([]);
        setSelectedCustomer(null);
    };

    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a2',
        });
        doc.text('Inward Report', 14, 15);

        const head = [];
        const headerRow1 = [];
        const headerRow2 = [];
        const bodyColumns = [];

        columns.forEach(col => {
            if (col.children) {
                headerRow1.push({ content: col.title, colSpan: col.children.length, styles: { halign: 'center' } });
                col.children.forEach(child => {
                    headerRow2.push(child.title);
                    bodyColumns.push(child.dataIndex);
                });
            } else {
                headerRow1.push({ content: col.title, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } });
                bodyColumns.push(col.dataIndex);
            }
        });
        head.push(headerRow1);
        head.push(headerRow2);

        const body = tableData.map(row =>
            bodyColumns.map(key => row[key] || '')
        );

        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            headStyles: {
                fillColor: [22, 160, 133], // A professional green
                textColor: 255,
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
        });

        doc.save('InwardReport.pdf');
    };

    const exportToExcel = () => {
        const header1 = [];
        const header2 = [];
        const dataAccessors = [];
        const merges = [];
        let colOffset = 0;

        columns.forEach(col => {
            if (col.children) {
                header1.push(col.title);
                for (let i = 1; i < col.children.length; i++) {
                    header1.push('');
                }
                merges.push({ s: { r: 0, c: colOffset }, e: { r: 0, c: colOffset + col.children.length - 1 } });

                col.children.forEach(child => {
                    header2.push(child.title);
                    dataAccessors.push(child.dataIndex);
                });
                colOffset += col.children.length;
            } else {
                header1.push(col.title);
                header2.push('');
                merges.push({ s: { r: 0, c: colOffset }, e: { r: 1, c: colOffset } });
                dataAccessors.push(col.dataIndex);
                colOffset++;
            }
        });

        const body = tableData.map(row =>
            dataAccessors.map(key => row[key] || '')
        );

        const wsData = [header1, header2, ...body];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges'] = merges;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'InwardReport');
        XLSX.writeFile(wb, 'InwardReport.xlsx');
    };


    const fetchCustomers = async () => {
        if (!hasPermission("LIST_CUSTOMER")) return;
        setloading(true)
        try {
            const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId })
            });
            let { data } = await response.json();
            setCustomerList(data);
        } catch (error) {
            console.log(error);
        } finally {
            setloading(false)
        }
    }

    const fetchreportData = async () => {
        setloading(true)
        try {
            const queryParams = new URLSearchParams();

            if (dateRange?.length === 2) {
                queryParams.append('fromDate', dateRange[0].format('YYYY-MM-DD'));
                queryParams.append('toDate', dateRange[1].format('YYYY-MM-DD'));
            } else if (selectedDate) {
                queryParams.append('date', selectedDate.format('YYYY-MM-DD'));
            }

            if (selectedCustomer) {
                queryParams.append('customer', selectedCustomer);
            }

            console.log(queryParams.toString(), "queryParams");


            const response = await fetch(
                `${config.Calibmaster.URL}/api/inward-report/report?${queryParams.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + auth.token,
                    },
                }
            );

            const result = await response.json();
            if (result.success) {
                setTableData(result.data);
            } else {
                message.error('Failed to fetch inward report');
            }
        } catch (error) {
            console.error(error);
            message.error('Error while fetching inward report');
        } finally {
            setloading(false)
        }
    };

    useEffect(() => {
        fetchCustomers()
        fetchreportData()
    }, [])




    const columns = [
        {
            title: 'Inward No',
            dataIndex: 'inwardNo',
            key: 'inwardNo',
            sorter: (a, b) => (a.inwardNo || '').localeCompare(b.inwardNo || ''),
            filterSearch: true,
            filters: Array.from(
                new Set(tableData.map(item => item.inwardNo))
            ).map(val => ({ text: val, value: val })),
            onFilter: (value, record) => (record.inwardNo || '').toString().includes(value),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => {
                const format = 'DD-MM-YYYY'; // your format
                const dateA = moment(a.date, format).toDate();
                const dateB = moment(b.date, format).toDate();
                return dateA - dateB;
            },
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            sorter: (a, b) => (a.time || '').localeCompare(b.time || ''),
        },
        {
            title: 'Customer',
            dataIndex: 'customer',
            key: 'customer',
            sorter: (a, b) => (a.customer || '').localeCompare(b.customer || ''),
            filterSearch: true,
            filters: Array.from(new Set(tableData.map(item => item.customer)))
                .map(val => ({ text: val, value: val })),

            onFilter: (value, record) => (record.customer || '').includes(value),
        },
        { title: 'Contract Agreement', dataIndex: 'contractAgreement', key: 'contractAgreement' },
        {
            title: 'Description Of Item', dataIndex: 'descriptionOfItem', key: 'descriptionOfItem', sorter: (a, b) => (a.descriptionOfItem || '').localeCompare(b.descriptionOfItem || ''),
            filterSearch: true,
            filters: Array.from(
                new Set(tableData.map(item => item.descriptionOfItem))
            )
                .filter(val => val) // Remove undefined/null
                .map(val => ({ text: val, value: val })),
            onFilter: (value, record) =>
                (record.descriptionOfItem || '').toString().toLowerCase().includes(value.toLowerCase()),
        },

        // {
        //     title: 'Description Of Item',
        //     dataIndex: 'descriptionOfItem',
        //     key: 'descriptionOfItem',
        //     sorter: (a, b) =>
        //         (a.descriptionOfItem || '').localeCompare(b.descriptionOfItem || ''),
        //     filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        //         <div style={{ padding: 8 }}>
        //             <Input
        //                 placeholder="Search description"
        //                 value={selectedKeys[0]}
        //                 onChange={e => {
        //                     setSelectedKeys(e.target.value ? [e.target.value] : []);
        //                     confirm({ closeDropdown: false });
        //                 }}
        //                 onPressEnter={() => confirm()}
        //                 style={{ width: 200, marginBottom: 8, display: 'block' }}
        //             />
        //             <div style={{ display: 'flex', gap: 8 }}>
        //                 <Button
        //                     type="primary"
        //                     size="small"
        //                     onClick={() => confirm()}
        //                 >
        //                     Search
        //                 </Button>
        //                 <Button
        //                     size="small"
        //                     onClick={() => {
        //                         clearFilters();
        //                         confirm();
        //                     }}
        //                 >
        //                     Reset
        //                 </Button>
        //             </div>
        //         </div>
        //     ),
        //     filterIcon: (filtered) => (
        //         <span style={{ color: filtered ? '#1677ff' : undefined }}>🔍</span>
        //     ),
        //     onFilter: (value, record) =>
        //         (record.descriptionOfItem || '')
        //             .toString()
        //             .toLowerCase()
        //             .includes(value.toLowerCase()),
        // },
        { title: 'Assign To', dataIndex: 'assignTo', key: 'assignTo' },
        {
            title: 'Expected Delivery Date',
            dataIndex: 'expectedDeliveryDate',
            key: 'expectedDeliveryDate',
            sorter: (a, b) => new Date(a.expectedDeliveryDate) - new Date(b.expectedDeliveryDate),
        },
        { title: 'ID No.', dataIndex: 'idNo', key: 'idNo' },
        { title: 'Size / Range', dataIndex: 'sizeRange', key: 'sizeRange' },
        { title: 'Make', dataIndex: 'make', key: 'make' },
        {
            title: 'Completion On',
            key: 'completion',
            children: [
                {
                    title: 'Date',
                    dataIndex: 'completionDate',
                    key: 'completionDate',
                    width: 120,
                    sorter: (a, b) => new Date(a.completionDate) - new Date(b.completionDate),
                },
                {
                    title: 'Time',
                    dataIndex: 'completionTime',
                    key: 'completionTime',
                    width: 100,
                    sorter: (a, b) => (a.completionTime || '').localeCompare(b.completionTime || ''),
                },
            ],
        },
        { title: 'Report No', dataIndex: 'reportNo', key: 'reportNo' },
        { title: 'ULR No', dataIndex: 'ulrNo', key: 'ulrNo' },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            filterSearch: true,
            filters: [
                { text: 'John', value: 'John' },
                { text: 'David', value: 'David' },
            ],
            onFilter: (value, record) => (record.name || '').includes(value),
        },
        {
            title: 'Dispatched Date',
            dataIndex: 'dispatchedDate',
            key: 'dispatchedDate',
            sorter: (a, b) => new Date(a.dispatchedDate) - new Date(b.dispatchedDate),
        },
        { title: 'Condition of the MI & Gauges', dataIndex: 'condition', key: 'condition' },
        { title: 'Customer Reference', dataIndex: 'customerReference', key: 'customerReference' },
        {
            title: 'Delayed (In days)',
            dataIndex: 'delayedDays',
            key: 'delayedDays',
            sorter: (a, b) => (a.delayedDays || 0) - (b.delayedDays || 0),
        },
        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    ];



    return (
        <div style={{ backgroundColor: '#f0f2f5' }}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Title level={3} style={{ marginBottom: 20 }}>Inward Reports</Title>

                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <label>Date Range</label>
                            <RangePicker
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates || [])}
                                format="DD-MM-YYYY"
                                style={{ width: '100%' }}
                            />
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <label>Particular Date</label>
                            <DatePicker
                                value={selectedDate}
                                onChange={(val) => setSelectedDate(val)}
                                format="DD-MM-YYYY"
                                style={{ width: '100%' }}
                            />
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <label>Customer</label>
                            <Select
                                allowClear
                                placeholder="Select Customer"
                                value={selectedCustomer}
                                onChange={value => setSelectedCustomer(value)}
                                style={{ width: '100%' }}
                            >
                                {customerList?.map(c => (
                                    <Option key={c.customer_id} value={c.customer_id}>
                                        {c.customer_name}
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </Col>


                    <Col xs={24} sm={24} md={24} lg={6} style={{ marginTop: '10px' }}>
                        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '15px' }}>
                            <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
                                Apply
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>
                                Reset
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Col>
                        <Space>
                            <Button icon={<DownloadOutlined />} onClick={exportToPDF}>
                                Export PDF
                            </Button>
                            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
                                Export Excel
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={tableData}
                    bordered
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    className={styles.customTable}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default InwardReports;
