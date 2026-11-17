import "./UpdateCal.css";
import { Spinner } from "react-rainbow-components";
//import { Modal ,Card,Button} from "react-rainbow-components";
import StatusBadge from "../../UI/StatusBadge";
import CustomProgress from "../../UI/CustomProgress";
import config from "../../../utils/config.json";
import { useState, useContext } from "react";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import { useEffect, useRef } from "react";
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
import { usePermissions } from "../../../hooks/usePermissions";
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
  "Review Pending",
  "Auth Pending",
  "Auth Approved",
  "Report Generated",
];
const UpdateCal = (props) => {


  const auth = useContext(AuthContext);
  const dispatch = useDispatch("");
  const { modalType } = props;
  const { hasPermission } = usePermissions();

  const [lab_type, setlab_type] = useState(props.item?.labtype)

  const [isLoading, setIsLoading] = useState(false);
  const isActionRef = useRef(false);

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
  const [existingSrfDates, setExistingSrfDates] = useState([]);
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
        body: JSON.stringify({ lab_id: auth?.labId, userId: auth?.userId })
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
      GlobalNotification.error({
        title: "Something went wrong",
      });
    } finally {
      if (!isActionRef.current) setIsLoading(false);
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
        srf_item_id: props?.item?.srf_item_id,
        userId: auth.userId
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
      if (!isActionRef.current) setIsLoading(false);
    }
  }

  // *** fetch SRF Config ***
  const fetchSRFConfig = async () => {
    try {
      const data = await fetch(config.Calibmaster.URL + `/api/srf-config/fetch/${auth.labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });

      let response = await data.json();
      const { result, srfNo, existingSrfDates } = response;
      setExistingSrfDates(existingSrfDates);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    (props.item.calibration_done_date) ? setCalibrationDate(props.item.calibration_done_date) : setCalibrationDate("");
    (props.item.report_done_date) ? setReportGenerateDate(props.item.report_done_date) : setReportGenerateDate("");
    (props.item.labtype) ? setlab_type(props.item.labtype) : setlab_type("");

    certificateHandler();
    fetchSRFConfig();
  }, [props.item?.srf_item_id, props.item?.calibration_done_date, props.item?.report_done_date]);

  useEffect(() => {
    fetchCMSSettings();
  }, []);

  // Update Calalibration Status Handler
  const updatecalHandler = async (mode, isSubcall = false) => {
    if (!isSubcall) isActionRef.current = true;
    setIsLoading(true);
    let isSuccess = false;
    try {

      if (mode == 1) {
        if (calibrationDate == "") {
          setCalibrationDateErr("Please set the calibration date");
          if (!isSubcall) setIsLoading(false);
          return;
        }
        setIsCalibrationSaved(true);
      }

      if (mode == 2) {
        if (reportGenerateDate == "") {
          setReportGenerateDateErr("Please set the report generated date");
          if (!isSubcall) setIsLoading(false);
          return;
        }
      }

      if (mode == 3) {
        if (calibrationDate == "") {
          setCalibrationDateErr("Please set the calibration date");
          if (!isSubcall) setIsLoading(false);
          return;
        }

        if (reportGenerateDate == "") {
          setReportGenerateDateErr("Please set the report generated date");
          if (!isSubcall) setIsLoading(false);
          return;
        }
      }



      const requestBody = {
        id: props.item.srf_item_id,
        srfId: props.item.srf_id,
        mode: mode,
        date: calibrationDate,
        reportGenerateDate: reportGenerateDate,
        userName: auth.name,
        userId: auth.userId
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


      const response = await fetch(config.Calibmaster.URL + "/api/srf/updatecalinfo", requestOptions);
      const data = await response.json();

      if (data && data.code === 200) {

        dispatch(srfitemsActions.changesrfitems(data.data.items));

        await fetchSRFItems();

        if (mode === 3 && canGenerateCertificate) {
          const certSuccess = await generateCertificateHandler(true);
          if (!certSuccess) return; // Stop if certificate generation failed
        }

        GlobalNotification.success({
          title: 'SRF Item Updated Successfully!!',
          description: "Instrument : " + props?.item?.intrument_type?.instrument_full_name,
          duration: 1
        });
        isSuccess = true;

      } else {
        GlobalNotification.error({
          title: "Error while Updating SRF Item!!",
          description: data.message,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (!isSubcall) {
        setIsLoading(false);
        isActionRef.current = false;
        if (isSuccess) {
          props.onclose();
        }
      }
      console.log("called update cal handler" + " mode=" + mode + " isSuccess=" + isSuccess);
    }
    return isSuccess;
  };


  // Generate Certificate Handler
  const generateCertificateHandler = async (isSubcall = false) => {
    if (!isSubcall) isActionRef.current = true;
    let isSuccess = false;
    try {

      setIsLoading(true);

      if (reportGenerateDate == "") {
        setReportGenerateDateErr("Please set the report generated date");
        if (!isSubcall) setIsLoading(false);
        return false;
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
        calibrationDate,
        sendDraft,
        userId: auth.userId
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
        const updateSuccess = await updatecalHandler(2, true);
        if (updateSuccess) {
          GlobalNotification.success({
            title: 'Certificate Generated',
            description: 'The certificate has been generated successfully.',
            duration: 1
          });
          isSuccess = true;
        }
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
      if (!isSubcall) {
        setIsLoading(false);
        isActionRef.current = false;
      }
    }
    return isSuccess;
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
        body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
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



  const recentDate = existingSrfDates
    .map((d) => new Date(d))
    .reduce((max, curr) => (curr > max ? curr : max), new Date(0));

  const recentDateStr = recentDate.toISOString().split("T")[0];

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
                <Row gutter={[16, 16]} align="middle" justify={props.item.status === "Not Calibrated" ? "start" : "center"} wrap>
                  {/* Calibration Date */}
                  {props.item.status === "Not Calibrated" && (
                    <Col xs={24} sm={12} md={6}>
                      <DatePicker
                        value={calibrationDate ? dayjs(calibrationDate) : null}
                        onChange={(value) => {
                          setCalibrationDate(value ? value.format("YYYY-MM-DD") : "");
                          setCalibrationDateErr("");
                        }}
                        style={{ width: "100%" }}
                        placeholder="Select Calibration Done Date"
                        size="large"
                        disabledDate={(current) => {
                          if (!current) return false;
                          const tooEarly = props.srf?.srf_date ? current < dayjs(props.srf.srf_date).startOf("day") : false;
                          const tooLate = current > dayjs().endOf("day");
                          return tooEarly || tooLate;
                        }}
                      />
                      {calibrationDateErr && <Text type="danger">{calibrationDateErr}</Text>}
                    </Col>
                  )}


                  {/* Draft Switch */}
                  <Col xs={24} sm={12} md={4} style={{ display: "flex", justifyContent: "center" }}>
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
                  <Col xs={24} sm={12} md={6}>
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
                        disabled={!GenerateCertificate || isMasterBlocked}
                        disabledDate={(current) => {
                          if (!current) return false;
                          const tooEarly = calibrationDate ? current < dayjs(calibrationDate).startOf("day") : false;
                          const tooLate = current > dayjs().endOf("day");
                          return tooEarly || tooLate;
                        }}
                      />
                    </Tooltip>
                    {reportGenerateDateErr && <Text type="danger">{reportGenerateDateErr}</Text>}
                  </Col>

                  {/* Generate / Mark Report */}
                  {props.item.status !== "Not Calibrated" && (
                    <Col xs={24} sm={12} md={8}>
                      {canGenerateCertificate && hasPermission("ENTER_RESULT") && (!hasPermission("ASSIGNED_ACTION_ONLY") || props.item.assignedTo === auth.userId) ? (
                        <Button
                          type="primary"
                          icon={<FilePdfOutlined />}
                          onClick={() => generateCertificateHandler()}
                          disabled={!GenerateCertificate || isMasterBlocked}
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
                  )}

                  {/* Combined Action */}
                  {props.item.status === "Not Calibrated" && (
                    <Col xs={24} md={8}>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        onClick={() => updatecalHandler(3)}
                        disabled={!GenerateCertificate || isMasterBlocked}
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
              <div
                style={{
                  marginTop: 20,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 60%, #D1FAE5 100%)",
                  border: "1.5px solid #86EFAC",
                  boxShadow: "0 4px 20px 0 rgba(34,197,94,0.10)",
                  padding: "28px 32px",
                  textAlign: "center",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {/* Big check icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "#22C55E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 0 0 8px #BBF7D0, 0 4px 16px rgba(34,197,94,0.30)",
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Headline */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#14532D",
                    marginBottom: 6,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Calibration & Report Completed
                </div>

                {/* Subtext */}
                <div
                  style={{
                    fontSize: 13,
                    color: "#166534",
                    fontWeight: 400,
                    maxWidth: 380,
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  The calibration process and report generation for this instrument have been successfully completed.
                  No further action is required at this stage.
                </div>

                {/* Status pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#15803D",
                    backgroundColor: "#DCFCE7",
                    border: "1px solid #86EFAC",
                    borderRadius: 999,
                    padding: "4px 14px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#22C55E", display: "inline-block" }} />
                  Workflow Finalized
                </div>
              </div>
            )}

          </>
        )

      )}



      < Spin spinning={isLoading} fullscreen={true} size="large" />
    </Modal>

  );
};

export default UpdateCal;
