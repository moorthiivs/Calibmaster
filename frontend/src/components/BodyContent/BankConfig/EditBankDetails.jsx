import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner, Modal, DatePicker } from "react-rainbow-components";
import { AuthContext } from '../../../context/auth-context';
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import { useDispatch } from 'react-redux';
import Loader from '../../UI/Loader';

const EditBankConfig = ({ isOpen, onRequestClose, data }) => {
    const [bankName, setBankName] = useState(data.bank_name);
    const [accountNumber, setAccountNumber] = useState(data.account_number);
    const [bankBranch, setBankBranch] = useState(data.branch);
    const [BankIFSCCode, setBankIFSCCode] = useState(data.ifsc_code);

    const [isLoading, setisLoading] = useState(false);
    const [error, setError] = useState("");

    const dispatch = useDispatch();
    const auth = useContext(AuthContext);

    async function updateBankConfigHandler() {
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
            const { status, msg } = data;

            const newNotification = {
                title: msg,
                icon: "success",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setisLoading(false);
            onRequestClose();
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

    if (isLoading)
        return <Loader />;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
        >
            <div className="modal_container">
                <h2>Edit LUT Config</h2>

                <div className="input_wrapper">

                    <div className="each_input_container">
                        <Input
                            label="Bank Name"
                            placeholder="Bank Name"
                            required={true}
                            value={bankName}
                            onChange={(e) => { setBankName(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="each_input_container">
                        <Input
                            label="Bank Account Number"
                            placeholder="Bank Account Number"
                            required={true}
                            value={accountNumber}
                            onChange={(e) => { setAccountNumber(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="each_input_container">
                        <Input
                            label="Bank Branch"
                            placeholder="Bank Branch"
                            required={true}
                            value={bankBranch}
                            onChange={(e) => { setBankBranch(e.target.value); setError(""); }}
                        />
                    </div>

                    <div className="each_input_container">
                        <Input
                            label="Bank IFSC Code"
                            placeholder="Bank IFSC Code"
                            required={true}
                            value={BankIFSCCode}
                            onChange={(e) => { setBankIFSCCode(e.target.value); setError(""); }}
                        />
                    </div>

                </div>

                <div className="button_container">
                    <Button
                        label="Update"
                        onClick={updateBankConfigHandler}
                        variant="success"
                    />
                    {error && <p style={{ color: "red" }}>{error}</p>}
                </div>

            </div>
        </Modal>
    )
}

export default EditBankConfig
