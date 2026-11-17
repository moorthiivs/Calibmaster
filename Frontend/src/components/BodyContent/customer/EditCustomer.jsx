import { Card, Spinner, Input, Select, Button } from "react-rainbow-components";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { useNavigate } from 'react-router-dom';
import "./addCustomer.css";
import Loader from "../../UI/Loader";
import CustomerForm from "../Forms/CustomerForm";
import GlobalNotification from "../../../utils/GlobalNotification";
import { useSelector } from "react-redux";

const EditCustomer = () => {

    const [customerId, setcustomerId] = useState("");
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
    const [loading, setloading] = useState(false);
    const [initialData, setInitialData] = useState(null);

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

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const options = [
        { value: 'Mr', label: 'Mr' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Shri', label: 'Shri' }
    ];

    const customerMainid = useSelector((state) => state.customerId.current);

    const fetchCustomerById = async () => {
        try {
            setloading(true);

            const response = await fetch(config.Calibmaster.URL + "/api/customers/fetch-customer/" + customerId, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            const { result } = await response.json();
            // console.log(result);

            setcustomerId(result?.customer_id);
            setCustomerName(result?.customer_name);
            setCustomerCode(result?.customer_code);

            setAddress1(result?.address1);
            setaddress2(result?.address2);
            setAddress3(result?.address3);

            setcity(result?.city);
            setState(result?.state);
            setPinCode(result?.pincode);
            setCountry(result?.country);
            setgst_number(result?.gst_number);

            setContact_title(result.customer_contact.contact_title);
            setContact_fullname(result.customer_contact.contact_fullname);
            setContact_email(result.customer_contact.contact_email);
            setContact_phone_1(result.customer_contact.contact_phone_1);
            setContact_phone_2(result.customer_contact.contact_phone_2);


            const formatted = {
                customerName: result?.customer_name,
                customerCode: result?.customer_code,
                address1: result?.address1,
                address2: result?.address2,
                address3: result?.address3,
                city: result?.city,
                state: result?.state,
                pinCode: result?.pincode,
                country: result?.country,
                gst_number: result?.gst_number,
                contract_days: result?.contract_days,
                contact_title: result?.customer_contact?.contact_title,
                contact_fullname: result?.customer_contact?.contact_fullname,
                contact_email: result?.customer_contact?.contact_email,
                contact_phone_1: result?.customer_contact?.contact_phone_1,
                contact_phone_2: result?.customer_contact?.contact_phone_2,
            };

            setInitialData(formatted);

            setloading(false);
        } catch (error) {
            setloading(false);
        }
    }

    useEffect(() => {
        if (customerMainid) {
            setcustomerId(customerMainid);
            fetchCustomerById();
        }
    }, [customerMainid, customerId]);



    const editCustomerHandler = async (values) => {
        const customer_info = {
            customer_name: values.customerName,
            customer_code: values.customerCode || '',
            address1: values.address1,
            address2: values.address2,
            address3: values.address3 || '',
            city: values.city,
            state: values.state,
            pincode: values.pinCode,
            country: values.country,
            gst_number: values.gst_number,
            contract_days: values.contract_days
        };

        const customer_contact_info = {
            contact_title: values.contact_title,
            contact_fullname: values.contact_fullname,
            contact_email: values.contact_email,
            contact_phone_1: values.contact_phone_1,
            contact_phone_2: values.contact_phone_2 || '',
        };

        setloading(true);
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/customers/edit-customer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    customer_id: customerMainid,
                    customer: customer_info,
                    customer_contact: customer_contact_info,
                    labId: auth.labId,
                }),
            });

            const data = await res.json();

            if (data?.code === 201) {


                GlobalNotification.success({
                    title: 'Customer Updated',
                    description: 'The Customer was Updated successfully.',
                    duration: 2
                });
                navigate("/dashboard/customers");
            } else {

                GlobalNotification.error({
                    title: 'Update Failed',
                    description: data?.message || 'Something went wrong!',
                    duration: 2
                });
            }
        } catch (error) {

            GlobalNotification.error({
                title: 'Submission Failed',
                description: error.message || 'Something went wrong!',
                duration: 2
            });
        }
        setloading(false);
    };


    return (

        <CustomerForm
            mode="edit"
            onSubmit={editCustomerHandler}
            isLoading={loading}
            titleOptions={options}
            initialData={initialData || {}}
        />

    )
}

export default EditCustomer;