import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from '../../../context/auth-context';
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch } from 'react-redux';
import DataTable from 'react-data-table-component';
import { labIdActions } from '../../../store/labId';

import EditEmployee from './EditEmployee';
import Loader from '../../UI/Loader';

const ListEmployee = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [empList, setEmpList] = useState([]);
    const [loading, setloading] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [empData, setEmpData] = useState({});

    const fetchEmployees = async () => {
        try {
            setloading(true);

            const data = await fetch(config.Calibmaster.URL + "/api/employee-master/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId })
            });

            let response = await data.json();
            // console.log(response);
            setEmpList(response.data);
            setloading(false);

            const newNotification = {
                title: response.message,
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
        fetchEmployees();
    }, []);

    const closeModal = () => {
        setOpenModal(false);
        fetchEmployees();
    }

    const EditBtn = ({ row }) => {
        return <Button
            label="Edit Employee"
            size="small"
            onClick={() => {
                 console.log(row);
                setEmpData(row);
                setOpenModal(true);
            }}
            variant="success"
            className="rainbow-m-around_medium"
        />
    }

    return (
        <div className="users__container">
            <Card className="users__card">

                <div className="users__label">
                    <h3 className="text-lg font-bold my-5 text-center">Employee List</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={empList}
                    keyField="employee_id"
                >
                    <Column header="Sr No" field="employee_id" component={({ index }) => index + 1} cellAlignment={"center"} />
                    <Column header="Employee Title" field="employee_title" cellAlignment={"center"} />
                    <Column header="Employee Full Name" field="employee_full_name" cellAlignment={"center"} />
                    <Column header="Employee Role" field="employee_role" cellAlignment={"center"} />
                    <Column
                        header="Action"
                        field="uom_id"
                        component={EditBtn}
                        cellAlignment={"center"}
                    />
                </TableWithBrowserPagination>

            </Card>

            {
                openModal && (
                    <EditEmployee
                        isOpen={openModal}
                        onRequestClose={closeModal}
                        empData={empData}
                    />
                )
            }

            {(loading) ? <Loader /> : ""}
        </div>
    )
}

export default ListEmployee;
