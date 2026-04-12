import "./UpdateInvoice.css";
import { Modal, Spinner, Button, Card, TableWithBrowserPagination, Column, Input, DatePicker, Select, DateTimePicker } from "react-rainbow-components";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
import { useContext, useEffect, useState } from "react";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import CustomInput from "../../Inputs/CustomInput";
import StatusBadge from "../../UI/StatusBadge";
import config from "../../../utils/config.js";
import { getBase64 } from "../../../utils/utilfuns";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import { formattedDate } from "../../helpers/Helper";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import showErrorDialog from "../../../utils/showErrorToast";

const UpdateDCModal = (props) => {

  const [error, setError] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState([]);
  const [srfItems, setSrfItems] = useState([]);

  const [title, setTitle] = useState("");

  const [dispatchDcNo, setDispatchDcNo] = useState("");
  const [dispatchDcDate, setDispatchDcDate] = useState("");
  const [dispatchDcMode, setDispatchDcMode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");



  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const selecteditems = useSelector((state) => state.selecteditems.list);

  const [reportGenerateDate, setReportGenerateDate] = useState("");

  useEffect(() => {
    if (Array.isArray(selecteditems) && selecteditems.length === 1) {
      const singleItem = selecteditems[0];
      if (singleItem?.report_done_date) {
        setReportGenerateDate(singleItem.report_done_date);
        return;
      }
    }
    // If not exactly one item or no valid date, clear it
    setReportGenerateDate("");
  }, [selecteditems]);

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

          if (data) {
            if (data.code === 200) {
              //console.log(data);
              setSRF(data.data.srf);
              // setSrfItems(data.data.items);

              dispatch(srfitemsActions.changesrfitems(data.data.items));
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
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Getting SRF Detail!!");
        });
    }


  };

  useEffect(() => {
    if (props.srfid) {
      getSRFDetail();
    }
  }, [props.srfid]);

  useEffect(() => {
    setTitle("Update SRF Items Dispatch Information!!");
  }, [props]);

  useEffect(() => {
    if (srf?.customer_dc) {
      setDispatchDcNo(srf.customer_dc);
    } else {
      setDispatchDcNo("");
    }
  }, [srf]);


  const updateinvoiceHandler = async () => {

    if (!dispatchDcNo || !dispatchDcDate || !dispatchDcMode) {
      alert("Please Enter all required fields.");
      return
    }

    if (reportGenerateDate) {
      const confirm = await showErrorDialog(
        "Warning",
        "You have selected a report date. This will affect all selected items. Do you want to proceed?",
        "warning",
        ".view__dispatch_srf__modal"
      );

      if (!confirm) return;
    }

    try {
      setIsLoading(true);

      const bodyData = {
        items: selecteditems,
        dispatchInfo: {
          dispatch_dc: dispatchDcNo,
          dispatch_date: dispatchDcDate,
          dispatch_mode: dispatchDcMode,
          status: "Dispatched",
          labId: auth.labId
        },
        srfId: srf.srf_id,
        report_done_by_empname: auth.name,
        report_done_date: reportGenerateDate || new Date(),
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData)
      };

      let response = await fetch(config.Calibmaster.URL + "/api/srf-status/dispatch", requestOptions);
      response = await response.json();
      console.log(response);
      if (response?.code === 201) {

        setResponseMsg(response?.message);
        setIsLoading(false);
        // *** Remove the selected srf-items from redux store ***
        dispatch(selecteditemsActions.changeselecteditems([]));
        // *** Get srf-items by id and save redux store ***
        await getSRFDetail();
        // *** Get all srf-items belongs to current lab and save redux store ***
        await fetchSRFItems();

        // *** Close this modal ***
        props.onclose();
      } else {
        setResponseMsg(response?.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error)
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
        console.log(arr)
        return arr;
      }
      let getSRFList = await newSRFList(items);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
  }

  const okButtonLocalizedLabel = {
    'en-US': 'OK',
    'es-ES': 'Aceptar',
    'fr-Fr': "D'accord",
  };

  const cancelButtonLocalizedLabel = {
    'en-US': 'Cancel',
    'es-ES': 'Cancelar',
    'fr-Fr': 'Annuler',
  };


  if (!isLoaded || isLoading)
    return <Loader />;

  return (
    <div className="view__srf__modal__container">
      <Modal
        id="view__srf"
        isOpen={props.isopen}
        onRequestClose={props.onclose}
        title={title}
        className="view__dispatch_srf__modal"
        footer={
          <div className="rainbow-flex center">
            <p className="red w100">{error}</p>
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
                Company Name:{" "}
                <span className="black normal">{srf?.customer?.customer_name}</span>
              </p>

              <p className="bold">
                Company Address:{" "}
                <span className="black normal">
                  {srf?.customer?.address1
                    ? [srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3].filter(Boolean).join(", ")
                    : ""
                  }
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

              <div className="srf__items__container">

                <Card className="items__table__card mt-10" style={{ marginBottom: "1rem" }}>
                  <SRFItemsListView srfItems={selecteditems} />
                </Card>

                <Card className="items__table__card mtop1">
                  <div className="dc__info__container flex justify-center my-3 mx-5 gap-3">
                    <div className="add__srf__item__container w-full my-10" >
                      <DatePicker
                        formatStyle="medium"
                        label="Report Generated Date"
                        locale="en-IN"
                        value={reportGenerateDate}
                        required={true}
                        onChange={value => {
                          setReportGenerateDate(formattedDate(value));
                        }}
                      />
                    </div>

                    <div className="add__srf__item__container w-full my-10" >
                      <Input
                        label="Dispatch DC No"
                        placeholder="Dispatch DC No"
                        className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                        required={true}
                        onChange={(e) => setDispatchDcNo(e.target.value)}
                        value={dispatchDcNo}
                      />
                    </div>
                    <div className="add__srf__item__container w-full my-10" >
                      <DateTimePicker
                        label="Dispatch DC Date"
                        value={dispatchDcDate}
                        required={true}
                        onChange={value => setDispatchDcDate((value))}
                        formatStyle="large"
                        locale="en-IN"
                        okLabel={"OK"}
                        cancelLabel={"Cancel"}
                      />
                    </div>
                    <div className="add__srf__item__container w-full my-10" >
                      <Select
                        label="Dispatch Mode"
                        options={[
                          { value: '', label: 'Select' },
                          { value: 'Post', label: 'Post' },
                          { value: 'Courier', label: 'Courier' }
                        ]}
                        className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                        onChange={(e) => setDispatchDcMode(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                <div style={{ display: "flex", flexDirection: "column-reverse" }}>
                  {
                    responseMsg && <p style={{ color: "green" }}>{responseMsg}</p>
                  }
                  <Button
                    label="Update Dispatch Details"
                    variant="brand"
                    onClick={() => updateinvoiceHandler()}
                    className="mar051"
                  />
                </div>

              </div>
            </div>
          </div>
        ) : null}

      </Modal>
    </div>
  );
};
export default UpdateDCModal;


const SRFItemsListView = ({ srfItems }) => {



  function findIntrumentTypeName({ value }) {
    return value?.instrument_full_name;
  }



  return (
    <>
      <TableWithBrowserPagination
        className="labs__table"
        pageSize={15}
        data={srfItems}
        keyField="srf_item_id"
      >

        <Column header="S.No" field="srf_item_id" component={({ index }) => index + 1} cellAlignment={"center"} width={90} />
        <Column header="Description of Item" field="intrument_type" component={findIntrumentTypeName} cellAlignment={"center"} />
        <Column header="Make" field="make" cellAlignment={"center"} />
        <Column header="Model" field="model" cellAlignment={"center"} />
        <Column header="Serial Number" field="serial_no" cellAlignment={"center"} />
        <Column header="Id Number" field="identification_details" cellAlignment={"center"} />
        <Column header="Status" field="status" component={StatusBadge} cellAlignment={"center"} />
        <Column header="Remarks" field="remarks" cellAlignment={"center"} />
        {srfItems.some(item => !!item.report_done_date) && (
          <Column
            header="Report Done Date"
            field="report_done_date"
            cellAlignment="center"
          />
        )}

      </TableWithBrowserPagination>
    </>
  );
}
