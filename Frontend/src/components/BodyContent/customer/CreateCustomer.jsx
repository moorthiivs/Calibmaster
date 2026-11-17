import { Card, Spinner, Input, Select, Button } from "react-rainbow-components";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
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
    const navigate = useNavigate();

    const options = [
        { value: 'Mr', label: 'Mr' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Shri', label: 'Shri' }
    ];



    const addCustomerHandler = async (values) => {



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


        <CustomerForm
            mode="create"
            onSubmit={addCustomerHandler}
            isLoading={isLoaded}
            titleOptions={options}
        />


    )
}

export default CreateCustomer;