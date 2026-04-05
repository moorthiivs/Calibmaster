import { Modal, Spinner, Button, Card, TableWithBrowserPagination, Column, Input, DatePicker, Select } from "react-rainbow-components";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
import { useContext, useEffect, useState } from "react";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import CustomInput from "../../Inputs/CustomInput";
import StatusBadge from "../../UI/StatusBadge";
import config from "../../../utils/config.json";
import { getBase64 } from "../../../utils/utilfuns";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import { sidebarActions } from "../../../store/sidebar";
import "./UpdateInvoice.css";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";

const UpdateBulkDCStatus = (props) => {

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const selecteditems = useSelector((state) => state.selecteditems.list);

    const [error, setError] = useState();
    const [isLoaded, setIsLoaded] = useState(true);
    const [srf, setSRF] = useState([]);
    const [srfItems, setSrfItems] = useState([]);

    const [responseMsg, setResponseMsg] = useState("");

    const [dcModalLoader, setdcModalLoader] = useState(false);
    const [dcStatus, setDCStatus] = useState("");

    useEffect(() => {
        if (props?.srf_id) { getSRFDetail() }
    }, [props?.srf_id]);

    // *** Get srf-items by srf-id and save redux store ***
    const getSRFDetail = async () => {

        if (props?.srf_id) {
            setIsLoaded(false);

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ srfId: props?.srf_id, srfNo: props?.srfNo }),
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

    //*** Fetch SRF Items Belongs to current Lab ***/
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

    // *** Mail Delivery Function ***
    const sendDCHandler = async () => {

        if (dcStatus == "") {
            return setResponseMsg("Please Select DC Status");
        }

        try {
            setdcModalLoader(true);

            const requestBody = {
                lab_id: auth.labId,
                srf_id: props.srf_id,
                items: selecteditems,
                dc_status: dcStatus
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

            let response = await fetch(config.Calibmaster.URL + "/api/srf/update-bulk-srf-items-dc-status", requestOptions);
            response = await response.json();
            return console.log(response);

            if (response.code == 201) {

                const newNotification = {
                    title: response.message,
                    description: "",
                    icon: "success",
                    state: true,
                    timeout: 1500,
                };
                setdcModalLoader(false);
                dispatch(notificationActions.changenotification(newNotification));

                // *** Remove the selected srf-items from redux store ***
                dispatch(selecteditemsActions.changeselecteditems([]));
                // *** Get srf-items by id and save redux store ***
                await getSRFDetail();
                // *** Get all srf-items belongs to current lab and save redux store ***
                await fetchSRFItems();
                // *** Close this modal ***
                props.onclose();
                // *** Redirect ***
                const { closeViewModal } = props;
                closeViewModal.onclose();
            } else {
                const newNotification = {
                    title: "Something went wrong",
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
                setdcModalLoader(false);
                dispatch(notificationActions.changenotification(newNotification));
            }
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            setdcModalLoader(false);
            dispatch(notificationActions.changenotification(newNotification));
        }
    }

    if (!isLoaded)
        return <Loader />;

    return (
        <div className="view__srf__modal__container">
            <Modal
                id="view__srf"
                isOpen={props.isopen}
                onRequestClose={props.onclose}
                title={"Update Delivery Challan Status"}
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
                                SRF Number: <span className="red">{srf?.srf_number}</span>
                            </p>

                            <p className="bold">
                                SRF Date: <span className="red">{convertDateFormat(srf?.created_timestamp)}</span>
                            </p>

                            <p className="bold">
                                Company Name:
                                <span className="red">{srf?.customer?.customer_name}</span>
                            </p>

                            <p className="bold">
                                Company Address:
                                <span className="red">
                                    {srf?.customer?.address1
                                        ? [srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3].filter(Boolean).join(", ")
                                        : ""
                                    }
                                </span>
                            </p>

                            {auth.department != "Calibration" ? (
                                <>
                                    <p className="bold">
                                        Contact Person:
                                        <span className="red">{srf?.contact_name}</span>
                                    </p>

                                    <p className="bold">
                                        Contact Number:
                                        <span className="red">{srf?.contact_number}</span>
                                    </p>

                                    <p className="bold">
                                        Department:
                                        <span className="red">{srf?.department}</span>
                                    </p>
                                </>
                            ) : null}

                            <p className="bold">
                                Customer DC: <span className="red">{srf?.customer_dc}</span>
                            </p>

                            <p className="bold">
                                Customer DC Date:
                                <span className="red">{convertDateFormat(srf?.customer_dc_date)}</span>
                            </p>
                        </div>

                        <div className="srf__body__container">

                            <div className="srf__items__container">
                                <Card className="items__table__card" style={{ marginBottom: "1rem" }}>
                                    <SRFItemsListView srfItems={selecteditems} />
                                </Card>
                            </div>

                            <Card style={{ paddingTop: "1rem", paddingLeft: '1rem' }}>

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Returned after calibration"
                                    value={"Returned after calibration"}
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Sent for Repairs & Servicing"
                                    value="Sent for Repairs & Servicing"
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Not For Sale"
                                    value="Not For Sale"
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Sent for Calibration"
                                    value="Sent for Calibration"
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Returnable Material"
                                    value="Returnable Material"
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <Input
                                    className="rainbow-m-around_medium"
                                    type="radio"
                                    name="status"
                                    label="Sent Without Calibration"
                                    value="Sent Without Calibration"
                                    onChange={(e) => {
                                        setDCStatus(e.target.value); setResponseMsg("");
                                    }}
                                />

                                <div className="button_container">
                                    <Button
                                        label="Update Delivery Challan Status"
                                        onClick={sendDCHandler}
                                        variant="success"
                                        className="rainbow-m-around_medium"
                                    />
                                    {responseMsg && <p style={{ color: "red" }}>{responseMsg}</p>}
                                </div>

                            </Card>
                        </div>
                    </div>
                ) : null}

            </Modal>
        </div>
    )
}

export default UpdateBulkDCStatus;

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