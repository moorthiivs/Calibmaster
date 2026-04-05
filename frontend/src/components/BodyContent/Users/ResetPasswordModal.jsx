import { useContext, useEffect, useState } from "react";
import { Modal, Input, Spinner, Button } from "react-rainbow-components";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";

const ResetPasswordModal = (props) => {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passErr, setPassErr] = useState("");
    const [confirmPassErr, setConfirmPassErr] = useState("");

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const resetPasswordHandler = async () => {

        if (password === "") {
            setPassErr("Please enter a password");
            return;
        }

        if (confirmPassword === "") {
            setConfirmPassErr("Please enter confirm password");
            return;
        }

        if (password.length < 8) {
            setPassErr("Password must be 8 character");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPassErr("Password and confirm password must be the same");
            return;
        }

        // ! Now Send data to the server
        try {

            //*** Sending request to the calibmaster */
            const bodyData = {
                password,
                confirmPassword,
                userId: props.userid
            };

            const requestOptions_1 = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData),
            };

            let response_1 = await fetch(config.Calibmaster.URL + "/api/users/reset-password", requestOptions_1);
            let data_1 = await response_1.json();

            //*** If department==="Client" then Sending request to the customer portal */
            if (props?.clientInfo?.department === "Client") {
                const requestOptions_2 = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({
                        password,
                        calibmaster_client_id: props?.clientUserId
                    }),
                };
                let response_2 = await fetch(config.CustomerPortal.URL + "/api/users/reset-password", requestOptions_2);
                let data_2 = await response_2.json();
            }
            const newNotification = {
                title: data_1.message,
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            props.onclose();
        } catch (error) {
            console.log(error);

            const errornotification = {
                title: "Something went wrong",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    };

    return (
        <Modal
            id="reset_password_modal"
            isOpen={props.isopen}
            onRequestClose={props.onclose}
            title="Reset Password"
            footer={
                <div className="rainbow-flex center">
                    <Button
                        label="Update Password"
                        variant="brand"
                        onClick={resetPasswordHandler}
                    />
                </div>
            }
        >
            <div className="add__user__item">
                <input
                    type="password"
                    id="password"
                    style={{
                        height: 0, width: 0, border: 0
                    }}
                />
                <Input
                    label="Enter new password"
                    placeholder="Enter new password"
                    type="password"
                    disabled={false}
                    required={true}
                    onChange={(e) => { setPassword(e.target.value); setPassErr(""); }}
                />
                <input
                    type="password"
                    id="password"
                    value={password}
                    style={{
                        height: 0, width: 0, border: 0
                    }}
                />
                <span className="red">{passErr}</span>
            </div>

            <div className="add__user__item">
                <Input
                    label="Confirm Password"
                    placeholder="Confirm Password"
                    type="password"
                    disabled={false}
                    required={true}
                    onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPassErr(""); }}
                />
                <span className="red">{confirmPassErr}</span>
            </div>
        </Modal>
    )
}

export default ResetPasswordModal;