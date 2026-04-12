import React, { useContext, useState, useEffect } from 'react';
import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner, CheckboxToggle } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.js";
import { notificationActions } from "../../../../store/nofitication";
import { useDispatch } from 'react-redux';
import EditCertificateConfig from './EditCertificateConfig';
import { sidebarActions } from "../../../../store/sidebar";

const ListCertificateConfig = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [configData, setConfigData] = useState({});

    const fetchCertificateConfig = async () => {
        try {
            let response = await fetch(config.Calibmaster.URL + "/api/cms-setting/fetch-cms-certificate", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            response = await response.json();
            console.log(response);

            if (response?.result?.length > 0) {

                const { result } = response;
                setData(result);

                const newNotification = {
                    title: "CMS Certificate Settings fetched successfully.",
                    description: "",
                    icon: "success",
                    state: true,
                    timeout: 1500,
                };
                return dispatch(notificationActions.changenotification(newNotification));
            } else {
                const newNotification = {
                    title: "Something went wrong",
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                };
                dispatch(notificationActions.changenotification(newNotification));
            }
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
        fetchCertificateConfig();
    }, []);

    const getCertificateStateHandler = ({ row }) => {

        const { setting_value } = row;

        const text = setting_value;

        return <p style={{ margin: 0, fontWeight: "bold", color: setting_value === "YES" ? "green" : "red" }}>
            {text}
        </p>
    }

    const editConfigHandler = ({ row }) => {
        return <EditCertificateConfig configData={row} fetchCertificateConfig={fetchCertificateConfig} />
    };

    return (
        <div className="users__container">
            <Card className="users__card">

                <div className="users__label">
                    <h3>Config List</h3>
                </div>

                <TableWithBrowserPagination
                    className="labs__table"
                    pageSize={15}
                    data={data}
                    keyField="cmssetting_id"
                    style={{ textAlign: 'center' }}
                >
                    <Column header="Sr No" field="cmssetting_id" width={90} cellAlignment={"center"} />
                    <Column header="Certificate Name" field="setting_name" cellAlignment={"center"} />
                    <Column header="Certificate Lable" field="setting_lable" cellAlignment={"center"}  />
                    <Column header="Certificate Description" field="setting_description" cellAlignment={"center"} />
                    {/* <Column header="Certificate Enabled" field="setting_value" component={getCertificateStateHandler} />
                    <Column header="Action" field="cmssetting_id" component={editConfigHandler} /> */}

                </TableWithBrowserPagination>

            </Card>
        </div>
    )
}

export default ListCertificateConfig;

