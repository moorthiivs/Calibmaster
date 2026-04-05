import { useContext, useEffect, useState } from "react";
import {
  Card,
  TableWithBrowserPagination,
  Column,
  Button,
} from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import "./SRFItemsListView.css";
import CustomInput from "../../Inputs/CustomInput";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
import CustomSelect from "../../Inputs/CustomSelect";

import StatusBadge from "../../UI/StatusBadge";
import { updatedcSchema } from "../../../Schemas/updatedc";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { notificationActions } from "../../../store/nofitication";
import { srfitemsActions } from "../../../store/srfitems";
import { updaterepSchema } from "../../../Schemas/updaterep";
const dispatchmodes = [
  {
    label: "Post",
    value: "post",
  },
  {
    label: "Courier",
    value: "courier",
  },
];
const SRFItemsListView = (props) => {
  const items = useSelector((state) => state.selecteditems.list);
  const [dispatchDC, setDispatchDC] = useState();
  const [dispatchDate, setDispatchDate] = useState(new Date());
  const [dispatchMode, setDispatchMode] = useState(dispatchmodes[0].value);
  const [invoiceNo, setInvoiceNo] = useState();
  const [calreminderDate, setCalReminderDate] = useState();
  const [error, setError] = useState();
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(true);
  const auth = useContext(AuthContext);

  useEffect(() => {
    setError();
  }, [dispatchDC, dispatchDate, dispatchMode, calreminderDate]);

  const updatedispatchHandler = async (n) => {
    let newdcinfo;
    if (n == 0) {
      newdcinfo = {
        dispatch_dc: dispatchDC,
        dispatch_date: dispatchDate,
        dispatch_mode: dispatchMode,
        calibration_reminder_date: calreminderDate,
        status: "Dispatched",
      };
    }
    if (n == 1) {
      newdcinfo = {
        report_dispatch_date: dispatchDate,
        report_dispatch_mode: dispatchMode,
        status: "Report Dispatched",
      };
    }
    let isValid;
    if (n == 0) {
      isValid = await updatedcSchema.isValid(newdcinfo);
    }
    if (n == 1) {
      isValid = await updaterepSchema.isValid(newdcinfo);
    }

    if (!isValid) {
      setError("Dispatch info Validation Failed!!");
      return;
    }
    //REST call
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({
        items: items,
        dcinfo: newdcinfo,
        srfId: props.srfId,
        mode: n + 1,
      }),
    };
    const errornotification = {
      title: "Error while Updating Dispatch Information!!",
      description: props.srfId,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/srf/updatedcinfo", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            //console.log(data);
            const newnotification = {
              title: "Dispatch Information updated successfully!!",
              description: props.srfId,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            setIsLoaded(true);
            dispatch(notificationActions.changenotification(newnotification));
            dispatch(srfitemsActions.changesrfitems(data.data.items));
            props.onclose();
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError(data.message);
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Updating Dispatch Information!!!");
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
        setError("Error while Updating Dispatch Information!!");
      });
  };

  const updateinvoiceHandler = async () => {
    //REST call
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({
        items: items,
        invoiceinfo: {
          invoice_no: invoiceNo,
          status: "Invoice Generated",
        },
        srfId: props.srfId,
      }),
    };
    const errornotification = {
      title: "Error while Updating Invoice Information!!",
      description: props.srfId,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/srf/updateinvoice", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            //console.log(data);
            const newnotification = {
              title: "Invoice Information updated successfully!!",
              description: props.srfId,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            setIsLoaded(true);
            dispatch(notificationActions.changenotification(newnotification));
            dispatch(srfitemsActions.changesrfitems(data.data.items));
            props.onclose();
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError(data.message);
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Updating Invoice Information!!!");
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
        setError("Error while Updating Invoice Information!!");
      });
  };

  const updatepaymentHandler = async () => {
    //REST call
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({
        items: items,
        srfId: props.srfId,
        paymentinfo: {
          status: "Payment Done",
        },
      }),
    };
    const errornotification = {
      title: "Error while Updating Payment Information!!",
      description: props.srfId,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/srf/updatepayment", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            //console.log(data);
            const newnotification = {
              title: "Payment Information updated successfully!!",
              description: props.srfId,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            setIsLoaded(true);
            dispatch(notificationActions.changenotification(newnotification));
            dispatch(srfitemsActions.changesrfitems(data.data.items));
            props.onclose();
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError(data.message);
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Updating Payment Information!!!");
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
        setError("Error while Updating Payment Information!!");
      });
  };

  return (
    <div className="srf__items__container">
      <Card className="items__table__card">
        <div className="items__label">
          <h2>SRF Items</h2>
        </div>

        <TableWithBrowserPagination
          className="srf__items__table"
          pageSize={5}
          data={items}
          keyField="sno"
          showCheckboxColumn={false}
        >
          <Column header="S.No" field="sno" />
          <Column header="Description of Item" field="description" />
          <Column header="Make" field="make" />
          <Column header="Model" field="model" />
          <Column header="RangeMin" field="range_min" />
          <Column header="RangeMax" field="range_max" />
          <Column header="Unit" field="range_unit" />
          <Column header="Serial Number" field="serialno" />
          <Column header="Id Number" field="idno" />
          <Column header="Status" field="status" component={StatusBadge} />
          <Column header="Remarks" field="remarks" />
        </TableWithBrowserPagination>
      </Card>
      <Card className="items__table__card mtop1">
        {props.mode === "updatedc" ? (
          <div className="dc__info__container">
            <div className="add__srf__item__container">
              <CustomInput
                label="Dispatch DC No"
                value={dispatchDC}
                type="text"
                required={true}
                onchange={(v) => setDispatchDC(v)}
              />
            </div>
            <div className="add__srf__item__container">
              <CustomDatePicker
                label={"Dispatch DC Date"}
                setDate={(v) => setDispatchDate(v)}
                date={dispatchDate}
                required={true}
              />
            </div>
            <div className="add__srf__item__container">
              <CustomSelect
                options={dispatchmodes}
                onselect={(v) => setDispatchMode(v)}
                label={"Dispatch Mode"}
                required={true}
                value={dispatchMode}
              />
            </div>
            <div className="add__srf__item__container">
              <CustomDatePicker
                label={"Calibration Reminder Date"}
                setDate={(v) => setCalReminderDate(v)}
                date={calreminderDate}
                required={false}
              />
            </div>
          </div>
        ) : null}
        {props.mode === "updatereport" ? (
          <div className="dc__info__container">
            <div className="add__srf__item__container">
              <CustomSelect
                options={dispatchmodes}
                onselect={(v) => setDispatchMode(v)}
                label={"Report Dispatch Mode"}
                required={true}
                value={dispatchMode}
              />
            </div>

            <div className="add__srf__item__container">
              <CustomDatePicker
                label={"Report Dispatch Date"}
                setDate={(v) => setDispatchDate(v)}
                date={dispatchDate}
                required={true}
              />
            </div>
          </div>
        ) : null}
        {props.mode === "updateinvoice" ? (
          <div className="dc__info__container">
            <div className="add__srf__item__container">
              <CustomInput
                label="Invoice No."
                value={invoiceNo}
                type="text"
                required={true}
                onchange={(v) => setInvoiceNo(v)}
              />
            </div>
          </div>
        ) : null}
      </Card>
      {error ? <p className="red center w100">{error}</p> : null}
      {props.mode === "updatedc" &&
        (auth.department == "admin" || auth.department == "CSD") ? (
        <Button
          label="Update Dispatch Details"
          variant="brand"
          onClick={() => updatedispatchHandler(0)}
          className="mar051"
        />
      ) : null}
      {props.mode === "updatereport" &&
        (auth.department == "admin" || auth.department == "CSD") ? (
        <Button
          label="Update Report Details"
          variant="neutral"
          onClick={() => updatedispatchHandler(1)}
          className="mar051"
        />
      ) : null}
      {props.mode === "updateinvoice" &&
        (auth.department == "admin" || auth.department == "Accounts") ? (
        <Button
          label="Update Invoice Detail"
          variant="brand"
          onClick={() => updateinvoiceHandler()}
          className="mar051"
        />
      ) : null}
      {props.mode === "updatepayment" &&
        (auth.department == "admin" || auth.department == "Accounts") ? (
        <Button
          label="Mark as Paid"
          variant="success"
          onClick={() => updatepaymentHandler()}
          className="mar051"
        />
      ) : null}
    </div>
  );
};

export default SRFItemsListView;
