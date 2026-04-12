import React, { useContext, useState, useEffect } from 'react';
import {
    Card,
    Button,
    Input,
    TableWithBrowserPagination,
    Column,
    Spinner, Modal, DatePicker
} from "react-rainbow-components";
import { AuthContext } from '../../../context/auth-context';
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import { useDispatch } from 'react-redux';
import { formattedDate } from '../../helpers/Helper';
import Loader from '../../UI/Loader';

const ListSRFConfig = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [srfConfigList, setSrfConfigList] = useState([]);
    const [loading, setloading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [issueNumber, setIssueNumber] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [amendNumber, setAmendNumber] = useState("");
    const [amendDate, setAmendDate] = useState("");
    const [isEditModalLoading, setIsEditModalLoading] = useState(false);

    const fetchSRFConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/srf-config/fetch/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let response = await data.json();
            const { result } = response;
            setSrfConfigList(result);
            setloading(false);

            const newNotification = {
                title: "SRF Config fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };
            return dispatch(notificationActions.changenotification(newNotification));
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
    }

    useEffect(() => {
        fetchSRFConfig()
    }, []);

    const issueDateHandler = ({ value }) => {
        let formatedDate = "";
    
        if (value !== "") {
          const date = new Date(value);
          const currentDate = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("default", { month: "short" });
          const fullYear = date.getFullYear();
          formatedDate = currentDate + "-" + month + "-" + fullYear;
        }
        return formatedDate;
    }

    const amendDateHandler = ({ value }) => { 
        let formatedDate = "";
    
        if (value !== "") {
          const date = new Date(value);
          const currentDate = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("default", { month: "short" });
          const fullYear = date.getFullYear();
          formatedDate = currentDate + "-" + month + "-" + fullYear;
        }
        return formatedDate;
      };

    const EditBtn = ({ data }) => {
        return <Button
            label="Edit"
            variant="success"
            className="rainbow-m-around_medium"
            onClick={fetchSrfHandler}
        />
    };

    const fetchSrfHandler = () => {
        if (srfConfigList?.length > 0) {
            setIssueNumber(srfConfigList[0]?.issue_no);
            setAmendNumber(srfConfigList[0]?.amend_no);

            let newIssueDate = new Date(srfConfigList[0]?.issue_date).toISOString().split('T')[0].split('-').reverse().join('/');
            setIssueDate(new Date(srfConfigList[0]?.issue_date));

            let newAmmendDate = new Date(srfConfigList[0]?.amend_date).toISOString().split('T')[0].split('-').reverse().join('/');
            setAmendDate(new Date(srfConfigList[0]?.amend_date));
        }
        setIsEditModalOpen(true);
    }

    const EditSRFConfigHandler = async () => {
        try {

            const newSRFConfig = {
                issue_no: issueNumber,
                issue_date: issueDate,
                amend_no: amendNumber,
                amend_date: amendDate,
                lab_id: auth.labId
            }

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newSRFConfig)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/srf-config/edit", requestOptions);
            const data = await response.json();

            const newNotification = {
                title: data?.response,
                icon: "success",
                state: true,
                timeout: 1500,
            };
            fetchSRFConfig();
            dispatch(notificationActions.changenotification(newNotification));
            setIsEditModalOpen(false);
        } catch (error) {
            console.log(error);
            const errNotification = {
                title: "Something went wrong",
                description: name,
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    return (
        <div className="users__container">
            <Card className="users__card">

                <div className="users__label">
                    <h3 className="text-lg font-bold my-5">SRF Config View</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={srfConfigList}
                    keyField="id"
                >
                    <Column header="Sr No" field="id" cellAlignment={"center"} />
                    <Column header="Issue Number" field="issue_no" cellAlignment={"center"} />
                    <Column header="Issue Date" field="issue_date" component={issueDateHandler} cellAlignment={"center"} />
                    <Column header="Amend Numbe" field="amend_no" cellAlignment={"center"} />
                    <Column header="Amend Date" field="amend_date" component={amendDateHandler} cellAlignment={"center"} />
                    <Column
                        header="Action"
                        field="uom_id"
                        component={EditBtn}
                        cellAlignment={"center"}
                    />
                </TableWithBrowserPagination>

                {(loading || isEditModalLoading) ? <Loader /> : ""}
            </Card>

            {isEditModalOpen ? (
                <Modal
                    id="modal-2"
                    isOpen={isEditModalOpen}
                    onRequestClose={() => setIsEditModalOpen(false)}
                >
                    <div className="new_file_modal">
                        <h2>Edit SRF Config</h2>

                        <div className="add__user__form">

                            <div className="add__user__item">
                                <Input
                                    label="Issue Number"
                                    placeholder="Issue Number"
                                    className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                                    required={true}
                                    value={issueNumber}
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
                                    value={amendNumber}
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

                        </div>

                        <div className="button_container">
                            <Button
                                label="Edit"
                                onClick={EditSRFConfigHandler}
                                variant="success"
                                className="rainbow-m-around_medium"
                            />
                        </div>
                    </div>
                </Modal>
            ) : ""}
        </div>
    )
}

export default ListSRFConfig;
