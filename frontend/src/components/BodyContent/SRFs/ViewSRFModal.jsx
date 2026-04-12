import "./ViewSRFModal.css";
import { Spinner, Button } from "react-rainbow-components";
//import { Modal } from "react-rainbow-components";
import { useContext, useEffect, useState } from "react";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import SRFItemsList from "./SRFItemsList";
import { srfitemsActions } from "../../../store/srfitems";
import UpdateDCModal from "./UpdateDCModal";
import UpdateInvoice from "./UpdateInvoice";
import UpdatePaymentStatus from "./UpdatePaymentStatus";
import UpdateReportModal from "./UpdateReportModal";
import UpdateCalibrationStatus from "./UpdateCalibrationStatus";
import UpdateBulkDCStatus from "./UpdateBulkDCStatus";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import { Modal } from "antd";

const ViewSRFModal = (props) => {
  const [error, setError] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState(null);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const selecteditems = useSelector((state) => state.selecteditems.list);
  const [updatedispatchModal, setupdatedispatchModal] = useState(false);
  const [updatereportModal, setupdatereportModal] = useState(false);
  const [updateinvoiceModal, setupdateinvoiceModal] = useState(false);
  const [updatepaymentModal, setupdatepaymentModal] = useState(false);
  const [updateCalibrationModal, setUpdateCalibrationModal] = useState(false);
  const [updateDCStatusModal, setUpdateDCStatusModal] = useState(false);

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
        body: JSON.stringify({ srfId: props.srfid }),
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
              setIsLoaded(true);
            } else {
              dispatch(
                notificationActions.changenotification(errornotification)
              );
              setError(data.message);
            }
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError("Error while Getting SRF Detail!!");
          }
        })
        .catch((err) => {
          console.log(err);
          dispatch(notificationActions.changenotification(errornotification));
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
      return (data.status == "Not Calibrated" || data.status == "Calibrated");
    })
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
        title={<h2  className="text-lg font-bold my-3 text-center w-full">SRF Detail</h2>}
        className="view__srf__modal"
        destroyOnClose
        footer={
          <div className="rainbow-flex center">
            <p className="red w100">{error}</p>
            {selecteditems && selecteditems.length > 0 ? (
              <>
                {((auth.department == "admin" || (auth.department == "Calibration" && checkStatusForCalibration()) || auth.department === "Manager") && (updateModals[0] || updateModals[1] || updateModals[2])) ? (
                  <Button
                    label="Update"
                    variant="brand"
                    onClick={updateCalibrationModalHandler}
                    className="mar051"
                  />
                ) : null}

                {(auth.department == "admin" || (auth.department == "CSD" && checkStatusForCSD()) || auth.department === "Manager") && updateModals[2] ? (
                  <Button
                    label="Update Dispatch Details"
                    variant="brand"
                    onClick={updatedispatchModalHandler}
                    className="mar051"
                  />
                ) : null}

                {(auth.department == "admin" || (auth.department == "CSD" && checkStatusForCSDAfterDispatch()) || auth.department === "Manager") && updateModals[3] ? (
                  <Button
                    label="Update Report Dispatch Details"
                    variant="success"
                    onClick={updatereportModalHandler}
                    className="mar051"
                  />
                ) : null}

                {(auth.department == "admin" || (auth.department == "Accounts" && checkStatusForAccount()) || auth.department === "Manager") && updateModals[4] ? (
                  <Button
                    label="Update Invoice Detail"
                    variant="brand"
                    onClick={updateinvoiceModalHandler}
                    className="mar051"
                  />
                ) : null}

                {(auth.department == "admin" || (auth.department == "Accounts" && checkStatusForAccountAfterInvoice()) || auth.department === "Manager") && updateModals[5] ? (
                  <Button
                    label="Update Payment Status"
                    variant="success"
                    onClick={updatepaymentModalHandler}
                    className="mar051"
                  />
                ) : null}

                {/* {auth.department == "admin" || auth.department == "CSD" ? (
                  <Button
                    label="Update DC Status"
                    variant="success"
                    onClick={updateDCStatusModalHandler}
                    className="mar051"
                  />
                ) : null} */}
              </>
            ) : null}
          </div>
        }
      >
        {srf ? (
          <div className="srf__container">
            <div className="srf__header__container">

              <p className="bold">
                SRF Number: <span className="black normal">{srf?.srf_number}</span>
              </p>

              <p className="bold">
                SRF Date: <span className="black normal">{convertDateFormat(srf?.created_timestamp)}</span>
              </p>

              <p className="bold">
                Customer Name:{" "}
                <span className="black normal">{srf?.customer?.customer_name}</span>
              </p>

              <p className="bold">
                Customer Address:{" "}
                <span className="black normal">
                  {srf?.customer?.address1
                    ? [srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3].filter(Boolean).join(", ")
                    : ""}
                </span>
              </p>

              {auth.department != "Calibration" ? (
                <>
                  <p className="bold">
                    Contact Person:{" "}
                    <span className="black normal">{srf?.contact_name}</span>
                  </p>

                  <p className="bold">
                    Contact Number:{" "}
                    <span className="black normal">{srf?.contact_number}</span>
                  </p>

                  <p className="bold">
                    Department:{" "}
                    <span className="black normal">{srf?.department}</span>
                  </p>
                </>
              ) : null}

              <p className="bold">
                Customer DC: <span className="black normal">{srf?.customer_dc}</span>
              </p>

              <p className="bold">
                Customer DC Date:{" "}
                <span className="black normal">{convertDateFormat(srf?.customer_dc_date)}</span>
              </p>

            </div>
            <div className="srf__body__container">
              <SRFItemsList srfId={srf.srf_id} checkbox={true} srf={srf} setupdateModals={setupdateModals} refetchData={getSRFDetail} />
            </div>
          </div>
        ) : null}

      </Modal>
      {updatedispatchModal ? (
        <UpdateDCModal
          isopen={updatedispatchModal}
          onclose={updatedispatchModalHandler}
          srfid={srf.srf_id}
          srfNo={srf.srf_number}
          mode="updatedc"
        />
      ) : null}

      {updatereportModal ? (
        <UpdateReportModal
          isopen={updatereportModal}
          onclose={updatereportModalHandler}
          srfid={srf.srf_id}
          srfNo={srf.srf_number}
          mode="updatereport"
        />
      ) : null}

      {updateinvoiceModal ? (
        <UpdateInvoice
          isopen={updateinvoiceModal}
          onclose={updateinvoiceModalHandler}
          srfid={srf.srf_id}
          srfNo={srf.srf_number}
          mode="updateinvoice"
        />
      ) : null}

      {updatepaymentModal ? (
        <UpdatePaymentStatus
          isopen={updatepaymentModal}
          onclose={updatepaymentModalHandler}
          srfid={srf.srf_id}
          srfNo={srf.srf_number}
          mode="updatepayment"
        />
      ) : null}

      {updateCalibrationModal ? (
        <UpdateCalibrationStatus
          isopen={updateCalibrationModal}
          onclose={updateCalibrationModalHandler}
          srfid={srf.srf_id}
          srfNo={srf.srf_number}
          mode="updateCalibration"
        />
      ) : null}

      {updateDCStatusModal ? (
        <UpdateBulkDCStatus
          isopen={updateDCStatusModal}
          onclose={updateDCStatusModalHandler}
          srf_id={srf.srf_id}
          mode="updateCalibration"
          closeViewModal={props}
        />
      ) : null}
    </div>
  );
};

export default ViewSRFModal;
