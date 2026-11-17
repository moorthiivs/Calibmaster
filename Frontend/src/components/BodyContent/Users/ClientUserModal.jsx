import { useContext, useEffect, useState } from "react";
import { Card, Avatar, Button, Spinner, Modal } from "react-rainbow-components";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import "./modal.css";
import Loader from "../../UI/Loader";
import config from "../../../utils/config.json";
const ClientUserModal = ({ isopen, onclose, clientUserId }) => {

    const auth = useContext(AuthContext);

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
                return GlobalNotification.success({
                    title: message,
                });
            } else {
                GlobalNotification.error({
                    title: "Something went wrong",
                });
                setLoading(false);
            }
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
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