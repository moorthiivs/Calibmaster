import { Modal, Table, Button, Switch, Tooltip, Card, Descriptions, Space, Typography, Divider, DatePicker, Alert, Row, Col } from "antd";
import {
    CalendarOutlined,
    CloseOutlined,
    FilePdfOutlined,
    WarningOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    FileDoneOutlined,
    SafetyCertificateOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import { srfitemsActions } from "../../../store/srfitems";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import StatusBadge from "../../UI/StatusBadge";
import config from "../../../utils/config.json";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import { usePermissions } from "../../../hooks/usePermissions";

const { Title, Text } = Typography;

const UpdateCalibrationStatus = (props) => {
    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const { hasPermission } = usePermissions();
    const selecteditems = useSelector((state) => state.selecteditems.list);

    const [isLoaded, setIsLoaded] = useState(true);
    const [srf, setSRF] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [calibrationDate, setCalibrationDate] = useState(dayjs());
    const [reportGenerateDate, setReportGenerateDate] = useState(dayjs());
    const [sendDraft, setSendDraft] = useState(false);
    const [canGenerateCertificate, setCanGenerateCertificate] = useState(false);
    const [itemsVerifyStatus, setItemsVerifyStatus] = useState({});
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        fetchCMSSettings();
    }, []);

    useEffect(() => {
        if (selecteditems.length > 0) {
            verifyAllItems();
        }
    }, [selecteditems.length]);

    console.log(props.item);

    // Derived: true if ANY selected item has already been calibrated (status !== "Not Calibrated")
    const hasAlreadyCalibrated = Array.isArray(props.item)
        ? props.item.some(item => item.status !== "Not Calibrated")
        : props.item?.status !== "Not Calibrated";
    
    const fetchCMSSettings = async () => {
        try {
            const response = await fetch(config.Calibmaster.URL + "/api/cms-permissions-setting/fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth?.token,
                },
                body: JSON.stringify({ lab_id: auth?.labId, userId: auth.userId })
            });

            const data = await response.json();
            const { result } = data;
            const genPerm = result.find(item => item.is_enable && item.setting_name === "GENERATE_CERTIFICATE");
            if (genPerm) setCanGenerateCertificate(true);
        } catch (error) {
            console.error("Error fetching CMS settings:", error);
        }
    };

    const verifyAllItems = async () => {
        setIsVerifying(true);
        const status = { ...itemsVerifyStatus };

        for (const item of selecteditems) {
            // Only verify if not already verified or if explicitly needed
            if (!status[item.srf_item_id]) {
                try {
                    const response = await fetch(config.Calibmaster.URL + "/api/generate-certificate/verify_certificate", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                        body: JSON.stringify({
                            lab_id: auth.labId,
                            srf_id: item.srf_id,
                            srf_item_id: item.srf_item_id,
                            userId: auth.userId
                        })
                    });
                    const data = await response.json();
                    status[item.srf_item_id] = data;
                } catch (error) {
                    console.error(`Error verifying item ${item.srf_item_id}:`, error);
                }
            }
        }
        setItemsVerifyStatus(status);
        setIsVerifying(false);
    };

    const removeItemHandler = (id) => {
        const newList = selecteditems.filter(item => item.srf_item_id !== id);
        dispatch(selecteditemsActions.changeselecteditems(newList));
    };

    useEffect(() => {
        if (props?.srfid) {
            getSRFDetail();
        }
    }, [props?.srfid]);

    const getSRFDetail = async () => {
        if (props?.srfid) {
            setIsLoaded(false);
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ srfId: props?.srfid, srfNo: props?.srfNo, userId: auth.userId }),
            };

            try {
                const response = await fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions);
                const data = await response.json();
                setIsLoaded(true);

                if (data?.code === 200) {
                    setSRF(data.data.srf);
                    dispatch(srfitemsActions.changesrfitems(data.data.items));
                } else {
                    GlobalNotification.error({
                        title: "Fetch Error",
                        description: data.message || "Error while Getting SRF Detail!!"
                    });
                }
            } catch (err) {
                GlobalNotification.error({
                    title: "Network Error",
                    description: "Error while Getting SRF Detail!!"
                });
                setIsLoaded(true);
            }
        }
    };

    async function fetchSRFItems() {
        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
            };
            const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
            const { data } = await response.json();
            const getSRFList = data.items.map((item, index) => ({ ...item, slNo: index + 1 }));
            dispatch(childSrfItemsActions.changesrfitems(getSRFList));
        } catch (error) {
            console.error(error);
        }
    }

    const updateBulkCalbrationHandler = async (mode) => {
        if (!calibrationDate) {
            return GlobalNotification.warning({
                title: "Date Required",
                description: "Please select a calibration date"
            });
        }
        if (mode === 2 && !reportGenerateDate) {
            return GlobalNotification.warning({
                title: "Date Required",
                description: "Please select a report generation date"
            });
        }

        Modal.confirm({
            title: mode === 1 ? "Confirm Calibration" : "Confirm Calibration & Report",
            content: `Are you sure you want to ${mode === 1 ? 'mark as calibrated' : 'calibrate and generate reports for'} the selected items?`,
            okText: "Confirm",
            cancelText: "Cancel",
            centered: true,
            onOk: async () => {
                try {
                    setIsLoading(true);
                    const requestBody = {
                        lab_id: auth?.labId,
                        mode: mode,
                        items: selecteditems,
                        srf_id: props?.srfid,
                        calibration_done_by_empname: auth.name,
                        calibrationDoneDate: calibrationDate.toDate(),
                        report_done_date: mode === 2 ? reportGenerateDate.toDate() : null,
                        sendDraft: sendDraft,
                        userId: auth.userId
                    };

                    const requestOptions = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                        body: JSON.stringify(requestBody),
                    };

                    const response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-calibration-status", requestOptions);
                    const data = await response.json();

                    if (data?.code === 201) {
                        GlobalNotification.success({
                            title: data.message,
                        });
                        dispatch(selecteditemsActions.changeselecteditems([]));
                        await getSRFDetail();
                        await fetchSRFItems();
                        props.onclose();
                    } else {
                        GlobalNotification.error({
                            title: "Update Failed",
                            description: data.message || "Failed to update status"
                        });
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    const updateBulkReportHandler = async () => {
        if (!reportGenerateDate) {
            return GlobalNotification.warning({
                title: "Date Required",
                description: "Please select a report generation date"
            });
        }

        Modal.confirm({
            title: "Confirm Report Generation",
            content: "Are you sure you want to mark the selected items as report generated?",
            okText: "Confirm",
            cancelText: "Cancel",
            centered: true,
            onOk: async () => {
                try {
                    setIsLoading(true);
                    const requestBody = {
                        lab_id: auth?.labId,
                        items: selecteditems,
                        srf_id: props?.srfid,
                        report_done_by_empname: auth.name,
                        report_done_date: reportGenerateDate.toDate(),
                        calibrationDoneDate: calibrationDate ? calibrationDate.toDate() : null,
                        userId: auth.userId
                    };

                    const requestOptions = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                        body: JSON.stringify(requestBody),
                    };

                    const response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-report-generation-status", requestOptions);
                    const data = await response.json();

                    if (data?.code === 201) {
                        GlobalNotification.success({
                            title: data.message,
                        });
                        dispatch(selecteditemsActions.changeselecteditems([]));
                        await getSRFDetail();
                        await fetchSRFItems();
                        props.onclose();
                    } else {
                        GlobalNotification.error({
                            title: "Update Failed",
                            description: data.message || "Failed to update status"
                        });
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    if (!isLoaded || isLoading) return <Loader />;

    return (
        <Modal
            title={<Title level={4} className="m-0 text-center w-full">Update Calibration Status</Title>}
            open={props.isopen}
            onCancel={props.onclose}
            width={1200}
            footer={null}
            destroyOnClose
            centered
        >
            {srf && (
                <div className="flex flex-col gap-6 p-2 font-sans">
                    {/* SRF Header Information */}
                    <Card size="small" className="bg-slate-50 border-none shadow-sm">
                        <Descriptions title="SRF Information" bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="SRF Number">{srf?.srf_number}</Descriptions.Item>
                            <Descriptions.Item label="SRF Date">{convertDateFormat(srf?.created_timestamp)}</Descriptions.Item>
                            <Descriptions.Item label="Customer DC">{srf?.customer_dc}</Descriptions.Item>
                            <Descriptions.Item label="Customer DC Date">{convertDateFormat(srf?.customer_dc_date)}</Descriptions.Item>
                            <Descriptions.Item label="Company Name" span={2}>{srf?.customer?.customer_name}</Descriptions.Item>
                            <Descriptions.Item label="Company Address" span={2}>
                                {[srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3].filter(Boolean).join(", ")}
                            </Descriptions.Item>
                            {hasPermission("EDIT_SRF") && (
                                <>
                                    <Descriptions.Item label="Contact Person">{srf?.contact_name}</Descriptions.Item>
                                    <Descriptions.Item label="Contact Number">{srf?.contact_number}</Descriptions.Item>
                                    <Descriptions.Item label="Department">{srf?.department}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    </Card>

                    {/* Selected Items Table */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <Text strong className="text-lg">Selected Items for Calibration Update</Text>
                            {isVerifying && <Space><SyncOutlined spin className="text-blue-500" /><Text type="secondary">Verifying items...</Text></Space>}
                        </div>
                        <SRFItemsListView
                            srfItems={selecteditems}
                            verifyStatus={itemsVerifyStatus}
                            onRemove={removeItemHandler}
                            canGenerate={canGenerateCertificate}
                        />
                    </div>

                    <Divider className="m-0" />

                    {/* Action Cards */}
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <Card
                                size="small"
                                title={<Space><CalendarOutlined className="text-blue-500" />Execution Dates</Space>}
                                className="h-full border-blue-100 bg-blue-50/30"
                            >
                                <Space direction="vertical" className="w-full" size="middle">
                                    <div className="flex flex-col gap-1">
                                        <Text type="secondary" className="text-xs uppercase font-bold tracking-wider">Calibration Done Date</Text>
                                        <DatePicker
                                            size="large"
                                            className="w-full"
                                            value={calibrationDate}
                                            onChange={(date) => {
                                                setCalibrationDate(date);
                                                if (reportGenerateDate && date && reportGenerateDate.isBefore(date, 'day')) {
                                                    setReportGenerateDate(date);
                                                }
                                            }}
                                            format="DD-MM-YYYY"
                                            disabledDate={(current) => {
                                                if (!current) return false;
                                                const tooEarly = srf?.srf_date ? current < dayjs(srf.srf_date).startOf('day') : false;
                                                const tooLate = current > dayjs().endOf('day');
                                                return tooEarly || tooLate;
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <Text type="secondary" className="text-xs uppercase font-bold tracking-wider">Report Generated Date</Text>
                                            <DatePicker
                                                size="large"
                                                className="w-full"
                                                value={reportGenerateDate}
                                                onChange={setReportGenerateDate}
                                                format="DD-MM-YYYY"
                                                disabled={!canGenerateCertificate}
                                                disabledDate={(current) => {
                                                    if (!current) return false;
                                                    const tooEarly = calibrationDate ? current < dayjs(calibrationDate).startOf('day') : false;
                                                    const tooLate = current > dayjs().endOf('day');
                                                    return tooEarly || tooLate;
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                            <Space direction="vertical" size={0}>
                                                <Text strong size="small">Draft Mail Mode</Text>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>Send certificate as draft to customer</Text>
                                            </Space>
                                            <Switch
                                                checked={sendDraft}
                                                onChange={setSendDraft}
                                                checkedChildren="ON"
                                                unCheckedChildren="OFF"
                                            />
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                size="small"
                                title={<Space><SafetyCertificateOutlined className="text-emerald-500" />Update Actions</Space>}
                                className="h-full border-emerald-100 bg-emerald-50/30"
                            >
                                <Space direction="vertical" className="w-full" size="small">
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        className="bg-emerald-600 hover:bg-emerald-700 h-12"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => updateBulkCalbrationHandler(1)}
                                        disabled={
                                            hasAlreadyCalibrated ||
                                            selecteditems.length === 0 ||
                                            !canGenerateCertificate ||
                                            selecteditems.some(item => !itemsVerifyStatus[item.srf_item_id]?.isGenerateCertificate) ||
                                            selecteditems.some(item => itemsVerifyStatus[item.srf_item_id]?.masterdeviceexpire?.isExpired)
                                        }
                                    >
                                        Mark as Calibrated
                                    </Button>
                                    <Button
                                        size="large"
                                        block
                                        className="h-12"
                                        icon={<FileDoneOutlined />}
                                        onClick={() => updateBulkReportHandler()}
                                        disabled={
                                            selecteditems.length === 0 ||
                                            !canGenerateCertificate ||
                                            selecteditems.some(item => !itemsVerifyStatus[item.srf_item_id]?.isGenerateCertificate) ||
                                            selecteditems.some(item => itemsVerifyStatus[item.srf_item_id]?.masterdeviceexpire?.isExpired)
                                        }
                                    >
                                        Mark as Report Generated
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        className="bg-blue-600 hover:bg-blue-700 h-12"
                                        icon={<SafetyCertificateOutlined />}
                                        onClick={() => updateBulkCalbrationHandler(2)}
                                        disabled={
                                            hasAlreadyCalibrated ||
                                            selecteditems.length === 0 ||
                                            !canGenerateCertificate ||
                                            selecteditems.some(item => !itemsVerifyStatus[item.srf_item_id]?.isGenerateCertificate) ||
                                            selecteditems.some(item => itemsVerifyStatus[item.srf_item_id]?.masterdeviceexpire?.isExpired)
                                        }
                                    >
                                        Calibrated & Report Generated
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    {selecteditems.some(item => !itemsVerifyStatus[item.srf_item_id]?.isGenerateCertificate) && (
                        <Alert
                            message="Calibration Results Missing"
                            description="Some items do not have calibration results saved. Please enter and save results before generating certificates."
                            type="warning"
                            showIcon
                        />
                    )}

                    {selecteditems.some(item => itemsVerifyStatus[item.srf_item_id]?.masterdeviceexpire?.isExpired) && (
                        <Alert
                            message="Master Instrument Expired"
                            description="One or more items are associated with expired master instruments. Please recalibrate masters before proceeding."
                            type="error"
                            showIcon
                        />
                    )}

                    <div className="flex justify-end mt-2">
                        <Button size="large" onClick={props.onclose}>Cancel</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const SRFItemsListView = ({ srfItems, verifyStatus, onRemove, canGenerate }) => {
    const columns = [
        {
            title: "S.No",
            dataIndex: "slNo",
            key: "slNo",
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: "Item Details",
            key: "item_details",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.intrument_type?.instrument_full_name}</Text>
                    <Text type="secondary" className="text-xs">SN: {record.serial_no} | ID: {record.identification_details}</Text>
                </Space>
            )
        },
        {
            title: "Make / Model",
            key: "make_model",
            render: (_, record) => (
                <Text className="text-xs">{record.make} / {record.model}</Text>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 140,
            align: 'center',
            render: (status) => <StatusBadge value={status} />
        },
        {
            title: "Ready",
            key: "ready",
            width: 80,
            align: 'center',
            render: (_, record) => {
                if (!canGenerate) return <Tooltip title="Certificate generation disabled in settings"><InfoCircleOutlined className="text-slate-400" /></Tooltip>;

                const status = verifyStatus[record.srf_item_id];
                if (!status) return <SyncOutlined spin className="text-blue-400" />;

                if (status.masterdeviceexpire?.isExpired) {
                    return (
                        <Tooltip title={`Master Expired: ${status.masterdeviceexpire.message}`}>
                            <WarningOutlined className="text-red-500" />
                        </Tooltip>
                    );
                }

                if (!status.isGenerateCertificate) {
                    return (
                        <Tooltip title="Calibration results not saved">
                            <WarningOutlined className="text-amber-500" />
                        </Tooltip>
                    );
                }

                return (
                    <Tooltip title="Ready for certificate generation">
                        <CheckCircleOutlined className="text-emerald-500" />
                    </Tooltip>
                );
            }
        },
        {
            title: "Action",
            key: "action",
            width: 70,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => onRemove(record.srf_item_id)}
                />
            )
        }
    ];

    return (
        <Table
            dataSource={srfItems}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="srf_item_id"
            bordered
            className="shadow-sm rounded-lg overflow-hidden"
        />
    );
};

export default UpdateCalibrationStatus;
