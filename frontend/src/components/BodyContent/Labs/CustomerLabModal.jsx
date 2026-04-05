import { useContext, useEffect, useState } from "react";
import { Card, Avatar, Button, Spinner, Modal } from "react-rainbow-components";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import "./modal.css";
import Loader from "../../UI/Loader";

const CustomerLabModal = ({ isopen, onclose, customerLabId }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [customerLabInfo, setCustomerLabInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchCustomerLab = async () => {
        setLoading(true);

        try {
            let response = await fetch(config.CustomerPortal.URL + `/api/lab/fetchLab/${customerLabId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            response = await response.json();
            const { status, customerLab, message } = response

            if (status == "SUCCESS") {
                setCustomerLabInfo(customerLab);
                const newNotification = {
                    title: message,
                    icon: "success",
                    state: true,
                    timeout: 1500,
                };
                dispatch(notificationActions.changenotification(newNotification));
            } else {
                const newNotification = {
                    title: "Something went wrong",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
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
            dispatch(notificationActions.changenotification(newNotification));
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchCustomerLab();
    }, []);

    if (loading)
        return <Loader />;

    return (
        <Modal
            id="modal-2"
            isOpen={isopen}
            onRequestClose={onclose}
            title="View Customer Lab Info"
        >
            <div className="modal_content_style">
                <p>Name: <span>{customerLabInfo?.lab_name}</span></p>
                <p>Symbol: <span>{customerLabInfo?.symbol}</span></p>

                <p>Email: <span>{customerLabInfo?.contact_email}</span></p>
                <p>Contact Number: <span>{customerLabInfo?.contact_number1}</span></p>

                <p>Address 1: <span>{customerLabInfo?.address1}</span></p>
                <p>Address 2: <span>{customerLabInfo?.address2}</span></p>
                <p>Address 3: <span>{customerLabInfo?.address3}</span></p>

                <p>City: <span>{customerLabInfo?.city}</span></p>
                <p>State: <span>{customerLabInfo?.state}</span></p>

                <p>Country: <span>{customerLabInfo?.country}</span></p>
                <p>Pincode: <span>{customerLabInfo?.pincode}</span></p>

                <Card className="modalCard">
                    <h4 style={{ textAlign: "center" }}>Lab Brand Logo</h4>
                    <img src={`${config.CustomerPortal.URL}/images/${customerLabInfo?.brand_logo_filename}`} />
                </Card>

            </div>
        </Modal>
    )
}

export default CustomerLabModal;