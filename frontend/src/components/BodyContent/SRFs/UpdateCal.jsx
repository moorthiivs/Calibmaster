import "./UpdateCal.css";
import { Spinner } from "react-rainbow-components";
//import { Modal ,Card,Button} from "react-rainbow-components";
import StatusBadge from "../../UI/StatusBadge";
import CustomProgress from "../../UI/CustomProgress";
import config from "../../../utils/config.js";
import { useState, useContext } from "react";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import { useEffect } from "react";
import CustomInput from "../../Inputs/CustomInput";
import CustomSelect from "../../Inputs/CustomSelect";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
//import { DatePicker } from "react-rainbow-components";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import DownloadCertificate from "./DownloadCertificate";
import { formattedDate } from "../../helpers/Helper";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import DownloadObservation from "./DownloadObservation";
import { Modal, Button, Typography, Card, DatePicker, Space, Divider, Col, Row, Switch, Tooltip, FloatButton, Spin, Skeleton, Alert } from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SendOutlined,
  FileSearchOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import DownloadDraftCertificate from "./DownloadDraftCertificate";
import GlobalNotification from "../../../utils/GlobalNotification";
const { Title, Text } = Typography;

const groups = [
  {
    label: "Dimension",
    value: "Dimension",
  },
];
const disciplines = [
  {
    label: "Mechanical",
    value: "Mechanical",
  },
  {
    label: "Electrical",
    value: "Electrical",
  },
];
const restrictionstatus = [
  "Not Calibrated",
  "Calibrated",
  "Report Generated",
];
const UpdateCal = (props) => {


  const auth = useContext(AuthContext);
  const dispatch = useDispatch("");
  const { modalType } = props;

  const [lab_type, setlab_type] = useState(props.item.labtype)

  const [isLoading, setIsLoading] = useState(false);

  const [calibrationDate, setCalibrationDate] = useState("");
  const [calibrationDateErr, setCalibrationDateErr] = useState("");

  const [reportGenerateDate, setReportGenerateDate] = useState("");
  const [reportGenerateDateErr, setReportGenerateDateErr] = useState("");

  // *** Generate Certificate ***
  const [canGenerateCertificate, setCanGenerateCertificate] = useState(false);
  const [isGenerateCertificate, setIsGenerateCertificate] = useState(false);

  const [GenerateCertificate, setGenerateCertificate] = useState(false);


  const [isuncertainty, setuncertainty] = useState(false)
  const [isobservation, setisobservation] = useState(false)

  const [iscalibrationDate, setisCalibrationDate] = useState(false);

  const [isCalibrationSaved, setIsCalibrationSaved] = useState(false);

  const [masterDeviceExpire, setMasterDeviceExpire] = useState(null);

  const [sendDraft, setSendDraft] = useState(false)
  const [isDraft, setisDraft] = useState(false)
  // *** fetch CMS Settings Permissions ***
  const fetchCMSSettings = async () => {
    try {
      setIsLoading(true)
      const data = await fetch(config.Calibmaster.URL + "/api/cms-permissions-setting/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth?.token,
        },
        body: JSON.stringify({ lab_id: auth?.labId })
      });

      let response = await data?.json();
      const { result } = response


      result.map((item, index) => {



        if (item.is_enable && item.setting_name === "GENERATE_CERTIFICATE") {
          setCanGenerateCertificate(true);
        }

      });
    } catch (error) {
      console.log(error);
      const newNotification = {
        title: "Something went wrong",
        description: "",
        icon: "error",
        state: true,
        timeout: 1500,
      };
      dispatch(notificationActions.changenotification(newNotification));
    } finally {
      setIsLoading(false)
    }
  }

  // *** fetch certificate check ***
  const certificateHandler = async () => {

    try {
      setIsLoading(true)
      // *** Create Request Body object ***
      const requestBody = {
        lab_id: auth.labId,
        srf_id: props?.srf?.srf_id,
        srf_item_id: props?.item?.srf_item_id
      }

      // *** Create Request Options object ***
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(requestBody)
      };

      let response = await fetch(config.Calibmaster.URL + "/api/generate-certificate/verify_certificate", requestOptions);
      const { masterdeviceexpire, check, isGenerateCertificate, check_uncertainty, check_observation, check_draft, iscalibration_done } = await response.json();

      setMasterDeviceExpire(masterdeviceexpire)
      setIsGenerateCertificate(check);
      setGenerateCertificate(isGenerateCertificate)
      setuncertainty(check_uncertainty)
      setisobservation(check_observation)
      setisDraft(check_draft)
      setIsCalibrationSaved(iscalibration_done)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // console.log(props.item);

    (props.item.calibration_done_date) ? setCalibrationDate(props.item.calibration_done_date) : setCalibrationDate("");
    (props.item.report_done_date) ? setReportGenerateDate(props.item.report_done_date) : setReportGenerateDate("");
    (props.item.labtype) ? setlab_type(props.item.labtype) : setlab_type("");


    fetchCMSSettings();
    certificateHandler();
  }, [props]);

  const updateUlrNumber = async () => {
    if (lab_type === 'NON-NABL') return
    const requestBody = {
      lab_id: auth?.labId,
      items: [{ srf_item_id: props.item.srf_item_id }]
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(requestBody),
    };

    let res = await fetch(config.Calibmaster.URL + "/api/ulr-no-generation/update-ulr-number", requestOptions);
    res = await res.json();
  }

  // Update Calalibration Status Handler
  const updatecalHandler = async (mode) => {

    try {

      if (mode == 1) {
        if (calibrationDate == "") {
          setCalibrationDateErr("Please set the calibration date");
          return;
        }
        //updateUlrNumber();
        setIsCalibrationSaved(true);
      }

      if (mode == 2) {
        if (reportGenerateDate == "") {
          setReportGenerateDateErr("Please set the report generated date");
          return;
        }
      }

      if (mode == 3) {
        if (calibrationDate == "") {
          setCalibrationDateErr("Please set the calibration date");
          return;
        }

        if (reportGenerateDate == "") {
          setReportGenerateDateErr("Please set the report generated date");
          return;
        }
        //updateUlrNumber();
        !(canGenerateCertificate && auth.department === "Manager") && await generateCertificateHandler();
      }

      setIsLoading(true);

      const requestBody = {
        id: props.item.srf_item_id,
        srfId: props.item.srf_id,
        mode: mode,
        date: calibrationDate,
        reportGenerateDate: reportGenerateDate,
        userName: auth.name,
      };

      // return console.log(requestBody);

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(requestBody),
      };

      const errornotification = {
        title: "Error while Updating SRF Item!!",
        description: "Updating SRF Item Failed!!",
        icon: "error",
        state: true,
        timeout: 15000,
      };

      fetch(config.Calibmaster.URL + "/api/srf/updatecalinfo", requestOptions)
        .then(async (response) => {
          const data = await response.json();

          if (data) {
            if (data.code === 200) {
              GlobalNotification.success({
                title: 'SRF Item Updated Successfully!!',
                description: "Instrument : " + props?.item?.intrument_type?.instrument_full_name,
                duration: 1
              });
              dispatch(srfitemsActions.changesrfitems(data.data.items));
              await fetchSRFItems();
            } else {
              errornotification.description = data.message;
              dispatch(notificationActions.changenotification(errornotification));
            }
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        })
        .catch((err) => {
          console.log(err);
          dispatch(notificationActions.changenotification(errornotification));
        });
    } catch (error) {
      console.log(error);
    } finally {
      props.onclose();
      //setIsLoading(false)
    }

  };

  // Generate Certificate Handler
  const generateCertificateHandler = async () => {

    try {

      setIsLoading(true);

      if (reportGenerateDate == "") {
        setReportGenerateDateErr("Please set the report generated date");
        setIsLoading(false);
        return;
      }
      const customer_info = {
        "srfId": props?.item?.srf_id,
        "srf_item_id": props?.item?.srf_item_id,
        "srfNo": (modalType === "srf_items_list") ? props?.srf?.srf_number : props?.item?.srf?.srf_number,
        "name": props?.item?.intrument_type?.instrument_full_name,
        "make": props?.item?.make,
        "model": props?.item?.model,
        "serialno": props?.item?.serial_no,
        "idno": props?.item.identification_details,
        "companyId": (modalType === "srf_items_list") ? props?.srf?.customer_id : props?.item?.srf?.customer?.customer_id
      }

      // Create Request Body object
      const requestBody = {
        lab_id: auth.labId,
        srf_id: props?.item?.srf_id,
        srf_item_id: props?.item?.srf_item_id,
        customer_info,
        reportGenerateDate,
        sendDraft
      }

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + auth.token
        },
        body: JSON.stringify(requestBody)
      };

      const response_1 = await fetch(config.Calibmaster.URL + "/api/generate-certificate/generate", requestOptions);


      if (response_1.ok) {
        const blob = await response_1.blob();
        await updatecalHandler(2);
        GlobalNotification.success({
          title: 'Certificate Generated',
          description: 'The certificate has been generated successfully.',
          duration: 1
        });
      }

      if (!response_1.ok) {
        const errorData = await response_1.json();
        const errorMessage = errorData.message || "Something went wrong while generating certificate.";
        alert(errorMessage)
        throw new Error(errorMessage);
      }

      // const blob = await response_1.blob();

      // await updatecalHandler(2);

    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false)
    }
  }

  //*** Fetch SRF Items ***/
  async function fetchSRFItems() {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      const { items } = data;

      const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i].slNo = i + 1;
        }
        return arr;
      }
      let getSRFList = await newSRFList(items);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
  }

  const isMasterBlocked = masterDeviceExpire?.isExpired || masterDeviceExpire?.isBlockedBeforeDue;



  // if (isLoading)
  //   return <Loader />;

  return (

    <Modal
      open={props.isOpen}
      onCancel={props.onclose}
      closable={!isLoading}
      footer={null}
      centered
      width={900}
      className="view__srf__item__modal"
    >
      <Title level={3} style={{ textAlign: "center", color: "#1677ff", marginBottom: 10 }} className="text-lg font-bold my-5">
        SRF Item Detail
      </Title>

      {isLoading ? (
        // 🟢 Show Skeleton Loader
        <Card style={{ borderRadius: 12, marginBottom: 20 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
          <Divider />
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : (

        props.item && (
          <>
            {/* Details Section */}
            <Card style={{ marginBottom: 20, borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.08)" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#595959" }}>Serial No: </Text>
                  <Text style={{ color: "#262626" }}>{props.item.serial_no}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#595959" }}>Description: </Text>
                  <Text style={{ color: "#262626" }}>{props.item.description}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#595959" }}>Make: </Text>
                  <Text style={{ color: "#262626" }}>{props.item.make}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#595959" }}>Model: </Text>
                  <Text style={{ color: "#262626" }}>{props.item.model}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#595959" }}>Identification: </Text>
                  <Text style={{ color: "#262626" }}>{props.item?.identification_details}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Status: </Text>
                  <StatusBadge value={props.item?.status} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#1677ff" }}>SRF No: </Text>
                  <Text style={{ fontWeight: 600, color: "#1677ff" }}>{props.srf?.srf_number}</Text>
                </Col>
              </Row>

              <Divider />

              {/* Dates & Extra Info */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Calibration Done Date: </Text>
                  <Text type="secondary">{convertDateFormat(props.item.calibration_done_date)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Calibration Done By: </Text>
                  <Text>{props.item.calibration_done_by_empname}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Report Done Date: </Text>
                  <Text type="secondary">{convertDateFormat(props.item.report_done_date)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Report Done By: </Text>
                  <Text>{props.item.report_done_by_empname}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Report Dispatch Date: </Text>
                  <Text>{convertDateFormat(props.item.report_dispatch_date)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Dispatch Mode: </Text>
                  <Text>{props.item.dispatch_mode}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Invoice No: </Text>
                  <Text>{props.item.invoice_no}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Remarks: </Text>
                  <Text>{props.item.remarks}</Text>
                </Col>
              </Row>
            </Card>

            {/* Certificate Buttons */}
            <Space size="middle" style={{ marginBottom: 0, width: "100%", justifyContent: "flex-end" }}>
              {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isobservation && (<DownloadObservation item={props?.item} />)}
              {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isuncertainty && (<DownloadCertificate item={props?.item} />)}
              {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isDraft && (<DownloadDraftCertificate item={props?.item} />)}
            </Space>



            {/* Progress */}
            <CustomProgress options={config.SRF_ITEM_STATUS_LIST} current={props.item.status} />

            {/* Update Section */}
            {restrictionstatus.includes(props.item.status) ? (
              <Card
                title="📌 Update Calibration & Report"
                style={{ marginTop: 0, borderRadius: 12 }}
              >
                <Row gutter={[16, 16]} align="middle" justify={props.item.status !== "Report Generated" ? "start" : "center"} wrap>
                  {/* Calibration Date */}
                  {props.item.status !== "Report Generated" && (
                    <Col xs={24} sm={12} md={4}>
                      <DatePicker
                        value={calibrationDate ? dayjs(calibrationDate) : null}
                        onChange={(value) => {
                          setCalibrationDate(value ? value.format("YYYY-MM-DD") : "");
                          setCalibrationDateErr("");
                        }}
                        style={{ width: "100%" }}
                        placeholder="Select Calibration Done Date"
                        size="large"
                      />
                      {calibrationDateErr && <Text type="danger">{calibrationDateErr}</Text>}
                    </Col>
                  )}

                  {/* Mark Calibrated */}
                  {props.item.status !== "Report Generated" && (
                    <Col xs={24} sm={12} md={3}>
                      <Button
                        type="primary"
                        icon={<FileDoneOutlined />}
                        onClick={() => updatecalHandler(1)}
                        disabled={!GenerateCertificate || isMasterBlocked}
                        size="large"
                        block
                      >
                        Mark Calibrated
                      </Button>
                    </Col>
                  )}

                  {/* Draft Switch */}
                  <Col xs={24} sm={12} md={3}>
                    <Tooltip
                      title={
                        sendDraft
                          ? "Draft mode is ON. Mails will be sent as Draft Certificate."
                          : "Draft mode is OFF. Mails will not be sent with Draft Certificate."
                      }
                    >
                      <Switch
                        checked={sendDraft}
                        onChange={(checked) => setSendDraft(checked)}
                        unCheckedChildren="Draft Mail Off"
                        checkedChildren="Draft Mail On"
                        size="default"
                      />
                    </Tooltip>
                  </Col>

                  {/* Report Date */}
                  <Col xs={24} sm={12} md={4}>
                    <Tooltip title="Please Select Report Generated Date">
                      <DatePicker
                        value={reportGenerateDate ? dayjs(reportGenerateDate) : null}
                        onChange={(value) => {
                          setReportGenerateDate(value ? value.format("YYYY-MM-DD") : "");
                          setReportGenerateDateErr("");
                        }}
                        style={{ width: "100%" }}
                        placeholder="Select Report Generated Date"
                        size="large"
                        disabled={!GenerateCertificate || !isCalibrationSaved || isMasterBlocked}
                        disabledDate={(current) => {
                          if (!calibrationDate) return false; // no restriction if no calibration date

                          return (
                            current &&
                            current.isBefore(dayjs(calibrationDate), "day")
                          );
                        }}
                      />
                    </Tooltip>
                    {reportGenerateDateErr && <Text type="danger">{reportGenerateDateErr}</Text>}
                  </Col>

                  {/* Generate / Mark Report */}
                  <Col xs={24} sm={12} md={4}>
                    {canGenerateCertificate && ["admin", "Calibration"].includes(auth.department) ? (
                      <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={generateCertificateHandler}
                        disabled={!GenerateCertificate || !isCalibrationSaved || isMasterBlocked}
                        size="large"
                        block
                      >
                        Generate as Certificate
                      </Button>
                    ) : (
                      <Button
                        icon={<FileTextOutlined />}
                        onClick={() => updatecalHandler(2)}
                        size="large"
                        block
                      >
                        Mark as Report
                      </Button>
                    )}
                  </Col>

                  {/* Combined Action */}
                  {props.item.status !== "Report Generated" && (
                    <Col xs={24} md={6}>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        onClick={() => updatecalHandler(3)}
                        disabled={!GenerateCertificate || !isCalibrationSaved || isMasterBlocked}
                        size="large"
                        block
                      >
                        Mark Calibrated & Report Generated
                      </Button>
                    </Col>
                  )}
                </Row>

                {/* Warning */}
                {/* {!GenerateCertificate && (
                  <Text
                    type="danger"
                    style={{ display: "block", marginTop: 15, textAlign: "center" }}
                  >
                    <WarningOutlined /> Please Select, Enter Result, and Save Procedure before
                    Generating Certificate.
                  </Text>
                )} */}

                {!GenerateCertificate && (
                  <Alert
                    message="Calibration Results Not Saved"
                    description="Kindly select the appropriate procedure, Enter and verify the required calibration results, and save the procedure before proceeding with certificate generation."
                    type="warning"
                    showIcon
                    style={{ marginTop: 15 }}
                  />
                )}


                {/* {masterDeviceExpire?.isExpired && (
                  <Text
                    type="danger"
                    style={{ display: "block", marginTop: 15, textAlign: "center" }}
                  >
                    <WarningOutlined /> {masterDeviceExpire.message}
                  </Text>
                )} */}

                {masterDeviceExpire?.isExpired && (
                  <Alert
                    message="Master Instrument Expired"
                    description={masterDeviceExpire.message}
                    type="error"
                    showIcon
                    style={{ marginTop: 15 }}
                  />
                )}

                {masterDeviceExpire?.isBlockedBeforeDue && !masterDeviceExpire?.isExpired && (
                  <Alert
                    message="Calibration Blocked Before Validity Date"
                    description={masterDeviceExpire.message}
                    type="warning"
                    showIcon
                    style={{ marginTop: 15 }}
                  />
                )}


              </Card>
            ) : (
              <Text
                type="danger"
                style={{ display: "block", textAlign: "center", marginTop: 20 }}
              >
                The calibration and report generation have already been completed.
              </Text>
            )}

          </>
        )

      )}



      < Spin spinning={isLoading} fullscreen={true} size="large" />
    </Modal>

  );
};

export default UpdateCal;
