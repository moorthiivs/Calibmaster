import "./UpdateInvoice.css";
import { Modal, Spinner, Button, Card, TableWithBrowserPagination, Column, FileSelector } from "react-rainbow-components";
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
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";

const UpdateInvoice = (props) => {

  const [error, setError] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState([]);
  const [srfItems, setSrfItems] = useState([]);
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [newfilemodal, setNewFileModal] = useState(false);
  const [newfileerror, setNewFileError] = useState("");
  const [newfilemessage, setNewFileMessage] = useState("");
  const [files, setFiles] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [responseFileName, setResponseFileName] = useState("");

  const selecteditems = useSelector((state) => state.selecteditems.list);
  const auth = useContext(AuthContext);
  const [fileKey, setFileKey] = useState(Date.now());
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
    setTitle("Update Invoice Detail!!");
  }, [props]);

  const containerStyles = {
    maxWidth: 300,
  };

  // const handleChange = (value) => {
  //   if (value.length > 0) {
  //     getBase64(value[0], (result) => {
  //       setFiles(result);
  //     });
  //   } else {
  //     setFiles("");
  //   }
  // };
  const handleChange = (value) => {
    if (value.length === 0) {
      setFiles("");
      return;
    }

    const file = value[0];

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and PDF files are allowed");
      setNewFileError("Only JPG, PNG, and PDF allowed");
      setFileKey(Date.now());
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNewFileError("File must be less than 2MB");
      setFileKey(Date.now());
      return;
    }
    getBase64(file, (result) => {
      setFiles(result);
    });
  };

  const newfileHanlder = () => {
    if (files.length > 0) {
      setNewFileError("");
      setNewFileMessage("File is Selected!!");
      setTimeout(() => {
        setNewFileModal(!newfilemodal);
      }, 500);
    } else {
      setNewFileMessage("");
      setNewFileError("File is not Selected!!");
    }
  }

  const updateinvoiceHandler = async () => {

    if (!invoiceNo || !invoiceDate || !invoiceDueDate || !files) {
      return alert("Please enter all the required fields");
    }

    try {
      setIsLoading(true);

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          items: selecteditems,
          invoiceinfo: {
            invoice_no: invoiceNo,
            invoice_date: invoiceDate,
            invoice_due_date: invoiceDueDate,
            status: "Invoice Generated",
            labId: auth.labId
          },
          srfId: srf.srf_id,
          file: files
        })
      };

      let response = await fetch(config.Calibmaster.URL + "/api/srf/updateinvoice", requestOptions);
      response = await response.json();
      console.log(response);

      if (response?.code === 201) {

        setResponseMsg(response?.message);
        setResponseFileName(response?.filename);
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
      console.log(error);
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

  if (!isLoaded || isLoading)
    return <Loader />;

  return (
    <div className="view__srf__modal__container">
      <Modal
        id="view__srf"
        isOpen={props.isopen}
        onRequestClose={props.onclose}
        title={title}
        className="view__srf__modal"
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

              <div className="srf__items__container">

                <Card className="items__table__card my-5">
                  <SRFItemsListView srfItems={selecteditems} />
                </Card>

                <Card className="items__table__card my-5">
                  <div className="dc__info__container flex gap-5 my-5 mx-10 justify-center" >
                    <div >
                      <CustomInput
                        label="Invoice No."
                        type="text"
                        required={true}
                        onchange={(v) => setInvoiceNo(v)}
                      />
                    </div>
                    <div >
                      <CustomDatePicker
                        label={"Invoice Date"}
                        setDate={(v) => setInvoiceDate(v)}
                        date={invoiceDate}
                        required={true}
                      />
                    </div>
                    {invoiceDate ? <div >
                      <CustomDatePicker
                        label={"Invoice Due Date"}
                        setDate={(v) => setInvoiceDueDate(v)}
                        date={invoiceDueDate}
                        minDate={new Date(invoiceDate)}
                        required={true}
                      />
                    </div> : <div></div>}

                    {/* <div className="add__srf__item__container">
                      <CustomDatePicker
                        label={"Invoice Due Date"}
                        setDate={(v) => setInvoiceDueDate(v)}
                        date={invoiceDueDate}
                        minDate={new Date(invoiceDate)}
                        required={true}
                      />
                    </div> */}

                    <div className={'flex justify-center items-center'}>
                      <Button
                        variant="neutral"
                        label="Upload"
                        onClick={() => {
                          setNewFileModal(true);
                        }}
                        className="w-[200px] mt-5"
                      />
                    </div>
                    {
                      responseFileName && <div>
                        <h5 style={{ textAlign: "center", color: "green" }}>
                          Invoice Filename: {responseFileName}
                        </h5>
                      </div>
                    }
                  </div>
                </Card>

                <div style={{ display: "flex", flexDirection: "column-reverse" }}>
                  {
                    responseMsg && <p style={{ color: "green" }}>{responseMsg}</p>
                  }
                  <Button
                    label="Update Invoice Detail"
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

      {newfilemodal ? (
        <Modal
          id="modal-1"
          isOpen={newfilemodal}
          onRequestClose={() => setNewFileModal(!newfilemodal)}
        >
          <div className="new_file_modal">
            <h2>Upload Invoice</h2>
            <div>
              <FileSelector
                key={fileKey}
                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                style={containerStyles}
                label="File selector"
                placeholder="Drag & Drop or Click to Browse"
                bottomHelpText="Select only one file"
                variant="multiline"
                onChange={handleChange}
                accept=".pdf"
              />
            </div>
            <div className="button_container">
              <Button
                label="Upload"
                onClick={newfileHanlder}
                variant="success"
                className="rainbow-m-around_medium"
              />
            </div>
            <p className="new_file_error" style={{ textAlign: "center" }}>{newfileerror}</p>
            <p className="new_file_success" style={{ textAlign: "center" }}>{newfilemessage}</p>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};
export default UpdateInvoice;

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

        <Column header="S.No" field="srf_item_id" component={({ index }) => index + 1} />
        <Column header="Description of Item" field="intrument_type" component={findIntrumentTypeName} />
        <Column header="Make" field="make" />
        <Column header="Model" field="model" />
        <Column header="Serial Number" field="serial_no" />
        <Column header="Id Number" field="identification_details" />
        <Column header="Status" field="status" component={StatusBadge} />
        <Column header="Remarks" field="remarks" />

      </TableWithBrowserPagination>
    </>
  );
}
