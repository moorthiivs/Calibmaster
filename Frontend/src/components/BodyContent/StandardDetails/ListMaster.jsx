import React, { useContext, useState, useEffect, useRef } from 'react';
import { Card, Button as RainbowButton } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faDownload, faQrcode } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from '../../../context/auth-context';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch, useSelector } from 'react-redux';
import EditMaster from './EditMaster';
import { masterlistActions } from '../../../store/masterlist';
import "./table.css";
import { convertDateFormat } from '../../../utils/filters';
import Loader from '../../UI/Loader';
import showConfirmationDialog from '../../../utils/showConfirmationToast';
import QRCode from "react-qr-code";
import { Table, Input, Space, Button, Typography, Tag, Descriptions, Tooltip, Modal, Breadcrumb, Upload, theme } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
    SearchOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ToolOutlined,
    CalendarOutlined,
    BarcodeOutlined,
    InfoCircleOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    SettingOutlined,
    PrinterOutlined,
    QrcodeOutlined,
    CloudUploadOutlined
} from '@ant-design/icons';
import PageHeader from '../../UI/PageHeader';
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import GlobalNotification from '../../../utils/GlobalNotification';
import ReusableTable from '../../Table/ReusableTable';

const { Text, Title } = Typography;
const { Search } = Input;

