import { useContext, useEffect, useState } from "react";
import { Card, Avatar, Button, Spinner, Modal } from "react-rainbow-components";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import "./modal.css";
import Loader from "../../UI/Loader";

const ClientUserModal = ({ isopen, onclose, clientUserId }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [clientInfo, setClientInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchClientInfo = async () => {
        try {
            setLoading(true);
            let response = await fetch(config.CustomerPortal.URL + `/api/users/fetchClient/${clientUserId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            response = await response.json();
            console.log(response);
            const { status, code, client, message } = response

            if (status == "SUCCESS") {
                setClientInfo(client);
                setLoading(false);
                const newNotification = {
                    title: message,
                    icon: "success",
                    state: true,
                    timeout: 1500,
                };
                return dispatch(notificationActions.changenotification(newNotification));
            } else {
                const newNotification = {
                    title: "Something went wrong",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
                dispatch(notificationActions.changenotification(newNotification));
                setLoading(false);
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
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchClientInfo();
    }, []);

    if (loading)
        return <Loader />;

    return (
        <Modal
            id="modal-2"
            isOpen={isopen}
            onRequestClose={onclose}
            title="View Client Info"
        >
            <div className="modal_content_style">
                <p>Client Name: <span>{clientInfo?.name}</span></p>
                <p>Client Email: <span>{clientInfo?.email}</span></p>
            </div>
        </Modal>
    )
}

export default ClientUserModal