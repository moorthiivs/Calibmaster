import { useContext, useState } from "react";
import { Card, Spinner, Input, Button } from "react-rainbow-components";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import Loader from "../../UI/Loader";

const AddBankConfig = () => {

    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankBranch, setBankBranch] = useState("");
    const [BankIFSCCode, setBankIFSCCode] = useState("");

    const [isLoading, setisLoading] = useState(false);
    const [error, setError] = useState("");

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    async function addBankConfigHandler() {
        try {

            if (bankName == "") {
                setError("Bank Number is required");
                return false;
            }

            if (accountNumber == "") {
                setError("Bank Account Number is required");
                return false;
            }

            if (bankBranch == "") {
                setError("Bank Branch is required");
                return false;
            }

            if (BankIFSCCode == "") {
                setError("Bank IFSC Code is required");
                return false;
            }

            setisLoading(true);

            const bodyData = {
                bank_name: bankName,
                account_number: accountNumber,
                branch: bankBranch,
                ifsc_code: BankIFSCCode,
                lab_id: auth.labId
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/bank-config-routes/create-or-update", requestOptions);
            const data = await response.json();
            const { msg } = data;

            const newNotification = {
                title: msg,
                icon: "success",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setisLoading(false);
            navigate("/dashboard/bank-config");
        } catch (error) {
            console.log(error);
            const errNotification = {
                title: "Error while Adding LUT Config!!",
                description: "",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errNotification));
            setisLoading(false);
        }
    }

    return (
        <div className="add__user__container">
            <Card className="add__user__card">

                <div className="user__info">
                    <h3 className="text-lg font-bold my-5">Add Bank Configuration</h3>
                </div>

                <div className="add__user__form">

                    <div className="add__user__item">
                        <Input
                            label="Bank Name"
                            placeholder="Bank Name"
                            required={true}
                            onChange={(e) => { setBankName(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="add__user__item">
                        <Input
                            label="Bank Account Number"
                            placeholder="Bank Account Number"
                            required={true}
                            onChange={(e) => { setAccountNumber(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="add__user__item">
                        <Input
                            label="Bank Branch"
                            placeholder="Bank Branch"
                            required={true}
                            onChange={(e) => { setBankBranch(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="add__user__item">
                        <Input
                            label="Bank IFSC Code"
                            placeholder="Bank IFSC Code"
                            required={true}
                            onChange={(e) => { setBankIFSCCode(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="add__user__item">
                        <Button
                            label="Create Or Update"
                            onClick={addBankConfigHandler}
                            variant="success"
                            className="rainbow-m-around_medium"
                        />
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </div>

                </div>

                {isLoading ? <Loader /> : null}

            </Card>
        </div>
    )
}

export default AddBankConfig;