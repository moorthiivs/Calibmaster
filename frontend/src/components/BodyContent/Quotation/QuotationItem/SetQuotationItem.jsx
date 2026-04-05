import "./QuotationItem.css";
import { Card, Spinner, Input, CheckboxToggle, Button } from "react-rainbow-components";
import { useState, useEffect, useContext } from "react";
import CustomInput from "../../../Inputs/CustomInput";
import CustomButton from "../../../Inputs/CustomButton";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.json";
import QuotationTableItemInput from "./QuotationTableItemInput";
import Loader from "../../../UI/Loader";


const SetQuotationItem = (props) => {
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(true);
  const auth = useContext(AuthContext);
  const [otherCharges, setotherCharges] = useState(0);
  const [notes, setNotes] = useState(["", ""]);
  const [customerDetail, setCustomerDetail] = useState({});
  const [customer_item_description, setcustomer_item_description] = useState([]);
  const dispatch = useDispatch();
  useEffect(() => {
    setCustomerDetail(props)
  }, [props]);

  function fetchData(Data) {
    setcustomer_item_description(Data);
  }
  async function handleSubmit() {
    try {
      if (customerDetail.customerDetail.customer_name === "") {
        setError("Please Enter Customer Name"); return;
      }
      if (customerDetail.customerDetail.company_name === "") {
        setError("Please Enter Company Name"); return;
      }
      if (customerDetail.customerDetail.address1 === "") {
        setError("Please Enter Address Line 1"); return;
      }
      if (customerDetail.customerDetail.address2 === "") {
        setError("Please Enter Address Line 2"); return;
      }
      if (customerDetail.customerDetail.city === "") {
        setError("Please Enter City"); return;
      }
      if (customerDetail.customerDetail.pincode === "") {
        setError("Please Enter Pincode"); return;
      }
      if (customerDetail.customerDetail.state === "") {
        setError("Please Enter State"); return;
      }
      if (customerDetail.customerDetail.contactNumber === "") {
        setError("Please Enter Contact Number"); return;
      }
      if (customerDetail.customerDetail.email === "") {
        setError("Please Enter E-mail"); return;
      }
      if (otherCharges === "") {
        setError("Please Enter Other charges"); return;
      }
      if (customer_item_description.length === 0) {
        setError("Please Add Items"); return;
      }
      if (!customerDetail) {
        setError("Please Enter Customer Details"); return;
      }
      setIsLoaded(false);

      const body = {
        lab_id: auth.labId,
        customer_Detail: customerDetail.customerDetail,
        customer_item_description: customer_item_description,
        otherCharges: otherCharges,
        notes
      }
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(body),
      };

      let response = await fetch(config.Calibmaster.URL + "/api/quotation/create-quotation", requestOptions);
      response = await response.json();
      if (response?.success) {
        setError("");
        const newNotification = {
          title: response?.msg,
          description: "",
          icon: "success",
          state: true,
          timeout: 15000,
        };
        dispatch(notificationActions.changenotification(newNotification));
        setIsLoaded(true);
      }
      if (response.status === "FAILURE") {
        const errornotification = {
          title: response.message,
          description: "",
          icon: "error",
          state: true,
          timeout: 15000,
        };
        dispatch(notificationActions.changenotification(errornotification));

        setIsLoaded(true);
      }
    } catch (error) {
      console.log(error)
      const errornotification = {
        title: "Something went wrong !!",
        description: "",
        icon: "error",
        state: true,
        timeout: 15000,
      };
      dispatch(notificationActions.changenotification(errornotification));
    }
  }

  // *** Add Notes ***
  const addNotesHandler = () => {
    const newNotes = [...notes, ""];
    setNotes(newNotes);
  }

  // *** Add Notes Value ***
  const notesChangeHandler = (value, i) => {
    const inputData = [...notes];
    inputData[i] = value.target.value;
    setNotes(inputData);
  }

  // *** Delete Notes ***
  const deleteNotesHandler = (i) => {
    const deleteValue = [...notes];
    deleteValue.splice(i, 1);
    setNotes(deleteValue);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }} className="quotation__page">
      <Card className="quotation__page__card">
        <div className="quotation__page__label">
          <h3 className="text-lg font-bold my-5 text-center">Add Item </h3>
        </div>
        <div className="quotation__page__form" style={{ display: "flex", flexDirection: "column" }}>
          <QuotationTableItemInput fetchData={fetchData} />
          <div><br></br></div>
          <div className="quotation__page__item" >
            <Input
              placeholder="Other Charges"
              label="Other Charges"
              type="number"
              name="otherCharges"
              value={otherCharges}
              onChange={(event) => setotherCharges(event.target.value)}
              disabled={false}
              required
            />
          </div>


          {/* Notes Card */}
          <h3 className='title'>Add Notes</h3>

          <section className='remarks_section'>
            <Button
              label="Add Notes"
              onClick={() => addNotesHandler()}
              variant="success"
              className="rainbow-m-around_medium"
              style={{ margin: '0 0 10px 0' }}
            />

            {
              notes.map((data, i) => {
                return (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <Input
                      placeholder="Enter Notes"
                      style={{ width: "30rem" }}
                      value={data}
                      onChange={(e) => notesChangeHandler(e, i)}
                    />
                    <Button
                      label="Delete"
                      variant="destructive"
                      onClick={() => deleteNotesHandler(i)}
                    />
                  </div>
                )
              })
            }
          </section>

          {!isLoaded ? <Loader /> : null}
          <br></br>
          <div style={{ width: "100%" }}>
            {error && <p className="red center w100" style={{ margin: 0 }}>{error}</p>}
          </div>
          <div className="quotation__page__btn">
            <CustomButton
              label="Generate Quotation"
              variant="success"
              onclick={handleSubmit}
            />
          </div>
        </div>
      </Card >
    </div >

  )
}

export default SetQuotationItem