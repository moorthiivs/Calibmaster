import { useContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, FileSelector, Card, GoogleAddressLookup } from "react-rainbow-components";
//import { Modal} from "react-rainbow-components";
import StatusBadge from "../../UI/StatusBadge";
import CustomProgress from "../../UI/CustomProgress";
import config from "../../../utils/config.js";
import { AuthContext } from "../../../context/auth-context";
import { notificationActions } from "../../../store/nofitication";
import DownloadCertificate from "./DownloadCertificate";
import "./ViewSRFItem.css";
import QRCode from "react-qr-code";
import { renderToString } from 'react-dom/server';
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { convertDateFormat } from "../../../utils/filters";
import DownloadObservation from "./DownloadObservation";
import { Modal, Space, Spin } from "antd";
import DownloadDraftCertificate from "./DownloadDraftCertificate";


const ViewSRFItem = (props) => {

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
        srf_id: props?.item?.srf_id
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

  // *** Generate QR code for View ***
  const ViewQRcode = () => {
    const { srf_item_id, srf_id, lab_id, srf } = props?.item;
    const qrData = {
      srf_no: srf?.srf_number,
      srf_id,
      srf_item_id,
      lab_id
    };
    return <QRCode className="qr-code" value={JSON.stringify(qrData)} size={150} />
  };

  // *** Generate and Download QR code ***
  const handleDownloadQRcode = async (e) => {
    e.preventDefault();
    const { srf_item_id, srf_id, lab_id, srf, intrument_type_id } = props?.item;
    const qrData = {
      srf_no: srf?.srf_number,
      srf_id,
      srf_item_id,
      intrument_type_id,
      lab_id
    };
    const component = <Card className={'delivery-label'}>
      <div className={"label-container"}>
        <QRCode className="qr-code" value={JSON.stringify(qrData)} size={200} />
      </div>
      <div class="footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span><b className="label-content">SRF NO: </b>{srf.srf_number}</span>
      </div>
    </Card>;
    // Create a dynamic HTML element
    const htmlString = renderToString(component);
    const divContainer = document.createElement('div');
    divContainer.id = `Card-${srf_item_id}`;
    divContainer.style.width = '220px';

    // Dynamically generate HTML content including a logo image
    divContainer.innerHTML = htmlString;

    // Append the element temporarily to the body (hidden or off-screen)
    document.body.appendChild(divContainer);

    // Use html2canvas to capture the HTML element and download it
    const canvas = await html2canvas(divContainer, { useCORS: true });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `label-${srf_item_id}.png`;
    link.click();

    // Remove the dynamically created element after the image is downloaded
    document.body.removeChild(divContainer);
  };
  return (
    <>
      <Modal
        id="modal-1"
        open={props.isOpen} // antd open modal 
        onCancel={props.onclose} // antd close modal
        footer={null}
        getContainer={false}
        centered={true}
        //isOpen={props.isOpen}
        //onRequestClose={props.onclose}
        className="view__srf__item__modal"
      >
        <h2 className="text-lg font-bold my-5 text-center">SRF Item Detail</h2>

        {/* {JSON.stringify(props?.item.srf)} */}

        <div className="srf__item__details__container">

          <div className="srf__item__detail">
            <p className="bold">
              Serial No: <span className="black normal">{props?.item?.serial_no}</span>
            </p>
          </div>
          <div className="srf__item__detail">
            <p className="bold">
              Description: <span className="black normal">{props?.item.intrument_type?.instrument_full_name}</span>
            </p>
          </div>
          <div className="srf__item__detail">
            <p className="bold">
              Make: <span className="black normal">{props?.item?.make}</span>
            </p>
          </div>
          <div className="srf__item__detail">
            <p className="bold">
              Model: <span className="black normal">{props?.item?.model}</span>
            </p>
          </div>

          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Identification Details: <span className="black normal">{props?.item?.identification_details}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Status: <StatusBadge value={props?.item?.status} />
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              SRF No: <span className="black normal">{props?.item?.srf?.srf_number}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Calibration Done Date:{" "}
              <span className="black normal">
                {convertDateFormat(props?.item?.calibration_done_date)}
              </span>
            </p>
          </div>

          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Calibration Done Name:{" "}
              <span className="black normal">{props?.item?.calibration_done_by_empname}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Report Done Date:{" "}
              <span className="black normal">
                {convertDateFormat(props?.item?.report_done_date)}
              </span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Report Done Name:{" "}
              <span className="black normal">{props?.item?.report_done_by_empname}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Report Dispatch Date:{" "}
              <span className="black normal">{convertDateFormat(props?.item?.report_dispatch_date)}</span>
            </p>
          </div>

          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Report Dispatch Mode:{" "}
              <span className="black normal">{props?.item?.report_dispatch_mode}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Item Dispatch Date:{" "}
              <span className="black normal">
                {convertDateFormat(props?.item?.dispatch_date)}
              </span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Item Dispatch DC:{" "}
              <span className="black normal">{props?.item?.dispatch_dc}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Item Dispatch Mode:{" "}
              <span className="black normal">{props?.item?.dispatch_mode}</span>
            </p>
          </div>

          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              ULR No: <span className="black normal">{props?.item?.url_number}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Invoice No: <span className="black normal">{props?.item?.invoice_no}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <p className="bold">
              Remarks: <span className="black normal">{props?.item?.remarks}</span>
            </p>
          </div>
          <div className="srf__item__detail" style={{ marginTop: "20px" }}>
            <Button borderRadius="square"
              className="item_label"
              onClick={handleDownloadQRcode}>
              <>{ViewQRcode()}<span className="label_download"><FontAwesomeIcon icon={faDownload} size="2x" /></span></>
            </Button>
          </div>

          {/* <div className="srf__item__detail">
          </div>

          <div className="srf__item__detail">
          </div>

          <div className="srf__item__detail">
          </div> */}


          {/* <div style={{ display: "flex", gap: "10px" }}>
            <div className="srf__item__details" >
              {canGenerateCertificate && props?.item?.report_done_date && isGenerateCertificate ? <DownloadObservation item={props?.item} /> : ""}
            </div>

            <div className="srf__item__detail" >
              {canGenerateCertificate && props?.item?.report_done_date && isGenerateCertificate ? <DownloadCertificate item={props?.item} /> : ""}
            </div>
          </div> */}
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
