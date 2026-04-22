import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, Column, Spinner } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from '../../../context/auth-context';
import { usePermissions } from '../../../hooks/usePermissions';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch } from 'react-redux';
import { labIdActions } from '../../../store/labId';
import { useNavigate } from 'react-router-dom';
import DataTable, { Alignment } from 'react-data-table-component';
import { addNewId } from './higherOrderFunction';
import "./table.css";
import "./customer.css";
import CustomerViewModal from './CustomerViewModal';
import Loader from '../../UI/Loader';
import showConfirmationDialog from '../../../utils/showConfirmationToast';

const ListCustomer = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [customerList, setCustomerList] = useState([]);
    const [loading, setloading] = useState(false);

    const [customerId, setCustomerId] = useState("");
    const [customerViewModal, setCustomerViewModal] = useState(false);

    const fetchCustomers = async () => {
        try {
            setloading(true);
            const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId })
            });

            let { data } = await response.json();
            let modifiedData = await addNewId(data);

            setCustomerList(modifiedData);
            setloading(false);

            const newNotification = {
                title: "Customer List fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
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
        fetchCustomers();
    }, []);

    const columns = [
        {
            name: 'S. No',
            selector: row => row.id,
            sortable: true,
            style: { fontWeight: 'bold' },
            width: '80px',
        },
        {
            name: 'Customer Name',
            selector: row => row.customer_name,
        },
        {
            name: 'Customer Code',
            selector: row => row.customer_code,
        },
        {
            name: 'City',
            selector: row => row.city,
        },
        {
            name: 'State',
            selector: row => row.state,
        },
        {
            name: 'Country',
            selector: row => row.country,
            Alignment: 'center',
        },
        // Portal Customer — always visible (read-only action)
        {
            name: 'Portal Customer',
            selector: row => <>
                <Button
                    label="View"
                    onClick={() => {
                        setCustomerId(row.calibmaster_customer_id);
                        setCustomerViewModal(true);
                    }}
                    variant="outline-brand"
                    size='small'
                    className="rainbow-m-around_medium"
                />
            </>,
            Alignment: 'center',
        },
        // Edit column — only rendered when user has EDIT_CUSTOMER
        hasPermission("EDIT_CUSTOMER") && {
            name: 'Edit',
            selector: row => (
                <Button
                    label="Edit"
                    onClick={() => redirectHandler(row.customer_id)}
                    variant="brand"
                    size='small'
                    className="rainbow-m-around_medium"
                />
            ),
            Alignment: 'center',
        },
        // Delete column — only rendered when user has DELETE_CUSTOMER
        hasPermission("DELETE_CUSTOMER") && {
            name: 'Delete',
            selector: row => (
                <Button
                    label="Delete"
                    onClick={() => handledeleteCustomer(row.customer_id)}
                    variant="destructive"
                    size='small'
                    className="rainbow-m-around_medium"
                />
            ),
            Alignment: 'center',
        },
    ].filter(Boolean); // Removes false entries (hidden columns) entirely — header included

    const ExpandedComponent = ({ data }) => {
        return <div className="dataContainer_customer">

            <div className="customerInfo">
                <b>Address Line 1: </b>
                <span> {data.address1}</span>
            </div>
            <div className="customerInfo">
                <b>Address Line 2: </b>
                <span> {data.address2}</span>
            </div>
            <div className="customerInfo">
                <b>Address Line 3: </b>
                <span> {data.address3}</span>
            </div>

            <div className="customerInfo">
                <b>City: </b>
                <span> {data.city}</span>
            </div>
            <div className="customerInfo">
                <b>State: </b>
                <span> {data.state}</span>
            </div>
            <div className="customerInfo">
                <b>Pincode: </b>
                <span> {data.pincode}</span>
            </div>
            <div className="customerInfo">
                <b>Country: </b>
                <span> {data.country}</span>
            </div>
            <div className="customerInfo">
                <b>GST Number: </b>
                <span> {data.gst_number}</span>
            </div>

            <div className="customerInfo">
                <b>Contact Name: </b>
                <span>
                    {`${data?.customer_contact?.contact_title} ${data?.customer_contact?.contact_fullname}`}
                </span>
            </div>
            <div className="customerInfo">
                <b>Contact Email: </b>
                <span>{data?.customer_contact?.contact_email} </span>
            </div>
            <div className="customerInfo">
                <b>Contact Phone 1: </b>
                <span>{data?.customer_contact?.contact_phone_1} </span>
            </div>
            <div className="customerInfo">
                <b>Contact Phone 2: </b>
                <span>{data?.customer_contact?.contact_phone_2} </span>
            </div>
        </div>
    }

    const redirectHandler = (id) => {
        localStorage.setItem('lab_id', id);
        dispatch(labIdActions.setLabId(id));
        navigate("/dashboard/customers/edit");
    }

    const closeCustomerViewModalHandler = () => {
        setCustomerViewModal(false);
    }

    const handledeleteCustomer = async (customerId) => {

        try {

            const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete This Customer?");
      
            if (!confirmDelete) {
              console.log("Cancel Delete!");
              return;
            }

            const response = await fetch(
                `${config.Calibmaster.URL}/api/customers/delete-customer`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + auth.token
                  },
                  body: JSON.stringify({
                    customerId: customerId,
                    lab_id: auth.labId,
                  })
                }
              );
            const result = await response.json();
            if (response.ok) {
                fetchCustomers();
            }
            
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="users__container">
            <Card className="users__card">

                <DataTable
                    columns={columns}
                    data={customerList}
                    title={<strong>Customers</strong>}
                    fixedHeader
                    expandableRows
                    expandableRowsComponent={ExpandedComponent}
                    pagination
                />
                {(loading) ? <Loader /> : ""}
            </Card>

            {
                customerViewModal ? <CustomerViewModal
                    isopen={customerViewModal}
                    onclose={closeCustomerViewModalHandler}
                    customerId={customerId}
                /> : ""
            }

        </div>
    )
}

export default ListCustomer;