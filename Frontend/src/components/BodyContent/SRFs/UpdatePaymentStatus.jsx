import { Modal, Table, Button, Card, Descriptions, Space, Typography, Divider } from "antd";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import GlobalNotification from "../../../utils/GlobalNotification";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import StatusBadge from "../../UI/StatusBadge";
import config from "../../../utils/config.json";
import Loader from "../../UI/Loader";
import { usePermissions } from "../../../hooks/usePermissions";
import { convertDateFormat } from "../../../utils/filters";

const { Title, Text } = Typography;

const UpdatePaymentStatus = (props) => {
    const [isLoaded, setIsLoaded] = useState(true);
    const [srf, setSRF] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState("");

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const { hasPermission } = usePermissions();
    const selecteditems = useSelector((state) => state.selecteditems.list);

    const getSRFDetail = async () => {
        if (props.srfid) {
            setIsLoaded(false);
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ srfId: props.srfid, srfNo: props.srfNo }),
            };

            try {
                const response = await fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions);
                const data = await response.json();
                setIsLoaded(true);

                if (data && data.code === 200) {
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
                    title: "Fetch Error",
                    description: "Error while Getting SRF Detail!!"
                });
                setIsLoaded(true);
            }
        }
    };

    useEffect(() => {
        if (props.srfid) {
            getSRFDetail();
        }
    }, [props.srfid]);

    const handleUpdatePayment = async () => {
        Modal.confirm({
            title: "Confirm Payment Update",
            content: "Are you sure you want to mark the selected items as 'Payment Done'?",
            okText: "Yes, Mark as Paid",
            cancelText: "No",
            centered: true,
            onOk: async () => {
                try {
                    setIsLoading(true);
                    const bodyData = {
                        items: selecteditems,
                        paymentInfo: {
                            status: "Payment Done",
                            labId: auth.labId
                        },
                        srfId: srf?.srf_id,
                    };

                    const requestOptions = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                        body: JSON.stringify(bodyData)
                    };

                    const response = await fetch(config.Calibmaster.URL + "/api/srf-status/payment", requestOptions);
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
                        setResponseMsg(data?.message);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
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
            const { items } = data;
            const getSRFList = items.map((item, index) => ({ ...item, slNo: index + 1 }));
            dispatch(childSrfItemsActions.changesrfitems(getSRFList));
        } catch (error) {
            console.error(error);
        }
    }

    if (!isLoaded || isLoading) return <Loader />;

    return (
        <Modal
            title={<Title level={4} className="m-0">Update Payment Status</Title>}
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
                        <Text strong className="text-lg">Selected Items for Payment Update</Text>
                        <SRFItemsListView srfItems={selecteditems} />
                    </div>

                    <Divider className="m-0" />

                    <div className="flex flex-col items-end gap-2 mt-4">
                        {responseMsg && <Text type="danger">{responseMsg}</Text>}
                        <Space>
                            <Button size="large" onClick={props.onclose}>Cancel</Button>
                            <Button type="primary" size="large" onClick={handleUpdatePayment}>
                                Mark as Paid
                            </Button>
                        </Space>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const SRFItemsListView = ({ srfItems }) => {
    const columns = [
        {
            title: "S.No",
            dataIndex: "slNo",
            key: "slNo",
            width: 70,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: "Description of Item",
            dataIndex: "intrument_type",
            key: "intrument_type",
            render: (val) => val?.instrument_full_name
        },
        {
            title: "Make",
            dataIndex: "make",
            key: "make",
        },
        {
            title: "Model",
            dataIndex: "model",
            key: "model",
        },
        {
            title: "Serial Number",
            dataIndex: "serial_no",
            key: "serial_no",
        },
        {
            title: "Id Number",
            dataIndex: "identification_details",
            key: "identification_details",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: 'center',
            render: (status) => <StatusBadge value={status} />
        },
        {
            title: "Remarks",
            dataIndex: "remarks",
            key: "remarks",
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

export default UpdatePaymentStatus;