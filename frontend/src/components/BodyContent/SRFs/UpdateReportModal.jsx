import "./UpdateInvoice.css";
import { Modal, Spinner, Button, Card, TableWithBrowserPagination, Column, Input, DatePicker, Select } from "react-rainbow-components";
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

const UpdateReportModal = (props) => {

    const [error, setError] = useState();
    const [isLoaded, setIsLoaded] = useState(true);
    const [srf, setSRF] = useState([]);
    const [srfItems, setSrfItems] = useState([]);

    const [title, setTitle] = useState("");

    const [reportDcDate, setReportDcDate] = useState("");
    const [reportDcMode, setReportDcMode] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState("");

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
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
        setTitle("Update Report Dispatch Information");
    }, [props]);

    const updateinvoiceHandler = async () => {

        if (!reportDcDate || !reportDcMode) {
            alert("Please enter all required fields")
        }

        try {
            setIsLoading(true);

            const bodyData = {
                items: selecteditems,
                reportDispatchInfo: {
                    report_dispatch_date: reportDcDate,
                    report_dispatch_mode: reportDcMode,
                    status: "Report Dispatched",
                    labId: auth.labId
                },
                srfId: srf.srf_id,
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };

            let response = await fetch(config.Calibmaster.URL + "/api/srf-status/report-dispatch", requestOptions);
            response = await response.json();
            console.log(response);

            if (response?.code === 201) {

                setResponseMsg(response?.message);
                setIsLoading(false);
                // dispatch(filtereditemsActions.changeitems(response.items));

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
                                    <div className="dc__info__container flex justify-center my-5 mx-10 gap-10">

                                        <div className="add__srf__item__containers w-full" >
                                            <DatePicker
                                                formatStyle="large"
                                                label="Report Dispatch Date"
                                                value={reportDcDate}
                                                required={true}
                                                onChange={value => setReportDcDate(formattedDate(value))}
                                                okLabel={"OK"}
                                                cancelLabel={"Cancel"}
                                            />
                                        </div>

                                        <div className="add__srf__item__containers w-full" >
                                            <Select
                                                label="Report Dispatch Mode"
                                                options={[
                                                    { value: '', label: 'Select' },
                                                    { value: 'Post', label: 'Post' },
                                                    { value: 'Courier', label: 'Courier' }
                                                ]}
                                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                                onChange={(e) => setReportDcMode(e.target.value)}
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
    )
}

export default UpdateReportModal;

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

                <Column header="S.No" field="srf_item_id" component={({ index }) => index + 1} cellAlignment={"center"} />
                <Column header="Description of Item" field="intrument_type" component={findIntrumentTypeName} cellAlignment={"center"} />
                <Column header="Make" field="make" cellAlignment={"center"} />
                <Column header="Model" field="model" cellAlignment={"center"} />
                <Column header="Serial Number" field="serial_no" cellAlignment={"center"} />
                <Column header="Id Number" field="identification_details" cellAlignment={"center"} />
                <Column header="Status" field="status" component={StatusBadge} cellAlignment={"center"} />
                <Column header="Remarks" field="remarks" cellAlignment={"center"} />

            </TableWithBrowserPagination>
        </>
    );
}