const ListMaster = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const { token } = theme.useToken();

    const [masterList, setMasterList] = useState([]);
    const [originalList, setOriginalList] = useState([]);
    const [fetchMaster, setFetchMaster] = useState("");
    const [loading, setloading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [qrSelectedEq, setQrSelectedEq] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [sortBy, setSortBy] = useState("master_list_equipment_id");
    const [sortOrder, setSortOrder] = useState("DESC");

    const abortControllerRef = useRef(null);

    const masterListStore = useSelector((state) => state.masterlist.list);

    // Dashboard chart click-through: read equipment filter from URL query params
    const locationMaster = useLocation();
    const navigateMaster = useNavigate();
    const queryParamsMaster = new URLSearchParams(locationMaster.search);
    const dashboardEquipment = queryParamsMaster.get("equipment") || "";
    const [activeEquipmentFilter, setActiveEquipmentFilter] = useState(dashboardEquipment);

    const fetchMasterLists = async (p = page, l = limit, s = searchText, sb = sortBy, so = sortOrder) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setloading(true);
            const querySearch = activeEquipmentFilter ? activeEquipmentFilter : s;
            const data = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    lab_id: auth.labId,
                    is_external: false,
                    page: p,
                    limit: l,
                    search: querySearch,
                    sortBy: sb,
                    sortOrder: so
                })
            });

            let response = await data.json();

            if (response?.code === 200) {
                setMasterList(response?.data || []);
                setTotalItems(response?.pagination?.totalItems || (response?.data?.length || 0));
                dispatch(masterlistActions.changeitems(response?.data || []));
            } else {
                GlobalNotification.error({
                    title: "Fetch Error",
                    description: response?.message || "Failed to fetch master list"
                });
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                GlobalNotification.error({
                    title: "Fetch Error",
                    description: "Something went wrong while fetching master lists"
                });
            }
        } finally {
            setloading(false);
        }
    };

    // Debounced search & filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchMasterLists(1, limit, searchText, sortBy, sortOrder);
        }, activeEquipmentFilter ? 0 : 350);

        return () => clearTimeout(timer);
    }, [searchText, activeEquipmentFilter]);

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
        fetchMasterLists(newPage, newLimit, searchText, newSortBy, newSortOrder);
    };

    const clearEquipmentFilter = () => {
        setActiveEquipmentFilter("");
        setSearchText("");
        navigateMaster(locationMaster.pathname, { replace: true });
    };

    // -------- Columns --------
    const handleShowQR = async (record) => {
        setQrLoading(true);
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/qr/generate-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({ lab_id: auth.labId, identification_details: record.uid })
            });
            const data = await response.json();
            if (data.qrUrl) {
                setQrSelectedEq({ ...record, qrUrl: data.qrUrl });
                setQrModalVisible(true);
            } else {
                GlobalNotification.error({ title: 'Error', description: 'Failed to generate QR token.' });
            }
        } catch (error) {
            console.error('Error fetching QR token:', error);
            GlobalNotification.error({ title: 'Error', description: 'An error occurred while generating QR.' });
        } finally {
            setQrLoading(false);
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg-master");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            const extraHeight = 70;
            canvas.width = img.width + 20;
            canvas.height = img.height + extraHeight + 20;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw border
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

            // Draw image
            ctx.drawImage(img, 10, 10);

            // Draw text
            ctx.fillStyle = "black";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "left";

            const leftPad = 25;
            const topPad = img.height + 25;

            const calDate = qrSelectedEq.date_of_last_calibration_date ? dayjs(qrSelectedEq.date_of_last_calibration_date).format('DD.MM.YYYY') : '-';
            const dueDate = qrSelectedEq.calibration_valid_upto ? dayjs(qrSelectedEq.calibration_valid_upto).format('DD.MM.YYYY') : '-';

            ctx.fillText(`Eqp. No.:   ${qrSelectedEq.uid || '-'}`, leftPad, topPad);
            ctx.fillText(`Cal. Date:  ${calDate}`, leftPad, topPad + 22);
            ctx.fillText(`Due Date: ${dueDate}`, leftPad, topPad + 44);

            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_Master_${qrSelectedEq.uid}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const printQR = () => {
        const svg = document.getElementById("qr-code-svg-master");
        if (!svg) return;

        const calDate = qrSelectedEq.date_of_last_calibration_date ? dayjs(qrSelectedEq.date_of_last_calibration_date).format('DD.MM.YYYY') : '-';
        const dueDate = qrSelectedEq.calibration_valid_upto ? dayjs(qrSelectedEq.calibration_valid_upto).format('DD.MM.YYYY') : '-';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${qrSelectedEq.uid}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        .container { 
                            text-align: center; 
                            padding: 15px 15px 20px 15px; 
                            border: 1px solid #000; 
                            display: inline-block;
                        }
                        .qr-code { margin-bottom: 10px; }
                        .details {
                            text-align: left;
                            font-size: 15px;
                            font-family: Arial, sans-serif;
                            font-weight: bold;
                            margin: 0 auto;
                            display: inline-block;
                            width: 100%;
                            padding-left: 10px;
                        }
                        .details div { margin-bottom: 5px; }
                        .label { display: inline-block; width: 80px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="qr-code">${svg.outerHTML}</div>
                        <div class="details">
                            <div><span class="label">Eqp. No.:</span> ${qrSelectedEq.uid || '-'}</div>
                            <div><span class="label">Cal. Date:</span> ${calDate}</div>
                            <div><span class="label">Due Date:</span> ${dueDate}</div>
                        </div>
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
            title: 'S. No',
            key: 'sno',
            width: 70,
            align: 'center',
            render: (_, __, index) => <Text type="secondary" strong>{index + 1}</Text>,
        },
        {
            title: 'Equipment Details',
            key: 'equipment_details',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong className="text-blue-600">{record.name_of_equipment}</Text>
                    <Space size={4}><BarcodeOutlined className="text-slate-400" /><Text type="secondary" className="text-xs">{record.uid}</Text></Space>
                </Space>
            ),
            sorter: (a, b) => a.name_of_equipment.localeCompare(b.name_of_equipment),
        },
        {
            title: 'Standard',
            dataIndex: 'standard_maintained',
            key: 'standard_maintained',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Range & Specs',
            key: 'specs',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text className="text-xs font-medium">{record.range}</Text>
                    <Text type="secondary" className="text-[10px]">Model: {record.model_type}</Text>
                </Space>
            ),
        },
        {
            title: 'Make',
            dataIndex: 'make',
            key: 'make',
            render: (text) => <Text className="text-slate-600">{text}</Text>,
        },
        {
            title: 'Certificate',
            key: 'certificate',
            align: 'center',
            render: (_, row) => {
                const hasCertificate = row.mastercertificate_filename &&
                    row.mastercertificate_filename.trim() !== "" &&
                    row.mastercertificate_filename !== "null" &&
                    row.mastercertificate_filename !== "undefined" &&
                    row.certificate_file_exists;
                console.log(row.mastercertificate_filename, " row.mastercertificate_filename");

                return hasCertificate ? (
                    <Tooltip title="View Certificate">
                        <Button
                            type="primary"
                            ghost
                            shape="circle"
                            icon={<EyeOutlined />}
                            onClick={() => masterCertificateHandler(row)}
                        />
                    </Tooltip>
                ) : (
                    <Tooltip title="Upload Certificate">
                        <Upload
                            beforeUpload={(file) => handleUpload(file, row)}
                            showUploadList={false}
                            accept=".pdf,.jpg,.jpeg,.png"
                        >
                            <Button
                                type="dashed"
                                shape="circle"
                                icon={<CloudUploadOutlined className="text-blue-500" />}
                            />
                        </Upload>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_, row) => {
                const hasCertificate = row.mastercertificate_filename &&
                    row.mastercertificate_filename.trim() !== "" &&
                    row.mastercertificate_filename !== "null" &&
                    row.mastercertificate_filename !== "undefined" &&
                    row.certificate_file_exists;
                return (
                    <Space>
                        <Tooltip title={!hasCertificate ? 'Certificate not uploaded' : 'View QR'} className={!hasCertificate ? 'opacity-50 cursor-not-allowed' : ''}>
                            <Button
                                type="text"
                                icon={<BarcodeOutlined className="text-emerald-600" />}
                                onClick={() => handleShowQR(row)}
                                disabled={!hasCertificate}
                            />
                        </Tooltip>
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                icon={<EditOutlined className="text-blue-600" />}
                                onClick={() => MasterViewHandler(row)}
                            />
                        </Tooltip>
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(row)}
                            />
                        </Tooltip>
                    </Space>
                )
            },
        }
    ];

    // -------- Expanded Row --------
    const expandedRowRender = (record) => (
        <div className="p-4 bg-slate-50/50 dark:bg-transparent">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* General Info */}
                <div className="bg-white dark:bg-[#1f1f1f] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <InfoCircleOutlined />
                        </div>
                        <Text className="text-base font-bold text-slate-800 dark:text-slate-200">General Information</Text>
                    </div>
                    <Descriptions column={1} size="small" className="master-descriptions">
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Year of Make</Text>}>{record.year_Of_make}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Serial No.</Text>}>
                            <Tag color="cyan" className="font-mono m-0">{record.serial_no}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Asset Number</Text>}>
                            <Text strong>{record.asset_number}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Department</Text>}>
                            <Space size={4}><EnvironmentOutlined className="text-slate-400" />{record.department}</Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Equipment Status</Text>}>
                            <Tag color={record.equipment_status === 'Active' ? 'success' : 'warning'} icon={<CheckCircleOutlined />}>
                                {record.equipment_status}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Technical Specs */}
                <div className="bg-white dark:bg-[#1f1f1f] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <ToolOutlined />
                        </div>
                        <Text className="text-base font-bold text-slate-800 dark:text-slate-200">Technical Specifications</Text>
                    </div>
                    <Descriptions column={1} size="small" className="master-descriptions">
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Range</Text>}>{record.range}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Least Count</Text>}>{record.least_Count}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Product Tolerance</Text>}>{record.least_product_tolerance}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Accuracy</Text>}>{record.accuracy}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Traceability</Text>}>
                            <Text type="secondary" className="italic">{record.traceability || 'N/A'}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Calibration Details */}
                <div className="bg-white dark:bg-[#1f1f1f] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CalendarOutlined />
                        </div>
                        <Text className="text-base font-bold text-slate-800 dark:text-slate-200">Calibration Details</Text>
                    </div>
                    <Descriptions column={1} size="small" className="master-descriptions">
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Receipt Date</Text>}>{convertDateFormat(record.receipt_date)}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Placed In Service</Text>}>{convertDateFormat(record.date_placed_in_service)}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Last Calibration</Text>}>
                            <Text strong className="text-blue-600">{convertDateFormat(record.date_of_last_calibration_date)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Certificate No.</Text>}>
                            <Tag color="blue" className="font-mono m-0">{record.calibration_certificate_no}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Agency</Text>}>{record.calibration_agency}</Descriptions.Item>
                        <Descriptions.Item label={<Text className="text-slate-500 font-medium text-xs">Frequency</Text>}>
                            <Tag color="orange" size="small">{record.calibration_frequency}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </div>

            {record.remark && (
                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
                    <Space align="start">
                        <InfoCircleOutlined className="text-amber-500 mt-1" />
                        <div>
                            <Text strong className="text-amber-800 dark:text-amber-400 block text-xs">Remarks:</Text>
                            <Text className="text-amber-700 dark:text-amber-200 text-sm">{record.remark}</Text>
                        </div>
                    </Space>
                </div>
            )}
        </div>
    );

    // -------- Download Excel --------
    const downloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("MasterList");

        worksheet.columns = [
            { header: "S. No", key: "sno", width: 8 },
            { header: "Instrument / Gauge Description", key: "desc", width: 30 },
            { header: "Instrument / Gauge Number", key: "gaugeNo", width: 20 },
            { header: "Range", key: "range", width: 15 },
            { header: "Least Count", key: "leastCount", width: 15 },
            { header: "SI.NO", key: "sino", width: 15 },
            { header: "Make", key: "make", width: 15 },
            { header: "Model", key: "model", width: 15 },
            { header: "Department", key: "department", width: 20 },
            { header: "Calibration Frequency", key: "calibFreq", width: 20 },
            { header: "Date of Issue", key: "issueDate", width: 20 },
            { header: "Calibrated Date", key: "calibDate", width: 20 },
            { header: "Calibration Valid Upto", key: "validUpto", width: 25 },
            { header: "Remark", key: "remark", width: 25 },
        ];


        masterList.forEach((item, index) => {
            worksheet.addRow({
                sno: index + 1,
                desc: item.name_of_equipment,
                gaugeNo: item.serial_no,
                range: item.range,
                leastCount: item.least_Count,
                sino: item.serial_no,
                make: item.make,
                model: item.model_type,
                department: item.department,
                calibFreq: item.calibration_frequency,
                issueDate: item.year_Of_make ? dayjs(item.year_Of_make).format("DD-MM-YYYY") : "",
                calibDate: item.date_of_last_calibration_date ? dayjs(item.date_of_last_calibration_date).format("DD-MM-YYYY") : "",
                validUpto: item.calibration_valid_upto ? dayjs(item.calibration_valid_upto).format("DD-MM-YYYY") : "",
                remark: item.remark,
            });
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, size: 12 };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "D9E1F2" }, // light blue background
            };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Optional: Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        // Export file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "MasterList.xlsx";
        link.click();
    };


    const handleUpload = (file, record) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result;
            try {
                setloading(true);
                const response = await fetch(`${config.Calibmaster.URL}/api/master-list-equipments/upload-certificate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.token}`,
                    },
                    body: JSON.stringify({
                        master_list_equipment_id: record.master_list_equipment_id,
                        lab_id: auth.labId,
                        master_calibration: base64
                    })
                });
                const data = await response.json();
                if (data.code === 200) {
                    GlobalNotification.success({
                        title: 'Success',
                        description: 'Certificate uploaded successfully'
                    });
                    fetchMasterLists();
                } else {
                    GlobalNotification.error({
                        title: 'Error',
                        description: data.message || 'Upload failed'
                    });
                }
            } catch (error) {
                GlobalNotification.error({
                    title: 'Error',
                    description: 'Something went wrong while uploading certificate'
                });
            } finally {
                setloading(false);
            }
        };
        reader.readAsDataURL(file);
        return false; // Prevent auto-upload
    };
    const MasterViewHandler = (data) => {
        setFetchMaster(data);
        setEditModalOpen(true);
    }

    const viewModalHandler = () => {
        fetchMasterLists();
        setEditModalOpen(false);
    };

    const masterCertificateHandler = (data) => {
        viewCertificateHandler(data.mastercertificate_filename);
    }

    const viewCertificateHandler = async (filename) => {
        try {
            const response = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/view-certificate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ filename })
            });
            if (!response.ok) throw new Error("File Not Found");

            let blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (error) {
            GlobalNotification.error({
                title: "View Error",
                description: "Failed to View Master Certificate"
            });
        }
    };

    const handleDelete = async (row) => {
        try {
            const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");
            if (!confirmDelete) return;

            setloading(true);
            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-equipments/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token
                },
                body: JSON.stringify({
                    master_list_equipment_id: row.master_list_equipment_id,
                })
            });

            const result = await response.json();
            if (response.ok) {
                fetchMasterLists();
                GlobalNotification.success({
                    title: "Deleted",
                    description: result.response || "Master equipment deleted successfully"
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setloading(false);
        }
    };

    return (
        <div className="p-6">
            {loading && <Loader />}
            <PageHeader
                title="List of Master Equipments"
                breadcrumbItems={[
                    { title: 'Dashboard' },
                    { title: 'Master' },
                    { title: 'Master List' },
                ]}
                searchText={searchText}
                onSearchChange={handleSearch}
                searchPlaceholder="Search by name, UID, serial no, or asset..."
                extraAction={
                    <Button
                        type="default"
                        size="large"
                        icon={<DownloadOutlined />}
                        onClick={downloadExcel}
                        className="h-11 rounded-xl border-slate-200 hover:text-emerald-600 hover:border-emerald-600 transition-all flex items-center"
                    >
                        Export Excel
                    </Button>
                }
                showActionButton={false}
            />

            <div className="shadow-sm border border-slate-200 rounded-xl overflow-hidden" style={{ background: token.colorBgContainer }}>

                {/* Dashboard equipment filter banner */}
                {activeEquipmentFilter && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 flex-shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        <span className="text-sm text-blue-800 font-medium flex-1">
                            Filtered by: Equipment = <strong>{activeEquipmentFilter}</strong>
                        </span>
                        <button
                            onClick={clearEquipmentFilter}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
                            title="Clear filter"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                )}
                <ReusableTable
                    columns={columns}
                    data={masterList}
                    expandable={{
                        expandedRowRender,
                        expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                                <SettingOutlined className="text-blue-600 cursor-pointer" onClick={e => onExpand(record, e)} />
                            ) : (
                                <SettingOutlined className="text-slate-400 cursor-pointer" onClick={e => onExpand(record, e)} />
                            )
                    }}
                    rowKey="master_list_equipment_id"
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
                    className="master-table"
                />

                <style>{`
                    .master-table .ant-table-thead > tr > th {
                        font-weight: 700 !important;
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                    }
                    .master-table .ant-table-tbody > tr > td {
                        font-size: 13px !important;
                        padding: 12px 16px !important;
                    }
                    .master-table .ant-table-row:hover {
                        cursor: pointer;
                    }
                    .master-descriptions .ant-descriptions-item-label {
                        width: 140px;
                    }
                `}</style>
            </div>

            {editModalOpen && (
                <EditMaster
                    isopen={editModalOpen}
                    onclose={viewModalHandler}
                    fetchMaster={fetchMaster}
                />
            )}

            {/* Equipment QR Code Modal */}
            <Modal
                title="Master Equipment QR Code"
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
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
                {qrSelectedEq && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                        <div
                            style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px', cursor: 'pointer' }}
                            onClick={() => window.open(qrSelectedEq.qrUrl, '_blank')}
                            title="Click to test the QR code link"
                        >
                            <QRCode
                                id="qr-code-svg-master"
                                value={qrSelectedEq.qrUrl}
                                size={200}
                                level="H"
                            />
                        </div>
                        <Title level={4} style={{ margin: '0 0 8px 0' }}>{qrSelectedEq.uid}</Title>
                        <Text type="secondary" style={{ display: 'block' }}>Name: {qrSelectedEq.name_of_equipment || 'N/A'}</Text>
                        <Text type="secondary" style={{ display: 'block' }}>Make: {qrSelectedEq.make || 'N/A'}</Text>
                        <Text type="secondary" style={{ display: 'block' }}>Model: {qrSelectedEq.model_type || 'N/A'}</Text>
                        <Text type="secondary" style={{ display: 'block' }}>Serial: {qrSelectedEq.serial_no || 'N/A'}</Text>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ListMaster;
