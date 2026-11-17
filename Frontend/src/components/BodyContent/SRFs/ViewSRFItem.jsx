import { useContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, FileSelector, GoogleAddressLookup } from "react-rainbow-components";
//import { Modal} from "react-rainbow-components";
import StatusBadge from "../../UI/StatusBadge";
import CustomProgress from "../../UI/CustomProgress";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import DownloadCertificate from "./DownloadCertificate";
import "./ViewSRFItem.css";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { renderToString } from 'react-dom/server';
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { convertDateFormat, formatDateTime } from "../../../utils/filters";
import DownloadObservation from "./DownloadObservation";
import { Modal, Space, Spin, Descriptions, Tag, Typography, Card, Divider, Button as AntButton, Tooltip, Segmented, Table } from "antd";
import {
  BarcodeOutlined,
  QrcodeOutlined,
  ToolOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  CalendarOutlined,
  UserOutlined,
  CarryOutOutlined,
  FileSearchOutlined,
  SendOutlined,
  TruckOutlined,
  AuditOutlined,
  MonitorOutlined,
  FileProtectOutlined,
  PayCircleOutlined,
  MessageOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UserSwitchOutlined,
  InfoCircleTwoTone,
  NumberOutlined,
  FieldNumberOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import DownloadDraftCertificate from "./DownloadDraftCertificate";
import { IdCard, IdCardLanyard } from "lucide-react";

const { Text } = Typography;


const ViewSRFItem = (props) => {
console.log(props,"props");

  const auth = useContext(AuthContext);
  const dispatch = useDispatch("");

  // *** Generate Certificate ***
  const [canGenerateCertificate, setCanGenerateCertificate] = useState(false);
  const [isGenerateCertificate, setIsGenerateCertificate] = useState(false);


  const [GenerateCertificate, setGenerateCertificate] = useState(false);


  const [isuncertainty, setuncertainty] = useState(false)
  const [isobservation, setisobservation] = useState(false)

  const [sendDraft, setSendDraft] = useState(false)
  const [isDraft, setisDraft] = useState(false)

  const [isloading, setisloading] = useState(false)
  const [labelType, setLabelType] = useState('qr')

  useEffect(() => {
    if (props.item) {
      fetchCMSSettings();
      certificateHandler();
    }
  }, [props.item]);

  // *** fetch CMS Settings Permissions ***
  const fetchCMSSettings = async () => {
    try {
      setisloading(true)

      const data = await fetch(config.Calibmaster.URL + "/api/cms-permissions-setting/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth?.token,
        },
        body: JSON.stringify({ lab_id: auth?.labId, userId: auth.userId })
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
      setisloading(false)
    }
  }

  // *** fetch certificate check ***
  const certificateHandler = async () => {

    try {

      setisloading(true)

      // *** Create Request Body object ***
      const requestBody = {
        srf_item_id: props?.item?.srf_item_id,
        lab_id: props?.item?.lab_id,
        srf_id: props?.item?.srf_id,
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
      const { check, isGenerateCertificate, check_uncertainty, check_observation, check_draft } = await response.json();
      setIsGenerateCertificate(check);
      setGenerateCertificate(isGenerateCertificate)
      setuncertainty(check_uncertainty)
      setisobservation(check_observation)
      setisDraft(check_draft)
    } catch (error) {
      console.log(error)
    } finally {
      setisloading(false)
    }
  }

  // *** Build QR/Barcode data payload ***
  const getCodeData = () => {
    const { srf_item_id, srf_id, lab_id, srf, intrument_type_id } = props?.item || {};
    return {
      srf_no: srf?.srf_number,
      srf_id,
      srf_item_id: String(srf_item_id),
      intrument_type_id,
      lab_id
    };
  };

  // *** Generate QR code for View ***
  const ViewQRcode = () => {
    const qrData = getCodeData();
    return <QRCode className="qr-code" value={JSON.stringify(qrData)} size={150} />
  };

  // *** Generate Barcode for View ***
  const ViewBarcode = () => {
    const barcodeData = getCodeData();
    return (
      <div style={{ width: '100%', maxWidth: '340px', overflow: 'hidden' }}>
        <div style={{ transform: 'scaleX(0.55)', transformOrigin: 'left center' }}>
          <Barcode
            value={JSON.stringify(barcodeData)}
            width={1}
            height={50}
            fontSize={0}
            margin={2}
            displayValue={false}
            format="CODE128"
          />
        </div>
      </div>
    );
  };

  // *** Generic download handler for both QR & Barcode ***
  const handleDownloadLabel = async (e, type) => {
    e.preventDefault();
    const { srf_item_id, srf } = props?.item;
    const codeData = getCodeData();
    const codeDataStr = JSON.stringify(codeData);

    if (type === 'barcode') {
      // Use JsBarcode directly on canvas (renderToString won't work with react-barcode)
      const JsBarcode = (await import('jsbarcode')).default;
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, codeDataStr, {
        format: 'CODE128',
        width: 1,
        height: 70,
        displayValue: false,
        margin: 10,
      });

      // Create composite label with barcode + SRF info
      const padding = 20;
      const textAreaHeight = 50;
      const totalWidth = barcodeCanvas.width + padding * 2;
      const totalHeight = barcodeCanvas.height + textAreaHeight + padding;

      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = totalWidth;
      compositeCanvas.height = totalHeight;
      const ctx = compositeCanvas.getContext('2d');

      // White background with rounded border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, 0); ctx.lineTo(totalWidth - 12, 0);
      ctx.quadraticCurveTo(totalWidth, 0, totalWidth, 12);
      ctx.lineTo(totalWidth, totalHeight - 12);
      ctx.quadraticCurveTo(totalWidth, totalHeight, totalWidth - 12, totalHeight);
      ctx.lineTo(12, totalHeight);
      ctx.quadraticCurveTo(0, totalHeight, 0, totalHeight - 12);
      ctx.lineTo(0, 12);
      ctx.quadraticCurveTo(0, 0, 12, 0);
      ctx.closePath();
      ctx.stroke();

      // Draw barcode
      ctx.drawImage(barcodeCanvas, padding, 8);

      // Draw SRF text
      const textY = barcodeCanvas.height + 16;
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('SRF NO:', padding, textY);
      ctx.fillStyle = '#334155';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(srf?.srf_number || 'N/A', padding, textY + 20);

      const dataUrl = compositeCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `barcode-label-${srf_item_id}.png`;
      link.click();
      return;
    }

    // QR code download (renderToString works fine for react-qr-code)
    const component = (
      <div style={{ 
        width: '220px', 
        padding: '16px', 
        border: '1px solid #cbd5e1', 
        borderRadius: '16px', 
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <QRCode type="svg" value={codeDataStr} size={186} bordered={false} style={{ padding: 0 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>SRF NO:</span>
          <span style={{ fontSize: '13px', color: '#334155' }}>{srf?.srf_number}</span>
        </div>
      </div>
    );

    const htmlString = renderToString(component);
    const divContainer = document.createElement('div');
    divContainer.id = `Card-${srf_item_id}`;
    divContainer.style.width = '220px';
    divContainer.innerHTML = htmlString;
    document.body.appendChild(divContainer);

    const canvas = await html2canvas(divContainer, { useCORS: true });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-label-${srf_item_id}.png`;
    link.click();
    document.body.removeChild(divContainer);
  };

  const InfoRow = ({ icon, label, children }) => (
    <div className="flex items-start gap-3 py-2">
      {/* Icon */}
      <div className="text-slate-400 text-sm mt-[2px]">
        {icon}
      </div>

      {/* Label */}
      <div className="w-[130px] text-[13px] text-slate-500 font-semibold">
        {label}
      </div>

      {/* Colon */}
      <div className="text-slate-400">:</div>

      {/* Value */}
      <div className="flex-1 text-[13px] text-slate-800 font-medium">
        {children}
      </div>
    </div>
  );
  return (
    <>
      <Modal
        id="modal-1"
        open={props.isOpen} // antd open modal 
        onCancel={props.onclose} // antd close modal
        footer={null}
        centered={true}
        //isOpen={props.isOpen}
        //onRequestClose={props.onclose}
        className="view__srf__item__modal"
      >
        {/* <h2 className="text-lg font-bold my-5 text-center">SRF Item Detail</h2> */}

        {/* {JSON.stringify(props?.item.srf)} */}

        <div className="flex flex-col gap-5 bg-slate-50/50 p-1 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Instrument Details Card */}

            <Card
              size="small"
              className="shadow-sm border rounded-xl"
              title={<Space><ToolOutlined className="text-blue-500" /><Text strong>Instrument Details</Text></Space>}
            >
              <div className="divide-y divide-slate-100">

                <InfoRow icon={<InfoCircleOutlined />} label="Description">
                  <Tag color={"blue"} className="bg-slate-100  text-slate-700 text-xs font-semibold px-2 py-[2px] rounded">
                    {props?.item.intrument_type?.instrument_full_name}
                  </Tag>
                </InfoRow>

                <InfoRow icon={<SettingOutlined />} label="Make / Model">
                  {props?.item?.make || "N/A"} / {props?.item?.model || "N/A"}
                </InfoRow>

                <InfoRow icon={<IdcardOutlined />} label="Identification">
                  <span className="text-xs text-slate-500">
                    {props?.item?.identification_details || "N/A"}
                  </span>
                </InfoRow>

                <InfoRow icon={<MonitorOutlined />} label="Status">
                  <StatusBadge value={props?.item?.status} size="sm" />
                </InfoRow>

                <InfoRow icon={<NumberOutlined />} label="Inward Number">
                  <Tag color={"blue-inverse"} className="text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.inward_no || "N/A"}
                  </Tag>
                </InfoRow>

              </div>
            </Card>

            {/* Calibration & Workflow Card */}
            <Card
              size="small"
              className="shadow-sm border rounded-xl"
              title={<Space><FieldTimeOutlined className="text-emerald-500" /><Text strong>Calibration Timeline</Text></Space>}
            >
              <div className="divide-y divide-slate-100">

                <InfoRow icon={<IdcardOutlined />} label="SRF No">
                  <Tag color={"error"} className="text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.srf?.srf_number}
                  </Tag>
                </InfoRow>

                <InfoRow icon={<SafetyCertificateOutlined />} label="Certificate No">
                  <span className="font-mono text-xs">
                    {props?.item?.certificate_no || "N/A"}
                  </span>
                </InfoRow>

                <InfoRow icon={<SafetyCertificateOutlined />} label="ULR No">
                  <span className="font-mono text-xs">
                    {props?.item?.url_number || "N/A"}
                  </span>
                </InfoRow>

                <InfoRow icon={<UserSwitchOutlined />} label="Calibrated By">
                  <Tag color={"success"} className="text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.calibration_done_by_empname || "N/A"}
                  </Tag>
                </InfoRow>
                <InfoRow icon={<CarryOutOutlined />} label="Calib. Date">
                  <div className="flex flex-col leading-tight">
                    <span>{convertDateFormat(props?.item?.calibration_done_date)}</span>
                  </div>
                </InfoRow>

                <InfoRow icon={<UserSwitchOutlined />} label="Report Done By">
                  <Tag color={"volcano"} className="text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.report_done_by_empname || "N/A"}
                  </Tag>
                </InfoRow>
                <InfoRow icon={<FileSearchOutlined />} label="Report Date">
                  <div className="flex flex-col leading-tight">
                    <span>{convertDateFormat(props?.item?.report_done_date)}</span>
                  </div>
                </InfoRow>



              </div>
            </Card>

            {/* Dispatch Information Card */}
            <Card
              size="small"
              className="shadow-sm border rounded-xl"
              title={<Space><TruckOutlined className="text-purple-500" /><Text strong>Dispatch Information</Text></Space>}
            >
              <div className="divide-y divide-slate-100">

                <InfoRow icon={<SendOutlined />} label="Report Dispatch">
                  {convertDateFormat(props?.item?.report_dispatch_date)} ({props?.item?.report_dispatch_mode || "N/A"})
                </InfoRow>

                <InfoRow icon={<TruckOutlined />} label="Item Dispatch">
                  {convertDateFormat(props?.item?.dispatch_date)} ({props?.item?.dispatch_mode || "N/A"})
                </InfoRow>

                <InfoRow icon={<AuditOutlined />} label="Dispatch DC">
                  <Tag className="bg-purple-50 text-purple-600 text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.dispatch_dc || "N/A"}
                  </Tag>
                </InfoRow>

              </div>
            </Card>

            {/* Extra Info & QR Label */}
            <Card
              size="large"
              className="shadow-sm border rounded-xl"
              title={<Space><FileProtectOutlined className="text-orange-500" /><Text strong>Additional Details</Text></Space>}
            >
              <div className="divide-y divide-slate-100">

                <InfoRow icon={<PayCircleOutlined />} label="Invoice No">
                  {props?.item?.invoice_no || "N/A"}
                </InfoRow>

                <InfoRow icon={<MessageOutlined />} label="Remarks">
                  <Tag color={"orange-inverse"} className="text-xs font-mono px-2 py-[2px] rounded">
                    {props?.item?.remarks || "No remarks"}
                  </Tag>
                </InfoRow>

                <div className="py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <BarcodeOutlined className="text-slate-400" />
                    <span className="text-[13px] text-slate-500 font-semibold">Print Label</span>
                    <Segmented
                      size="small"
                      value={labelType}
                      onChange={setLabelType}
                      options={[
                        { label: <span><QrcodeOutlined /> QR Code</span>, value: 'qr' },
                        { label: <span><BarcodeOutlined /> Barcode</span>, value: 'barcode' },
                      ]}
                      className="ml-2"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="border rounded-lg p-2 bg-white">
                      {labelType === 'qr' ? ViewQRcode() : ViewBarcode()}
                    </div>
                    <Tooltip title={`Download ${labelType === 'qr' ? 'QR Code' : 'Barcode'} Label`}>
                      <AntButton
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={(e) => handleDownloadLabel(e, labelType)}
                        size="middle"
                      >
                        Download
                      </AntButton>
                    </Tooltip>
                  </div>
                </div>

              </div>
            </Card>
          </div>

          <style>{`
              .srf-unified-descriptions .ant-descriptions-item {
                  padding-bottom: 12px !important;
              }

              .srf-unified-descriptions .ant-descriptions-item:last-child {
                  padding-bottom: 0 !important;
              }

              .srf-unified-descriptions .ant-descriptions-item-label {
                  font-size: 13px !important;
                  color: #64748B !important;
                  font-weight: 600 !important;
              }

              .srf-unified-descriptions .ant-descriptions-item-content {
                  font-size: 13px !important;
                  color: #0F172A !important;
                  font-weight: 500 !important;
              }
          `}</style>
        </div>

        <CustomProgress
          options={config.SRF_ITEM_STATUS_LIST}
          current={props?.item?.status}
        />

        {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <div className="srf__item__details" >
            {canGenerateCertificate && props?.item?.report_done_date && isGenerateCertificate ? <DownloadObservation item={props?.item} /> : ""}
          </div>

          <div className="srf__item__detail" >
            {canGenerateCertificate && props?.item?.report_done_date && isGenerateCertificate ? <DownloadCertificate item={props?.item} /> : ""}
          </div>

          <div className="srf__item__detail" >
            {canGenerateCertificate && props?.item?.report_done_date && isGenerateCertificate ? <DownloadCertificate item={props?.item} /> : ""}
          </div>
        </div> */}


        {/* Certificate Buttons */}
        <Space size="middle" style={{ marginBottom: 0, width: "100%", justifyContent: "center" }}>
          {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isobservation && (
            <DownloadObservation item={props?.item} />
          )}
          {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isuncertainty && (
            <DownloadCertificate item={props?.item} />
          )}
          {canGenerateCertificate && props.item?.report_done_date && isGenerateCertificate && isDraft && (
            <DownloadDraftCertificate item={props?.item} />
          )}
        </Space>


        <Spin spinning={isloading} fullscreen={true} size="large" />
      </Modal >
    </>
  );
};

export default ViewSRFItem;
