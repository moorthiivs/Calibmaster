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
import "./UpdateInvoice.css";
import { formattedDate } from "../../helpers/Helper";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";

const UpdateCalibrationStatus = (props) => {

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const selecteditems = useSelector((state) => state.selecteditems.list);

    const [error, setError] = useState();
    const [isLoaded, setIsLoaded] = useState(true);
    const [srf, setSRF] = useState([]);
    const [srfItems, setSrfItems] = useState([]);

    const [title, setTitle] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState("");

    const [calibrationDate, setCalibrationDate] = useState("");
    const [calibrationDateErr, setCalibrationDateErr] = useState("");

    const [reportGenerateDate, setReportGenerateDate] = useState("");
    const [reportGenerateDateErr, setReportGenerateDateErr] = useState("");

    const [servicingDate, setServicingDate] = useState("");
    const [servicingDateErr, setServicingDateErr] = useState("");

    const [sentWithoutCalibration, setsentWithoutCalibration] = useState("");
    const [sentWithoutCalibrationErr, setsentWithoutCalibrationErr] = useState("");


    useEffect(() => {
        if (props?.srfid) {
            getSRFDetail();
        }
    }, [props?.srfid]);

    // *** Get srf-items by srf-id and save redux store ***
    const getSRFDetail = async () => {

        if (props?.srfid) {
            setIsLoaded(false);

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ srfId: props?.srfid, srfNo: props?.srfNo }),
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

    // TODO: Update Bulk Servicing Handler
    const updateBulkServicingHandler = async () => {

        if (servicingDate == "") {
            setServicingDateErr("Please set the servicing date");
            return;
        }

        try {
            setIsLoading(true);

            const requestBody = {
                labId: auth?.labId,
                items: selecteditems,
                srfId: props?.srfid,
                servicing_done_date: servicingDate
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

            let response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-service-done-date", requestOptions);
            response = await response.json();
            console.log(response);

            if (response?.code === 201) {

                // *** Remove the selected srf-items from redux store ***
                dispatch(selecteditemsActions.changeselecteditems([]));
                // *** Get srf-items by srf-id and save redux store ***
                await getSRFDetail();
                // *** Get all srf-items belongs to current lab and save redux store ***
                await fetchSRFItems();
                // *** Close this modal ***
                props.onclose();

                setIsLoading(false);
            } else {
                setIsLoading(false);
                const errornotification = {
                    title: "Error While Updating SRF Item!!",
                    description: "-",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(errornotification));
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            const errornotification = {
                title: "Error while Updating SRF Item!!",
                description: "-",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    };

    // TODO: Update Handler For Sent Without Calibration
    const updateBulkSentWithoutCalibrationHandler = async () => {

        try {

            if (sentWithoutCalibration == "") {
                setsentWithoutCalibrationErr("Please set the date");
                return;
            }

            setIsLoading(true);

            const requestBody = {
                labId: auth?.labId,
                items: selecteditems,
                srfId: props?.srfid,
                sent_without_calibration_date: sentWithoutCalibration
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

            let response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-sent-without-calibration-date", requestOptions);
            response = await response.json();
            console.log(response);

            if (response?.code === 201) {

                // *** Remove the selected srf-items from redux store ***
                dispatch(selecteditemsActions.changeselecteditems([]));
                // *** Get srf-items by srf-id and save redux store ***
                await getSRFDetail();
                // *** Get all srf-items belongs to current lab and save redux store ***
                await fetchSRFItems();
                // *** Close this modal ***
                props.onclose();

                setIsLoading(false);
            } else {
                setIsLoading(false);
                const errornotification = {
                    title: "Error While Updating SRF Item!!",
                    description: "-",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(errornotification));
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            const errornotification = {
                title: "Error while Updating SRF Item!!",
                description: "-",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    };

    // Update Handler For 1. Calibrate, 2. Calibrate + Report Generate
    const updateBulkCalbrationHandler = async (mode) => {

        try {

            if (mode == 1) {
                if (calibrationDate == "") {
                    setCalibrationDateErr("Please set the calibration date");
                    return;
                }
            }

            if (mode == 2) {
                if (calibrationDate == "") {
                    setCalibrationDateErr("Please set the calibration date");
                    return;
                }

                if (reportGenerateDate == "") {
                    setReportGenerateDateErr("Please set the report generated date");
                    return;
                }
            }

            setIsLoading(true);

            const requestBody = {
                lab_id: auth?.labId,
                mode: mode,
                items: selecteditems,
                srf_id: props?.srfid,
                calibration_done_by_empname: auth.name,
                calibrationDoneDate: calibrationDate,
                report_done_date: reportGenerateDate
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

            if (mode == 1) {
                if (props.srf.srf_type === 'N') return
                let res = await fetch(config.Calibmaster.URL + "/api/ulr-no-generation/update-ulr-number", requestOptions);
                res = await res.json();
                console.log(res);
            }

            let response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-calibration-status", requestOptions);
            response = await response.json();
            console.log(response);

            if (response?.code === 201) {

                // *** Remove the selected srf-items from redux store ***
                dispatch(selecteditemsActions.changeselecteditems([]));
                // *** Get srf-items by srf-id and save redux store ***
                await getSRFDetail();
                // *** Get all srf-items belongs to current lab and save redux store ***
                await fetchSRFItems();
                // *** Close this modal ***
                props.onclose();

                setIsLoading(false);
            } else {
                setIsLoading(false);
                const errornotification = {
                    title: "Error while Updating SRF Item!!",
                    description: "Updating SRF Item Failed!!",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(errornotification));
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            const errornotification = {
                title: "Error while Updating SRF Item!!",
                description: "-",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    };

    // Update Handler For Report Generate
    const updateBulkReportHandler = async () => {

        try {

            if (reportGenerateDate == "") {
                setReportGenerateDateErr("Please set the report generated date");
                return;
            }

            setIsLoading(true);

            const requestBody = {
                lab_id: auth?.labId,
                items: selecteditems,
                srf_id: props?.srfid,
                report_done_by_empname: auth.name,
                report_done_date: reportGenerateDate
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

            let response = await fetch(config.Calibmaster.URL + "/api/bulk-update/update-bulk-report-generation-status", requestOptions);
            response = await response.json();
            console.log(response);

            if (response?.code === 201) {

                // *** Remove the selected srf-items from redux store ***
                dispatch(selecteditemsActions.changeselecteditems([]));
                // *** Get srf-items by srf-id and save redux store ***
                await getSRFDetail();
                // *** Get all srf-items belongs to current lab and save redux store ***
                await fetchSRFItems();
                // *** Close this modal ***
                props.onclose();

                setIsLoading(false);
            } else {
                setIsLoading(false);
                const errornotification = {
                    title: "Error while Updating SRF Item!!",
                    description: "Updating SRF Item Failed!!",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(errornotification));
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            const errornotification = {
                title: "Error while Updating SRF Item!!",
                description: "-",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    };

    if (!isLoaded)
        return <Loader />;

    return (
        <div className="view__srf__modal__container">
            <Modal
                id="view__srf"
                isOpen={props.isopen}
                onRequestClose={props.onclose}
                title={"Update Status"}
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
                                Company Name: <span className="black normal">{srf?.customer?.customer_name}</span>
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

                                <Card className="items__table__card" style={{ marginBottom: "1rem" }}>
                                    <SRFItemsListView srfItems={selecteditems} />
                                </Card>

                                <Card className="update__cal__card" style={{ width: '100%' }}>

                                    {/* Servicing Done Date */}
                                    <div className="update__cal__item" style={{ textAlign: "center", display: "none" }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <DatePicker
                                                value={servicingDate}
                                                onChange={value => {
                                                    setServicingDate(formattedDate(value));
                                                    setServicingDateErr("");
                                                }}
                                                label="Servicing Done Date"
                                                locale="en-IN"
                                            />
                                            <span style={{ color: "red" }}>{servicingDateErr}</span>
                                        </div>
                                        <Button
                                            label="Mark as Servicing"
                                            onClick={() => updateBulkServicingHandler()}
                                            variant="outline-brand"
                                            className="rainbow-m-around_medium"
                                        />
                                    </div>

                                    {/* Sent Without Calibration */}
                                    <div className="update__cal__item" style={{ textAlign: "center", display: "none" }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <DatePicker
                                                value={sentWithoutCalibration}
                                                onChange={value => {
                                                    setsentWithoutCalibration(formattedDate(value));
                                                    setsentWithoutCalibrationErr("");
                                                }}
                                                label="Sent Without Calibration"
                                                locale="en-IN"
                                            />
                                            <span style={{ color: "red" }}>{sentWithoutCalibrationErr}</span>
                                        </div>
                                        <Button
                                            label="Sent Without Calibration"
                                            onClick={() => updateBulkSentWithoutCalibrationHandler()}
                                            variant="destructive"
                                            className="rainbow-m-around_medium"
                                        />
                                    </div>

                                    {/* Calibrate Done Date */}
                                    <div className="update__cal__item" style={{ textAlign: "center" }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <DatePicker
                                                value={calibrationDate}
                                                onChange={value => {
                                                    // console.log(value)
                                                    setCalibrationDate(formattedDate(value));
                                                    setCalibrationDateErr("");
                                                }}
                                                label="Calibrate Done Date"
                                                locale="en-IN"
                                            />
                                            <span style={{ color: "red" }}>{calibrationDateErr}</span>
                                        </div>
                                        <Button
                                            label="Mark as Calibrated"
                                            onClick={() => updateBulkCalbrationHandler(1)}
                                            variant="success"
                                            className="rainbow-m-around_medium"
                                        />
                                    </div>

                                    {/* Mark as Report Generated */}
                                    <div className="update__cal__item" style={{ textAlign: "center" }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <DatePicker
                                                value={reportGenerateDate}
                                                onChange={value => {
                                                    setReportGenerateDate(formattedDate(value));
                                                    setReportGenerateDateErr("");
                                                }}
                                                label="Report Generated Date"
                                                locale="en-IN"
                                            />
                                            <span style={{ color: "red" }}>{reportGenerateDateErr}</span>
                                        </div>
                                        <Button
                                            label="Mark as Report Generated"
                                            onClick={() => updateBulkReportHandler()}
                                            variant="neutral"
                                            className="rainbow-m-around_medium"
                                        />
                                    </div>

                                    {/* Mark as Calibrated & Report Generated */}
                                    <div className="update__cal__item w400" style={{ textAlign: "center" }}>
                                        <Button
                                            label="Mark as Calibrated & Report Generated"
                                            onClick={() => updateBulkCalbrationHandler(2)}
                                            variant="brand"
                                            className="rainbow-m-around_medium"
                                        />
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    )
}

export default UpdateCalibrationStatus;

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