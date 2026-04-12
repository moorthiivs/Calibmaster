import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner, Input } from 'react-rainbow-components';
import "../InstrumentType/style.css";
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from '../../../context/auth-context';
import Loader from '../../UI/Loader';


const PasswordReset = () => {

    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [currentPassErr, setCurrentPassErr] = useState("");
    const [passErr, setPassErr] = useState("");
    const [confirmPassErr, setConfirmPassErr] = useState("");

    const [loading, setloading] = useState(false);
    const [error, setError] = useState("");

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const resetPasswordHandler = async () => {

        setError("");
        if (currentPassword === "") {
            setCurrentPassErr("Please enter current password");
            return;
        }

        if (password === "") {
            setPassErr("Please enter a password");
            return;
        }

        if (password.length < 8) {
            setPassErr("Password must be at least 8 characters");
            return;
        }

        if (confirmPassword === "") {
            setConfirmPassErr("Please enter confirm password");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPassErr("Password and confirm password must be the same");
            return;
        }

        if (currentPassword === password) {
            setError("New password must differ from current");
            return;
        }
        setloading(true)
        // ! Now Send data to the server
        try {
            // //*** Sending request to the calibmaster */
            const bodyData = {
                password,
                currentPassword,
                email: auth.email,
                labId: auth.labId
            };

            const requestOptions_1 = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData),
            };

            let response_1 = await fetch(config.Calibmaster.URL + "/api/users/admin-reset-password", requestOptions_1);
            let data_1 = await response_1.json();

            if (response_1.status !== 200) {
                setloading(false);
                return setError(data_1.message);
            }

            setCurrentPassword("");
            setPassword("");
            setConfirmPassword("");

            const newNotification = {
                title: "Password updated successfully",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
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
        setloading(false);
    };

    return (
        <div className="masterlist">
            <div className="add__masterlist__container">

                <Card className="add__user__card">
                    <div className="add__user__form">

                        <div className="add__user__label ">
                            <h3 className='text-center'>Reset Password</h3>
                        </div>

                        <div className="add__user__item mt-4">
                            <CustomInput
                                label="Current Password"
                                value={currentPassword}
                                type="password"
                                onchange={(v) => {
                                    setCurrentPassword(v.trim());
                                    setCurrentPassErr("");
                                    setError('');
                                }}
                                disabled={false}
                                required={true}
                            />
                            <span className="red">{currentPassErr}</span>
                        </div>

                        <div className="add__user__item">
                            <input
                                type="password"
                                id="password"
                                style={{
                                    height: 0, width: 0, border: 0
                                }}
                            />
                            <CustomInput
                                label="New Password"
                                type="password"
                                value={password}
                                onchange={(v) => { setPassword(v.trim()); setPassErr(""); setError(''); }}
                                disabled={false}
                                required={true}
                            />
                            <input
                                type="password"
                                id="password"
                                style={{
                                    height: 0, width: 0, border: 0
                                }}
                            />
                            <span className="red">{passErr}</span>
                        </div>

                        <div className="add__user__item">
                            <input
                                type="password"
                                id="password"
                                style={{
                                    height: 0, width: 0, border: 0
                                }}
                            />
                            <CustomInput
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onchange={(v) => { setConfirmPassword(v.trim()); setConfirmPassErr(""); setError(''); }}
                                disabled={false}
                                required={true}
                            />
                            <input
                                type="password"
                                id="password"
                                style={{
                                    height: 0, width: 0, border: 0
                                }}
                            />
                            <span className="red">{confirmPassErr}</span>
                        </div>
                        {/* Submit Button Start */}

                        <div className="add__user__item mt-4">
                            <CustomButton
                                label="Update Password"
                                variant="success"
                                onclick={resetPasswordHandler}
                            />
                        </div>

                        {/* Submit Button End */}
                        <p className="red center w100">{error}</p>
                        {(loading) ? <Loader /> : ""}
                    </div>

                </Card>

            </div>
        </div>
    )
}

export default PasswordReset;
