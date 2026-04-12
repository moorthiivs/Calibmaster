import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner } from "react-rainbow-components";
import { AuthContext } from '../../../context/auth-context';
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import { useDispatch } from 'react-redux';
import EditBankConfig from './EditBankDetails';
import Loader from '../../UI/Loader';

const ListBankConfig = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [BankConfigList, setBankConfigList] = useState([]);
    const [loading, setloading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [BankConfigEditData, setBankConfigEditData] = useState({});

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/bank-config-routes/fetch-config/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();
            console.log(serverResponse)
            const { response, result } = serverResponse;
            setBankConfigList(result);
            setloading(false);

            const newNotification = {
                title: response,
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
            setloading(false);
        }
    }

    useEffect(() => {
        fetchConfig();
    }, []);

    const EditBtn = ({ row }) => {
        return <Button
            label="Edit"
            variant="success"
            className="rainbow-m-around_medium"
            onClick={() => {
                setIsEditModalOpen(true);
                setBankConfigEditData(row);
            }}
        />
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        fetchConfig();
    }

    return (
        <div className="users__container">
            <Card className="users__card">

                <div className="users__label">
                    <h3 className="text-lg font-bold my-5">LUT Config View</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={BankConfigList}
                    keyField="lab_bank_detail_id"
                >
                    <Column header="Sr No" field="id" component={({ index }) => index + 1} cellAlignment={"center"} />
                    <Column header="Bank Name" field="bank_name" cellAlignment={"center"} />
                    <Column header="Account Number" field="account_number" cellAlignment={"center"} />
                    <Column header="Branch" field="branch" cellAlignment={"center"} />
                    <Column header="IFSC Code" field="ifsc_code" cellAlignment={"center"} />

                    <Column
                        header="Action"
                        field="uom_id"
                        component={EditBtn}
                        cellAlignment={"center"}
                    />
                </TableWithBrowserPagination>

                {loading && <Loader />}

                {
                    isEditModalOpen && <EditBankConfig
                        isOpen={isEditModalOpen}
                        onRequestClose={closeEditModal}
                        data={BankConfigEditData}
                    />
                }

            </Card>
        </div>
    )
}

export default ListBankConfig
