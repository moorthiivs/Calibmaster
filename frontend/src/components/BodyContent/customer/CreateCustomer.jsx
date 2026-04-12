import { Card, Spinner, Input, Select, Button } from "react-rainbow-components";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { useNavigate } from 'react-router-dom';
import "./addCustomer.css";
import Loader from '../../UI/Loader';
import CustomerForm from "../Forms/CustomerForm";
import GlobalNotification from '../../../utils/GlobalNotification';

const CreateCustomer = () => {

    const [customerName, setCustomerName] = useState("");
    const [customerCode, setCustomerCode] = useState("");

    const [address1, setAddress1] = useState("");
    const [address2, setaddress2] = useState("");
    const [address3, setAddress3] = useState("");

    const [city, setcity] = useState("");
    const [state, setState] = useState("");
    const [pinCode, setPinCode] = useState("");
    const [country, setCountry] = useState("");
    const [gst_number, setgst_number] = useState("");

    const [contact_title, setContact_title] = useState("");
    const [contact_fullname, setContact_fullname] = useState("");
    const [contact_email, setContact_email] = useState("");
    const [contact_phone_1, setContact_phone_1] = useState("");
    const [contact_phone_2, setContact_phone_2] = useState("");

    // Error States
    const [customerNameErr, setCustomerNameErr] = useState("");
    const [address1Err, setAddress1Err] = useState("");
    const [cityErr, setCityErr] = useState("");
    const [stateErr, setStateErr] = useState("");
    const [pincodeErr, setPincodeErr] = useState("");
    const [gst_number_err, setgst_number_err] = useState("");
    const [contact_fullname_err, setcontact_fullname_err] = useState("");
    const [contact_email_err, setcontact_email_err] = useState("");
    const [contact_phone_1_err, setcontact_phone_1_err] = useState("");

    const [isLoaded, setIsLoaded] = useState(false);

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const options = [
        { value: 'Mr', label: 'Mr' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Shri', label: 'Shri' }
    ];

    // const addCustomerHandler = async () => {

    //     if (customerName == "") {
    //         return setCustomerNameErr("Customer Name is required");
    //     }

    //     if (address1 == "") {
    //         return setAddress1Err("Address Line 1 is required");
    //     }

    //     if (city == "") {
    //         return setCityErr("City is required");
    //     }

    //     if (state == "") {
    //         return setStateErr("State is required");
    //     }

    //     if (pinCode == "") {
    //         return setPincodeErr("Pincode is required");
    //     }

    //     if (gst_number == "") {
    //         return setgst_number_err("gst_number is required");
    //     }

    //     if (contact_fullname == "") {
    //         return setcontact_fullname_err("Contact name is required");
    //     }

    //     if (contact_email == "") {
    //         return setcontact_email_err("Contact email is required");
    //     }

    //     if (contact_phone_1 == "") {
    //         return setcontact_phone_1_err("Contact phone 1 is required");
    //     }
    //     setIsLoaded(true);

    //     const customer_info = {
    //         customer_name: customerName,
    //         customer_code: customerCode,
    //         address1,
    //         address2,
    //         address3,
    //         city, state, country,
    //         pincode: pinCode,
    //         gst_number
    //     };

    //     const customer_contact_info = {
    //         contact_title,
    //         contact_fullname,
    //         contact_email,
    //         contact_phone_1,
    //         contact_phone_2
    //     };

    //     try {

    //         const requestBody = {
    //             customer: customer_info,
    //             customer_contact: customer_contact_info,
    //             labId: auth.labId,
    //         };

    //         const requestOptions = {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: "Bearer " + auth.token,
    //             },
    //             body: JSON.stringify(requestBody),
    //         };

    //         const response = await fetch(config.Calibmaster.URL + "/api/customers/create", requestOptions);
    //         const data = await response.json();
    //         console.log(data);

    //         if (data?.code === 201) {
    //             const newNotification = {
    //                 title: "Customer Created Successfully",
    //                 description: "",
    //                 icon: "success",
    //                 state: true,
    //                 timeout: 15000,
    //             };
    //             dispatch(notificationActions.changenotification(newNotification));
    //             return dispatch(sidebarActions.changesidebar("List-Customer"));
    //         } else if (data?.code === 500) {
    //             const newNotification = {
    //                 title: `${data?.message}`,
    //                 description: "",
    //                 icon: "error",
    //                 state: true,
    //                 timeout: 15000,
    //             };
    //             return dispatch(notificationActions.changenotification(newNotification));
    //         }

    //     } catch (error) {
    //         const newNotification = {
    //             title: "Something went wrong",
    //             description: "",
    //             icon: "error",
    //             state: true,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //     }
    //     setIsLoaded(false);
    // }


    const addCustomerHandler = async (values) => {

        console.log(values, "values");


        setIsLoaded(true);

        const customer_info = {
            customer_name: values.customerName,
            customer_code: values.customerCode,
            address1: values.address1,
            address2: values.address2,
            address3: values.address3 || '',
            city: values.city,
            state: values.state,
            country: values.country,
            pincode: values.pinCode,
            gst_number: values.gst_number,
            contract_days: values.contract_days
        };

        const customer_contact_info = {
            contact_title: values.contact_title,
            contact_fullname: values.contact_fullname,
            contact_email: values.contact_email,
            contact_phone_1: values.contact_phone_1,
            contact_phone_2: values.contact_phone_2 || ''
        };

        try {
            const requestBody = {
                customer: customer_info,
                customer_contact: customer_contact_info,
                labId: auth.labId,
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody),
            };

            const response = await fetch(config.Calibmaster.URL + "/api/customers/create", requestOptions);
            const data = await response.json();

            if (data?.code === 201) {
                GlobalNotification.success({
                    title: 'Customer Created',
                    description: 'The Customer was created successfully.',
                });
                navigate("/dashboard/customers");


            } else {
                GlobalNotification.error({
                    title: 'Submission Failed',
                    description: data?.message || 'Something went wrong!',
                });
            }

        } catch (error) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: error.message || 'Something went wrong!',
            });


            console.log(error);

        }

        setIsLoaded(false);
    };


    return (
        // <div className="masterlist">
        //     <div className="add__masterlist__container">

        //         <Card className="add__user__card">

        //             <div className="add__user__label">
        //                 <h3>Create Customer</h3>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Customer Name"
        //                     placeholder="Customer Name"
        //                     type="text"
        //                     value={customerName}
        //                     onChange={(e) => {
        //                         setCustomerName(e.target.value); setCustomerNameErr("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{customerNameErr}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Customer Code"
        //                     placeholder="Customer Code"
        //                     type="text"
        //                     value={customerCode}
        //                     onChange={(e) => { setCustomerCode(e.target.value) }}
        //                     disabled={false}
        //                     required={false}
        //                 />
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Address Line 1"
        //                     placeholder="Address Line 1"
        //                     type="text"
        //                     value={address1}
        //                     onChange={(e) => {
        //                         setAddress1(e.target.value); setAddress1Err("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{address1Err}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Address Line 2"
        //                     placeholder="Address Line 2"
        //                     type="text"
        //                     value={address2}
        //                     onChange={(e) => { setaddress2(e.target.value) }}
        //                     disabled={false}
        //                     required={false}
        //                 />
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Address Line 3"
        //                     placeholder="Address Line 3"
        //                     type="text"
        //                     value={address3}
        //                     onChange={(e) => { setAddress3(e.target.value) }}
        //                     disabled={false}
        //                     required={false}
        //                 />
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="City"
        //                     placeholder="City"
        //                     type="text"
        //                     value={city}
        //                     onChange={(e) => {
        //                         setcity(e.target.value); setCityErr("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{cityErr}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="State"
        //                     placeholder="State"
        //                     type="text"
        //                     value={state}
        //                     onChange={(e) => {
        //                         setState(e.target.value); setStateErr("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{stateErr}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Pincode"
        //                     placeholder="Pincode"
        //                     type="text"
        //                     value={pinCode}
        //                     onChange={(e) => {
        //                         setPinCode(e.target.value); setPincodeErr("")
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{pincodeErr}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Country"
        //                     placeholder="Country"
        //                     type="text"
        //                     value={country}
        //                     onChange={(e) => {
        //                         setCountry(e.target.value);
        //                     }}
        //                     disabled={false}
        //                     required={false}
        //                 />
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="GST Number"
        //                     placeholder="GST Number"
        //                     type="text"
        //                     value={gst_number}
        //                     onChange={(e) => {
        //                         setgst_number(e.target.value); setgst_number_err("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{gst_number_err}</span>
        //             </div>


        //             <div className="contact_name_area">
        //                 <div className="input_container">
        //                     <p>Contact Name: </p>
        //                     <Select
        //                         label="Select title"
        //                         options={options}
        //                         required={true}
        //                         className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto select_title"
        //                         onChange={(e) => {
        //                             setContact_title(e.target.value); setcontact_fullname_err("");
        //                         }}
        //                     />
        //                     <Input
        //                         label="Enter name"
        //                         placeholder="Enter name"
        //                         type="text"
        //                         value={contact_fullname}
        //                         onChange={(e) => {
        //                             setContact_fullname(e.target.value)
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                 </div>

        //                 <span className="red">{contact_fullname_err}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Contact Email"
        //                     placeholder="Contact Email"
        //                     type="text"
        //                     value={contact_email}
        //                     onChange={(e) => {
        //                         setContact_email(e.target.value); setcontact_email_err("")
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{contact_email_err}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Contact Phone 1"
        //                     placeholder="Contact Phone 1"
        //                     type="number"
        //                     value={contact_phone_1}
        //                     onChange={(e) => {
        //                         setContact_phone_1(e.target.value); setcontact_phone_1_err("");
        //                     }}
        //                     disabled={false}
        //                     required={true}
        //                 />
        //                 <span className="red">{contact_phone_1_err}</span>
        //             </div>

        //             <div className="add_user_item">
        //                 <Input
        //                     label="Contact Phone 2"
        //                     placeholder="Contact Phone 2"
        //                     type="number"
        //                     value={contact_phone_2}
        //                     onChange={(e) => { setContact_phone_2(e.target.value) }}
        //                     disabled={false}
        //                     required={false}
        //                 />
        //             </div>

        //             <div className="add__user__item">
        //                 <Button
        //                     label={"Create Customer"}
        //                     onClick={addCustomerHandler}
        //                     variant="success"
        //                     className="rainbow-m-around_medium"
        //                 />
        //             </div>
        //             {isLoaded && <Loader />}
        //         </Card>

        //     </div>
        // </div>


        <CustomerForm
            mode="create"
            onSubmit={addCustomerHandler}
            isLoading={isLoaded}
            titleOptions={options}
        />


    )
}

export default CreateCustomer;
