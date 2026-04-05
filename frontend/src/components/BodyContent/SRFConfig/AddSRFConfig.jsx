import { useContext, useEffect, useState } from "react";
import { Card, Spinner, Input, DatePicker, Button } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import ListSRFConfig from "./ListSRFConfig";
import { formattedDate } from "../../helpers/Helper";
import Loader from "../../UI/Loader";

const AddSRFConfig = () => {

    const [issueNumber, setIssueNumber] = useState("");
    const [issueDate, setIssueDate] = useState(new Date());
    const [amendNumber, setAmendNumber] = useState("");
    const [amendDate, setAmendDate] = useState(new Date());

    const [isLoading, setisLoading] = useState(false);

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const addSRFConfigHandler = async () => {
        try {

            const newSRFConfig = {
                issue_no: issueNumber,
                issue_date: issueDate,
                amend_no: amendNumber,
                amend_date: amendDate,
                lab_id: `'${auth.labId}'`
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newSRFConfig)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/srf-config/create", requestOptions);
            const data = await response.json();

            const { status, msg } = data;

            const newNotification = {
                title: msg,
                icon: "success",
                state: true,
                timeout: 1500,
            };

            dispatch(notificationActions.changenotification(newNotification));
            navigate("/dashboard/srf-config");

        } catch (error) {
            console.log(error);
            const errNotification = {
                title: "Error while Adding User!!",
                description: name,
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    return (
        <>
            <div className="add__user__container">
                <Card className="add__user__card">

                    <div className="user__info">
                        <h3 className="text-lg font-bold my-5">Add SRF Configuration</h3>
                    </div>

                    <div className="add__user__form">

                        <div className="add__user__item">
                            <Input
                                label="Issue Number"
                                placeholder="Issue Number"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                required={true}
                                onChange={(e) => setIssueNumber(e.target.value)}
                            />
                        </div>

                        <div className="add__user__item">
                            <div style={{ maxWidth: "215px" }}>
                                <DatePicker
                                    label="Issue Date"
                                    formatStyle="medium"
                                    locale="en-IN"
                                    value={issueDate}
                                    required={true}
                                    onChange={(value) => setIssueDate(formattedDate(value))}
                                />
                            </div>
                        </div>

                        <div className="add__user__item">
                            <Input
                                label="Amend Number"
                                placeholder="Amend Number"
                                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                required={true}
                                onChange={(e) => setAmendNumber(e.target.value)}
                            />
                        </div>

                        <div className="add__user__item">
                            <div style={{ maxWidth: "215px" }}>
                                <DatePicker
                                    label="Amend Date"
                                    formatStyle="medium"
                                    locale="en-IN"
                                    value={amendDate}
                                    required={true}
                                    onChange={(value) => setAmendDate(formattedDate(value))}
                                />
                            </div>
                        </div>

                        <div className="add__user__item">
                            <Button
                                label="Create Or Update"
                                onClick={addSRFConfigHandler}
                                variant="success"
                                className="rainbow-m-around_medium"
                            />
                        </div>

                    </div>

                    {isLoading ? <Loader /> : null}

                </Card>
            </div>
        </>
    )
}

export default AddSRFConfig;