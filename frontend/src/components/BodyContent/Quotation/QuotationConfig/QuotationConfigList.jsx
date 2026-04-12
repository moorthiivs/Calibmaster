import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner } from "react-rainbow-components";
import { AuthContext } from '../../../../context/auth-context';
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.js";
import { useDispatch } from 'react-redux';
import EditQuotationConfig from './EditQuotationConfig';
import Loader from '../../../UI/Loader';

const QuotationConfigList = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [QuotationConfigDetail,setQuotationConfigDetail]=useState([]);
    const [loading, setloading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editQuotationData,setEditQuotationData]=useState({});

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-config/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();
            console.log(serverResponse);
            const { msg, response, LabQuotationConfig } = serverResponse;
            console.log(LabQuotationConfig)
            setQuotationConfigDetail(LabQuotationConfig);
            setloading(false);

            const newNotification = {
                title: msg,
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
               setEditQuotationData(row)
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
                    <h3 className="text-lg font-bold my-5 text-center">Quotation Config List</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={QuotationConfigDetail}
                    keyField="quotation_config_id"
                >
                    <Column header="Sr No" field="id" component={({ index }) => index + 1} />
                    <Column header="Finanicial Year" field="Current_Financial_Year" />
                    <Column header="GST PERCENTAGE" field="GST_Percentage" />
                    <Column header="GST Number" field="GST_number" />
                    <Column header="Lab Short Name" field="Lab_Short_Name" />
                    <Column header="Quotation Short Name" field="Quotation_Short_Name" />
                    <Column header="Running Number" field="Running_Quotation_Number" />
                    <Column header="Quotation Number" field="Actual_Running_Quotation_Number" />
                    <Column
                        header="Action"
                        field="uom_id"
                        component={EditBtn}
                    />
                </TableWithBrowserPagination>

                {loading && <Loader />}

                {
                    isEditModalOpen && <EditQuotationConfig
                        isOpen={isEditModalOpen}
                        onRequestClose={closeEditModal}
                        data={editQuotationData}
                    />
                }

            </Card>
        </div>
    )
}

export default QuotationConfigList
