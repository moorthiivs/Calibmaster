import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner } from "react-rainbow-components";
import { AuthContext } from '../../../../context/auth-context';
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.js";
import { useDispatch } from 'react-redux';
import Loader from '../../../UI/Loader';


const QuotationCustomerList = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [QuotationCustomerDetail, setQuotationCustomerDetail] = useState([]);

    const [loading, setloading] = useState(false);

    const fetchConfig = async () => {
        try {
            setloading(true);
            const data = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-customer-list/${auth.labId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let serverResponse = await data.json();

            const { msg, LabQuotationCustomer } = serverResponse;

            setQuotationCustomerDetail(LabQuotationCustomer);
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

    const viewCertificateHandler = async (filename) => {
        try {
            // *** Create Request Body object ***
            const requestBody = {
                filename
            }
            // *** Create Request Options object ***
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            let response = await fetch(config.Calibmaster.URL + "/api/quotation/view", requestOptions);
            if (!response.ok) {
                throw new Error('File Not Found');
            }
            let blob = await response.blob()
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

        } catch (error) {
            const errNotification = {
                title: "Failed to View Quotation",
                icon: "error",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    const EditBtn = ({ row }) => {
        return <Button
            label="View Quotation"
            onClick={() => { viewCertificateHandler(row?.quotation_filename) }}
        />
    };


    return (
        <div className="users__container">
            <Card className="users__card">

                <div className="users__label">
                    <h3 className="text-lg font-bold my-5">Quotation Customers List</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={QuotationCustomerDetail}
                    keyField="quotation_config_id"
                >
                    <Column header="Sr No" field="id" width={100} component={({ index }) => index + 1} />
                    <Column header="Customer Name" field="customer_company_name" />
                    <Column header="Customer Contact Name" field="customer_name" />
                    <Column header="Customer Number" field="customer_Contact_number" />
                    <Column header="Customer Email" field="customer_email" />
                    <Column header="Quotation Number" field="quotation_number" />
                    <Column
                        header="Quotation"
                        field="quotation_filename"
                        component={EditBtn}
                    />
                </TableWithBrowserPagination>

                {loading && <Loader />}
            </Card>
        </div>
    )
}

export default QuotationCustomerList
