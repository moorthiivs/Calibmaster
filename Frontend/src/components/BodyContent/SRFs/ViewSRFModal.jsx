import "./ViewSRFModal.css";
import { Spinner } from "react-rainbow-components";
//import { Modal } from "react-rainbow-components";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GlobalNotification from "../../../utils/GlobalNotification";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import SRFItemsList from "./SRFItemsList";
import { srfitemsActions } from "../../../store/srfitems";
import UpdateDCModal from "./UpdateDCModal";
import UpdateInvoice from "./UpdateInvoice";
import UpdatePaymentStatus from "./UpdatePaymentStatus";
import UpdateReportModal from "./UpdateReportModal";
import UpdateCalibrationStatus from "./UpdateCalibrationStatus";
import UpdateBulkDCStatus from "./UpdateBulkDCStatus";
import EditSRFModal from "./EditSRFModal";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import { Modal, Space, Button, Alert, Typography, Descriptions, Tag, Divider, Card } from "antd";
import {
  EditOutlined,
  TruckOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  ContainerOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { usePermissions } from "../../../hooks/usePermissions";

const { Text } = Typography;

const ViewSRFModal = (props) => {
  const [error, setError] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const { hasPermission } = usePermissions();
  const selecteditems = useSelector((state) => state.selecteditems.list);
  const [updatedispatchModal, setupdatedispatchModal] = useState(false);
  const [updatereportModal, setupdatereportModal] = useState(false);
  const [updateinvoiceModal, setupdateinvoiceModal] = useState(false);
  const [updatepaymentModal, setupdatepaymentModal] = useState(false);
  const [updateCalibrationModal, setUpdateCalibrationModal] = useState(false);
  const [updateDCStatusModal, setUpdateDCStatusModal] = useState(false);
  const [editSRFOpen, setEditSRFOpen] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    const target = e.target;
    // Only drag from modal header or title
    if (target.closest('.ant-modal-header') || target.closest('.ant-modal-title') || target.closest('h2')) {
      setDragging(true);
      setRel({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.stopPropagation();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - rel.x,
        y: e.clientY - rel.y
      });
      e.stopPropagation();
      e.preventDefault();
    };

    const onMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, rel]);

  useEffect(() => {
    if (!props.isopen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [props.isopen]);

  const [updateModals, setupdateModals] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  });

  const getSRFDetail = async () => {
    if (props.srfid) {
      setIsLoaded(false);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ srfId: props.srfid, userId: auth.userId, page: 1, limit: 5 }),
      };
      const errornotification = {
        title: "Error while Getting SRF Detail!!",
        description: props.srfid,
        icon: "error",
        state: true,
        timeout: 15000,
      };
      fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions)
        .then(async (response) => {
          const data = await response.json();
          setIsLoaded(true);
          //console.log(data);
          if (data) {
            if (data.code === 200) {
              // console.log(data);
              const srf = data.data.srf;

              setSRF(srf);

              let items = data.data.items;

              dispatch(srfitemsActions.changesrfitems(items));
              if (data.data.pagination?.totalItems) {
                setTotalItems(data.data.pagination.totalItems);
              }
              setIsLoaded(true);
            } else {
              GlobalNotification.error({
                title: "Error while Getting SRF Detail!!",
                description: props.srfid,
              });
              setError(data.message);
            }
          } else {
            GlobalNotification.error({
              title: "Error while Getting SRF Detail!!",
              description: props.srfid,
            });
            setError("Error while Getting SRF Detail!!");
          }
        })
        .catch((err) => {
          console.log(err);
          GlobalNotification.error({
            title: "Error while Getting SRF Detail!!",
            description: props.srfid,
          });
          setError("Error while Getting SRF Detail!!");
        });
    }
  };

  useEffect(() => {
    getSRFDetail();
  }, [props.srfid]);

  const updatedispatchModalHandler = () => {
    const updatedispatchmodal = updatedispatchModal;
    setupdatedispatchModal(!updatedispatchmodal);
  };
  const updatereportModalHandler = () => {
    const updatereportmodal = updatereportModal;
    setupdatereportModal(!updatereportmodal);
  };
  const updateinvoiceModalHandler = () => {
    // return console.log(srf);
    const updateinvoicemodal = updateinvoiceModal;
    setupdateinvoiceModal(!updateinvoicemodal);
  };
  const updatepaymentModalHandler = () => {
    const updatepaymentmodal = updatepaymentModal;
    setupdatepaymentModal(!updatepaymentmodal);
  };
  const updateCalibrationModalHandler = () => {
    setUpdateCalibrationModal(!updateCalibrationModal);
  };
  const updateDCStatusModalHandler = () => {
    setUpdateDCStatusModal(!updateDCStatusModal);
  };

  const checkStatusForCalibration = () => {
    return selecteditems.every((data) => {
      return (data.status == "Not Calibrated" || data.status == "Calibrated" || data.status == "Review Pending");
    })
  }

  const checkAssignedTo = () => {
    if (!hasPermission("ASSIGNED_ACTION_ONLY")) return true;
    return selecteditems.every((data) => {
      return data.assignedTo === auth.userId;
    });
  }

  const checkStatusForCSD = () => {
    return selecteditems.every((data) => {
      return (data.status == "Report Generated")
    })
  }

  const checkStatusForCSDAfterDispatch = () => {
    return selecteditems.every((data) => {
      return (data.status == "Dispatched")
    })
  }
  const checkStatusForAccount = () => {
    return selecteditems.every((data) => {
      return (data.status == "Report Dispatched")
    })
  }

  const checkStatusForAccountAfterInvoice = () => {
    return selecteditems.every((data) => {
      return (data.status == "Invoice Generated")
    })
  }

  if (!isLoaded)
    return <Loader />;

  return (
    <div className="view__srf__modal__container">
      <Modal
        id="view__srf"
        open={props.isopen}
        onCancel={props.onclose}
        width="80%"
        centered={true}
        maskClosable={false}
        title={
          <h2 style={{ cursor: "move", width: "100%" }} className="text-lg font-bold my-3 text-center w-full draggable-header">
            SRF Detail
          </h2>
        }
        className="view__srf__modal"
        // modalRender={(modal) => (
        //   <div
        //     style={{
        //       transform: `translate(${position.x}px, ${position.y}px)`,
        //     }}
        //     onMouseDown={onMouseDown}
        //   >
        //     {modal}
        //   </div>
        // )}
        footer={
          <div className="flex flex-col gap-4">
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-3 rounded-lg border border-slate-200 gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Text type="secondary" className="text-sm font-medium w-full">
                  {selecteditems?.length > 0 ? (
                    <Space className="flex-wrap">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                        {selecteditems.length} Items Selected
                      </span>
                      <Text type="secondary" className="text-xs">Select more items to perform bulk actions</Text>
                    </Space>
                  ) : (
                    <span className="text-slate-400 italic flex items-center gap-1 text-xs">
                      <ExclamationCircleOutlined /> Select items from the list to enable actions
                    </span>
                  )}
                </Text>
              </div>

              <Space size="middle" className="w-full md:w-auto justify-start md:justify-end flex-wrap">
                <Button
                  size="large"
                  onClick={props.onclose}
                  className="px-6 w-full sm:w-auto"
                >
                  Close
                </Button>

                {selecteditems?.length > 0 && (
                  <Space className="flex-wrap justify-start w-full sm:w-auto">
                    {(hasPermission("ENTER_RESULT") && checkStatusForCalibration() && checkAssignedTo() && (updateModals["Not Calibrated"] || updateModals["Calibrated"])) && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<EditOutlined />}
                        onClick={updateCalibrationModalHandler}
                        className="w-full sm:w-auto mb-2 sm:mb-0"
                      >
                        Update Calibration
                      </Button>
                    )}

                    {(hasPermission("EDIT_SRF") && checkStatusForCSD() && updateModals["Report Generated"]) && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<TruckOutlined />}
                        onClick={updatedispatchModalHandler}
                        className="bg-orange-500 border-orange-500 hover:bg-orange-600 w-full sm:w-auto mb-2 sm:mb-0"
                      >
                        Dispatch Items
                      </Button>
                    )}

                    {(hasPermission("EDIT_SRF") && checkStatusForCSDAfterDispatch() && updateModals["Dispatched"]) && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<FileTextOutlined />}
                        onClick={updatereportModalHandler}
                        className="bg-teal-600 border-teal-600 hover:bg-teal-700 w-full sm:w-auto mb-2 sm:mb-0"
                      >
                        Report Dispatch
                      </Button>
                    )}

                    {(hasPermission("EDIT_SRF") && checkStatusForAccount() && updateModals["Report Dispatched"]) && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<FileDoneOutlined />}
                        onClick={updateinvoiceModalHandler}
                        className="w-full sm:w-auto mb-2 sm:mb-0"
                      >
                        Generate Invoice
                      </Button>
                    )}

                    {(hasPermission("EDIT_SRF") && checkStatusForAccountAfterInvoice() && updateModals["Invoice Generated"]) && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<DollarOutlined />}
                        onClick={updatepaymentModalHandler}
                        className="bg-emerald-600 border-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </Space>
                )}
              </Space>
            </div>
          </div>
        }
      >
        {srf ? (
          <div className="flex flex-col gap-2.5 bg-slate-50/50 p-1 rounded-lg">
            <div className="flex flex-col gap-2.5">
              {/* Top Section: Split Information */}
              <div className={`grid grid-cols-1 ${hasPermission("EDIT_SRF") ? "md:grid-cols-2" : ""} gap-2.5`}>
                {/* Left Card: SRF Info */}
                <Card
                  size="small"
                  className="shadow-sm border-slate-200 rounded-xl overflow-hidden"
                  title={
                    <Space><FileTextOutlined className="text-blue-500" /><Text strong className="text-sm">General Information</Text></Space>
                  }
                  extra={
                    hasPermission("EDIT_SRF") && (
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => setEditSRFOpen(true)}
                        className="p-0 text-blue-600 hover:text-blue-800"
                      >
                        Edit Info
                      </Button>
                    )
                  }
                >
                  <Descriptions
                    column={1}
                    size="middle"
                    className="srf-compact-descriptions"
                    labelStyle={{
                      color: "#64748B",
                      fontWeight: 600,
                      paddingBottom: "8px",
                      minWidth: "100px",
                      whiteSpace: "nowrap"
                    }}
                    contentStyle={{
                      color: "#0F172A",
                      fontWeight: 500,
                      paddingBottom: "8px",
                    }}
                  >
                    {/* SRF NO */}
                    <Descriptions.Item
                      label={
                        <div className="flex items-center gap-2">
                          <IdcardOutlined className="text-slate-400" />
                          SRF No.
                        </div>
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Tag color="blue" className="font-mono m-0 text-[12px] px-2 leading-6 rounded-md font-semibold">{srf?.srf_number}</Tag>
                      </div>
                    </Descriptions.Item>

                    {/* SRF DATE */}
                    <Descriptions.Item
                      label={
                        <div className="flex items-center gap-2">
                          <CalendarOutlined className="text-slate-400" />
                          SRF Date
                        </div>
                      }
                    >
                      <div className="pl-1">
                        {convertDateFormat(srf?.created_timestamp)}
                      </div>
                    </Descriptions.Item>

                    {/* CUSTOMER */}
                    <Descriptions.Item
                      label={
                        <div className="flex items-center gap-2">
                          <UserOutlined className="text-slate-400" />
                          Customer
                        </div>
                      }
                    >
                      <div className="pl-1 font-semibold text-slate-800">
                        {srf?.customer?.customer_name}
                      </div>
                    </Descriptions.Item>

                    {/* ADDRESS */}
                    <Descriptions.Item
                      label={
                        <div className="flex items-center gap-2">
                          <EnvironmentOutlined className="text-slate-400" />
                          Address
                        </div>
                      }
                    >
                      <div className="pl-1 text-xs text-slate-500 leading-relaxed max-w-[320px]">
                        {[srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {hasPermission("EDIT_SRF") && (
                  <Card
                    size="small"
                    className="shadow-sm border-slate-200 rounded-xl overflow-hidden"
                    title={
                      <Space><InfoCircleOutlined className="text-emerald-500" /><Text strong className="text-sm">Contact & Delivery Details</Text></Space>
                    }
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      className="srf-compact-descriptions"
                      labelStyle={{
                        color: "#64748B",
                        fontSize: "13px",
                        fontWeight: 600,
                        paddingBottom: "8px",
                        minWidth: "100px",
                        whiteSpace: "nowrap"
                      }}
                      contentStyle={{
                        color: "#0F172A",
                        fontSize: "13px",
                        fontWeight: 500,
                        paddingBottom: "8px",
                      }}
                    >

                      <>
                        {/* CONTACT */}
                        <Descriptions.Item
                          label={
                            <div className="flex items-center gap-2">
                              <UserOutlined className="text-slate-400" />
                              Contact
                            </div>
                          }
                        >
                          <div className="pl-1">
                            {srf?.contact_name || "N/A"}
                          </div>
                        </Descriptions.Item>

                        {/* PHONE */}
                        <Descriptions.Item
                          label={
                            <div className="flex items-center gap-2">
                              <PhoneOutlined className="text-slate-400" />
                              Phone
                            </div>
                          }
                        >
                          <div className="pl-1">
                            {srf?.contact_number || "N/A"}
                          </div>
                        </Descriptions.Item>

                        {/* DEPARTMENT */}
                        <Descriptions.Item
                          label={
                            <div className="flex items-center gap-2">
                              <ApartmentOutlined className="text-slate-400" />
                              Dept.
                            </div>
                          }
                        >
                          <div className="pl-1">
                            {srf?.department || "N/A"}
                          </div>
                        </Descriptions.Item>

                        {/* CUSTOMER DC */}
                        <Descriptions.Item
                          label={
                            <div className="flex items-center gap-2">
                              <ContainerOutlined className="text-slate-400" />
                              Cust. DC
                            </div>
                          }
                        >
                          <div className="flex items-center gap-3 pl-1">
                            <Tag color="purple" className="font-mono m-0 text-[12px] px-2 leading-6 font-bold">
                              {srf?.customer_dc_file_path ? (
                                <a
                                  href={`${config.Calibmaster.URL}/dc_files/${srf.customer_dc_file_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  {srf?.customer_dc || 'N/A'}
                                </a>
                              ) : (
                                srf?.customer_dc || 'N/A'
                              )}
                            </Tag>
                          </div>
                        </Descriptions.Item>

                        {/* DC DATE */}
                        <Descriptions.Item
                          label={
                            <div className="flex items-center gap-2">
                              <CalendarOutlined className="text-slate-400" />
                              DC Date
                            </div>
                          }
                        >
                          <div className="pl-1">
                            {convertDateFormat(srf?.customer_dc_date)}
                          </div>
                        </Descriptions.Item>

                      </>



                    </Descriptions>
                  </Card>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <Space><ContainerOutlined className="text-blue-500" /><Text strong className="text-sm">Instrument Items List</Text></Space>
                <Tag color="blue" className="text-[10px] font-bold">{selecteditems?.length || 0} ITEMS SELECTED</Tag>
              </div>
              <div className="p-0 overflow-hidden">
                <SRFItemsList srfId={srf.srf_id} checkbox={true} srf={srf} initialTotalItems={totalItems} setupdateModals={setupdateModals} refetchData={getSRFDetail} />
              </div>
            </div>


            <style>{`
              .srf-compact-descriptions .ant-descriptions-item {
                padding-bottom: 8px !important;
              }
              .srf-compact-descriptions .ant-descriptions-item:last-child {
                padding-bottom: 0 !important;
              }
              .srf-compact-descriptions .ant-descriptions-item-label {
                font-size: 13px !important;
                color: #475569 !important;
                font-weight: 600 !important;
              }
              .srf-compact-descriptions .ant-descriptions-item-content {
                font-size: 13px !important;
                color: #1e293b !important;
                font-weight: 500 !important;
              }
              .ant-modal-body {
                padding: 16px 20px !important;
              }
              .ant-modal-title {
                font-size: 18px !important;
              }
              .ant-modal-content{
                padding: 10px !important;
              }
            `}</style>
          </div>
        ) : null
        }

      </Modal >
      {
        updatedispatchModal ? (
          <UpdateDCModal
            isopen={updatedispatchModal}
            onclose={updatedispatchModalHandler}
            srfid={srf.srf_id}
            srfNo={srf.srf_number}
            mode="updatedc"
          />
        ) : null
      }

      {
        updatereportModal ? (
          <UpdateReportModal
            isopen={updatereportModal}
            onclose={updatereportModalHandler}
            srfid={srf.srf_id}
            srfNo={srf.srf_number}
            mode="updatereport"
          />
        ) : null
      }

      {
        updateinvoiceModal ? (
          <UpdateInvoice
            isopen={updateinvoiceModal}
            onclose={updateinvoiceModalHandler}
            srfid={srf.srf_id}
            srfNo={srf.srf_number}
            mode="updateinvoice"
          />
        ) : null
      }

      {
        updatepaymentModal ? (
          <UpdatePaymentStatus
            isopen={updatepaymentModal}
            onclose={updatepaymentModalHandler}
            srfid={srf.srf_id}
            srfNo={srf.srf_number}
            mode="updatepayment"
          />
        ) : null
      }

      {
        updateCalibrationModal ? (
          <UpdateCalibrationStatus
            isopen={updateCalibrationModal}
            onclose={updateCalibrationModalHandler}
            srfid={srf.srf_id}
            srfNo={srf.srf_number}
            mode="updateCalibration"
            item={selecteditems}
          />
        ) : null
      }

      {
        updateDCStatusModal ? (
          <UpdateBulkDCStatus
            isopen={updateDCStatusModal}
            onclose={updateDCStatusModalHandler}
            srf_id={srf.srf_id}
            mode="updateCalibration"
            closeViewModal={props}
          />
        ) : null
      }

      {editSRFOpen && (
        <EditSRFModal
          isOpen={editSRFOpen}
          onclose={() => setEditSRFOpen(false)}
          srf={srf}
          onSaveSuccess={() => {
            getSRFDetail();
            if (props.onUpdateSuccess) {
              props.onUpdateSuccess();
            }
          }}
        />
      )}
    </div >
  );
};

export default ViewSRFModal;