import "./QuotationItem.css";
import { Card, Spinner, Input, CheckboxToggle, Button } from "react-rainbow-components";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.json";
import { companiesActions } from "../../../../store/companies";
import SetQuotationItem from "./SetQuotationItem";
import CompanyLookUpQuotation from "./CompanyLookUpQuotation";

const QuotationItem = () => {

  const [error, setError] = useState("");
  const [customerDetail, setCustomerDetail] = useState({
    customer_name: "",
    company_name: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    email: ""
  });
  const companies = useSelector((state) => state.companies.list);
  const [toggleCustomerButton, setToggleCustomerButton] = useState(true);
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();

  const fetchCustomers = () => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ labId: auth.labId }),
    };

    fetch(config.Calibmaster.URL + "/api/customers/list", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        dispatch(companiesActions.changecompanies(data.data));
      })
      .catch((err) => {
        const errornotification = {
          title: "Error while getting Companies!!",
          description: "Getting list of companies from server failed!!",
          icon: "error",
          state: true,
          timeout: 15000,
        };
        dispatch(notificationActions.changenotification(errornotification));

        setError("Error While Getting Companies");
      });
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  function handleChange(event) {
    setCustomerDetail((prev) => {
      return { ...prev, [event.target.name]: event.target.value }
    })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }} className="quotation__page">
      <Card className="quotation__page__card" style={{ padding: '0 0 10px 0' }}>
        <div className="quotation__page__label">
          <h3 className='text-lg font-bold my-5 text-center'>Create Quotation</h3>
        </div>
        <div className="quotation__page__form">
          {toggleCustomerButton ? <div className="quotation__page__item" style={{ display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center", alignItems: "center" }}>
            <CompanyLookUpQuotation
              options={companies}
              onselect={(e) => {
                if (e == null || e == undefined) {
                  setCustomerDetail(
                    {
                      customer_name: "",
                      company_name: "",
                      address1: "",
                      address2: "",
                      address3: "",
                      city: "",
                      state: "",
                      pincode: "",
                      contactNumber: "",
                      email: ""
                    }
                  )
                  return;
                }
                setCustomerDetail((prev) => {
                  return {
                    company_name: e.customer_name,
                    customer_name: e.customer_contact.contact_fullname,
                    address1: e.address1,
                    address2: e.address2,
                    address3: e.address3,
                    city: e.city,
                    state: e.state,
                    pincode: e.pincode,
                    contactNumber: e.customer_contact.contact_phone_1,
                    email: e.customer_contact.contact_email
                  }
                })
              }}
              label={"Existing Customer"}
              required={true}
            />
            <Button
              style={{ width: "fit-content" }}
              label="New Customer"
              variant="success"
              onClick={() => setToggleCustomerButton((toggleCustomerButton) => !toggleCustomerButton)}
            /></div>
            :
            <div className="quotation__page__item">
              <Input
                placeholder="Customer Name"
                label="Customer Name"
                type="text"
                name="company_name"
                value={customerDetail?.company_name}
                onChange={handleChange}
                disabled={false}
                required={true}
                style={{ marginBottom: "5px" }}
              />
              <Button
                label="Existing Customer"
                variant="success"
                onClick={() => setToggleCustomerButton((toggleCustomerButton) => !toggleCustomerButton)}
              />
            </div>
          }
          <div className="quotation__page__item">
            <Input
              placeholder="Contact Name"
              label="Contact Name"
              type="text"
              name="customer_name"
              value={customerDetail?.customer_name}
              onChange={handleChange}
              disabled={false}
              required
            />
          </div>
          <div className="quotation__page__item">
            <Input
              placeholder="Address Line 1"
              label="Address Line 1"
              type="text"
              name="address1"
              value={customerDetail?.address1}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>
          <div className="quotation__page__item">
            <Input
              placeholder="Address Line 2"
              label="Address Line 2"
              type="text"
              name="address2"
              value={customerDetail?.address2}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>
          <div className="quotation__page__item">
            <Input
              name="address3"
              placeholder="Address Line 3"
              label="Address Line 3"
              type="text"
              value={customerDetail?.address3}
              onChange={handleChange}
              disabled={false}
            />
          </div>
          <div className="quotation__page__item">
            <Input
              placeholder="City"
              name="city"
              label="City"
              type="text"
              value={customerDetail?.city}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>
          <div className="quotation__page__item">
            <Input
              placeholder="Pincode"
              label="Pincode"
              type="text"
              name="pincode"
              value={customerDetail?.pincode}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>

          <div className="quotation__page__item">
            <Input
              placeholder="State"
              label="State"
              type="text"
              name="state"
              value={customerDetail?.state}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>

          <div className="quotation__page__item">
            <Input
              placeholder="Contact Phone"
              label="Contact Phone"
              type="text"
              name="contactNumber"
              value={customerDetail?.contactNumber}
              min={10}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>
          <div className="quotation__page__item">
            <Input
              placeholder="Contact Email"
              label="Contact Email"
              type="email"
              name="email"
              value={customerDetail?.email}
              onChange={handleChange}
              disabled={false}
              required={true}
            />
          </div>
        </div>
      </Card>
      <SetQuotationItem customerDetail={customerDetail} />
      <p className="red center w_100">{error}</p>

    </div>

  )
}

export default QuotationItem