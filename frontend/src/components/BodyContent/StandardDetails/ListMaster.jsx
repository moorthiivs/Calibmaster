import React, { useContext, useState, useEffect } from 'react';
import { Card, Button as RainbowButton } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faDownload } from "@fortawesome/free-solid-svg-icons";
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
import { Table, Input, Space, Button, notification } from "antd";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
const { Search } = Input;

const ListMaster = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [masterList, setMasterList] = useState([]);
    const [originalList, setOriginalList] = useState([]);
    const [fetchMaster, setFetchMaster] = useState("");
    const [loading, setloading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const masterListStore = useSelector((state) => state.masterlist.list);

    const fetchMasterLists = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            });

            let response = await data.json();

            if (response?.code === 200) {
                setMasterList(response?.data);
                setOriginalList(response?.data);   // keep copy for search reset
                dispatch(masterlistActions.changeitems(response?.data));
            } else {
                notification.error({
                    message: "Failed to fetch master list",
                    description: "",
                });
            }
        } catch (error) {
            notification.error({
                message: "Something went wrong",
                description: "",
            });
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        fetchMasterLists();
    }, []);

    // -------- Columns --------
    const columns = [
        {
            title: 'S. No',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text) => <b>{text}</b>,
        },
        {
            title: 'Standard Maintained',
            dataIndex: 'standard_maintained',
            key: 'standard_maintained',
        },
        {
            title: 'Name Of Equipment',
            dataIndex: 'name_of_equipment',
            key: 'name_of_equipment',
        },
        {
            title: 'UID',
            dataIndex: 'uid',
            key: 'uid',
        },
        {
            title: 'Range',
            dataIndex: 'range',
            key: 'range',
        },
        {
            title: 'Make',
            dataIndex: 'make',
            key: 'make',
        },
        {
            title: 'Model Type',
            dataIndex: 'model_type',
            key: 'model_type',
        },
        {
            title: 'Master Certificate',
            key: 'mastercertificate_filename',
            render: (_, row) => (
                <Button
                    type="link"
                    onClick={() => masterCertificateHandler(row)}
                    disabled={!row.mastercertificate_filename}
                >
                    View
                </Button>
            )
        },
        {
            title: 'Edit',
            key: 'edit',
            render: (_, row) => (
                <Button type="primary" onClick={() => MasterViewHandler(row)}>Edit</Button>
            )
        },
        {
            title: 'Delete',
            key: 'delete',
            render: (_, row) => (
                <Button danger onClick={() => handleDelete(row)}>Delete</Button>
            )
        },
    ];

    // -------- Expanded Row --------
    const expandedRowRender = (data) => (
        <div className="dataContainer">
            <p><b>Year Of Make:</b> {data.year_Of_make}</p>
            <p><b>Serial No:</b> {data.serial_no}</p>
            <p><b>Asset Number:</b> {data.asset_number}</p>
            <p><b>Receipt Date:</b> {convertDateFormat(data.receipt_date)}</p>
            <p><b>Date Placed In Service:</b> {convertDateFormat(data.date_placed_in_service)}</p>
            <p><b>Range:</b> {data.range}</p>
            <p><b>Least Count:</b> {data.least_Count}</p>
            <p><b>Least Product Tolerance:</b> {data.least_product_tolerance}</p>
            <p><b>Accuracy:</b> {data.accuracy}</p>
            <p><b>Department:</b> {data.department}</p>
            <p><b>Date Of Last Calibration:</b> {convertDateFormat(data.date_of_last_calibration_date)}</p>
            <p><b>Calibration Certificate No:</b> {data.calibration_certificate_no}</p>
            <p><b>Calibration Frequency:</b> {data.calibration_frequency}</p>
            <p><b>Calibration Agency:</b> {data.calibration_agency}</p>
            <p><b>Calibrated By:</b> {data.calibrated_by}</p>
            <p><b>Equipment Status:</b> {data.equipment_status}</p>
            <p><b>Traceability:</b> {data.traceability}</p>
            <p><b>Remark:</b> {data.remark}</p>
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


    // -------- Handlers --------
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
            notification.error({
                message: "Failed to View Master Certificate",
                description: "",
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
                notification.success({
                    message: `${result.response}`,
                    description: "",
                    duration: 1
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setloading(false);
        }
    };


    const searchAssetIdentificationNoFunction = (query) => {
        const cleanQuery = query.trim();
        if (cleanQuery !== "") {
            const regex = new RegExp(cleanQuery, "i");
            const result = originalList.filter(
                (item) => regex.test((item.asset_number || "").trim())
            );
            setMasterList(result);
        } else {
            setMasterList(originalList);
        }
    };

    const searchEquipmentNameFunction = (query) => {
        const cleanQuery = query.trim();
        if (cleanQuery !== "") {
            const regex = new RegExp(cleanQuery, "i");
            const result = originalList.filter(
                (item) => regex.test((item.name_of_equipment || "").trim())
            );
            setMasterList(result);
        } else {
            setMasterList(originalList);
        }
    };

    const searchEquipmentSerialNoFunction = (query) => {
        const cleanQuery = query.trim();
        if (cleanQuery !== "") {
            const regex = new RegExp(cleanQuery, "i");
            const result = originalList.filter(
                (item) => regex.test((item.serial_no || "").trim())
            );
            setMasterList(result);
        } else {
            setMasterList(originalList);
        }
    };

    const searchEquipmentIdnoFunction = (query) => {
        const cleanQuery = query.trim();
        if (cleanQuery !== "") {
            const regex = new RegExp(cleanQuery, "i");
            const result = originalList.filter(
                (item) => regex.test((item.uid || "").trim())
            );
            setMasterList(result);
        } else {
            setMasterList(originalList);
        }
    };

    return (
        <div className="users__containers">
            <Card className="users__cards">
                <div className="users__label" style={{ textAlign: "center" }}>
                    <h3 className="text-lg font-bold my-5">Master List Of Equipments</h3>
                </div>

                <Space
                    style={{
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Search
                            placeholder="Search by Asset Number"
                            allowClear
                            onChange={(e) => searchAssetIdentificationNoFunction(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Search
                            placeholder="Search by Equipment Name"
                            allowClear
                            onChange={(e) => searchEquipmentNameFunction(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Search
                            placeholder="Search by Serial No."
                            allowClear
                            onChange={(e) => searchEquipmentSerialNoFunction(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Search
                            placeholder="Search by ID No."
                            allowClear
                            onChange={(e) => searchEquipmentIdnoFunction(e.target.value)}
                            style={{ width: 200 }}
                        />
                    </div>
                    <Button
                        type="primary"
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        onClick={downloadExcel}
                    >
                        Download Excel
                    </Button>
                </Space>


                <Table
                    columns={columns}
                    dataSource={masterList}
                    expandable={{ expandedRowRender }}
                    rowKey="master_list_equipment_id"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    scroll={{ x: true, }}
                />

                {editModalOpen && (
                    <EditMaster
                        isopen={editModalOpen}
                        onclose={viewModalHandler}
                        fetchMaster={fetchMaster}
                    />
                )}
            </Card>
        </div>
    )
};

export default ListMaster;
