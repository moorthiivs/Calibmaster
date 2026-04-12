import React, { useContext, useState, useEffect } from 'react';
import { Card, Avatar, Button, Spinner, Modal } from "react-rainbow-components";
import { Buffer } from "buffer";
import config from "../../../utils/config.js";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import { notificationActions } from "../../../store/nofitication";
import DataTable from 'react-data-table-component';
import "./table.css";
import Loader from '../../UI/Loader';

// Demo Image
import noImage from "../../../assets/no-image.jpg";
import { labIdActions } from '../../../store/labId';
import CustomerLabModal from './CustomerLabModal';
import UpdateConfig from './UpdateConfig';

const LabList = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [Lab, setLab] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [customerLabId, setCustomerLabId] = useState("");
    const [customerLabModal, setCustomerLabModal] = useState(false);

    const [configLabId, setConfigLabId] = useState("");
    const [openConfigModal, setopenConfigModal] = useState(false);

    const fetchLabs = async () => {
        try {
            setIsLoading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/lab/listing", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let response = await data.json();
            setLab(response.data);
            setIsLoading(false);
        } catch (error) {
            const newNotification = {
                title: "Something went wrong",
                description: "Edit Lab",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchLabs();
    }, []);

    const closeCofigModal = () => {
        return setopenConfigModal(false);
    }

    const openConfigModalHandler = (lab_id) => {
        setopenConfigModal(true);
        setConfigLabId(lab_id);
    }

    const ExpandedComponent = ({ data }) => {
        return <div className="innerParent">

            <div className="eachChild">
                <b>Address Line 1</b>
                <span> {data.address1}</span>
            </div>
            <div className="eachChild">
                <b>Address Line 2</b>
                <span> {data.address2}</span>
            </div>
            <div className="eachChild">
                <b>Address Line 3</b>
                <span> {data.address3}</span>
            </div>

            <div className="eachChild">
                <b>Brand Logo</b>
                <span>
                    <img
                        src={
                            data?.brand_logo_filename ?
                                (`${config.Calibmaster.URL}/images/${data.brand_logo_filename}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>
            <div className="eachChild">
                <b>Other Logo 1</b>
                <span>
                    <img
                        src={
                            data?.other_logo1_image_filename ?
                                (`${config.Calibmaster.URL}/images/${data.other_logo1_image_filename}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>
            <div className="eachChild">
                <b>Other Logo 2</b>
                <span>
                    <img
                        src={
                            data?.other_logo2_image_filename ?
                                (`${config.Calibmaster.URL}/images/${data.other_logo2_image_filename}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>

            <div className="eachChild">
                <b>Pincode</b>
                <span> {data?.pincode ? data.pincode : ""}</span>
            </div>
            <div className="eachChild">
                <b>Email SMTP Host</b>
                <span> {data?.email_smtp_server_host ? data.email_smtp_server_host : ""}</span>
            </div>
            <div className="eachChild">
                <b>Email SMTP Port</b>
                <span> {data.email_smtp_server_port ? data.email_smtp_server_port : ""}</span>
            </div>

            <div className="eachChild">
                <b>Sender Email</b>
                <span> {data?.sender_email ? data.sender_email : ""}</span>
            </div>
            <div className="eachChild">
                <b>Sender Email Password</b>
                <span> {data?.sender_password ? data.sender_password : ""}</span>
            </div>
            <div className="eachChild">
                <b>GST Number</b>
                <span> {data.gst_number ? data.gst_number : ""}</span>
            </div>

            <div className="eachChild">
                <b>Seal Logo</b>
                <span>
                    <img
                        src={
                            data?.seal_image_filename ?
                                (`${config.Calibmaster.URL}/images/${data.seal_image_filename}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>
            <div className="eachChild">
                <b>QR Code 1</b>
                <span>
                    <img
                        src={
                            data?.certificate_accreditation_qr_code_logo_1 ?
                                (`${config.Calibmaster.URL}/images/${data.certificate_accreditation_qr_code_logo_1}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>
            <div className="eachChild">
                <b>QR Code 2</b>
                <span>
                    <img
                        src={
                            data?.scope_accreditation_qr_code_logo_2 ?
                                (`${config.Calibmaster.URL}/images/${data.scope_accreditation_qr_code_logo_2}`)
                                :
                                (noImage)
                        }
                        alt="brand-logo"
                    />
                </span>
            </div>
            <div className="eachChild">
                <b style={{ marginBottom: "10px" }}>Update Settings</b>
                <Button
                    label="Update"
                    onClick={() => {
                        openConfigModalHandler(data.lab_id)
                    }}
                    variant="brand"
                    size='small'
                    className="rainbow-m-around_medium"
                />
            </div>
        </div>;
    };

    const redirectHandler = (id) => {
        localStorage.setItem('lab_id', id);
        dispatch(labIdActions.setLabId(id));
        navigate("/dashboard/labs/edit");
    }

    const columns = [
        {
            name: 'S No',
            selector: row => row.slNo,
            sortable: true,
            style: { fontWeight: 'bold' },
        },
        {
            name: 'Lab Name',
            selector: row => row.lab_name,
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
            name: 'Contact Email',
            selector: row => row.contact_email,
        },
        {
            name: 'Contact Phone',
            selector: row => row.contact_number1,
        },
        {
            name: 'Active',
            selector: row => <>
                <Button
                    label="Edit Lab"
                    onClick={() => redirectHandler(row.lab_id)}
                    variant="brand"
                    size='small'
                    className="rainbow-m-around_medium"
                    style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                    }}
                />
            </>,
        },
        {
            name: 'Portal Lab',
            selector: row => <>
                <Button
                    label="View"
                    onClick={() => {
                        setCustomerLabId(row.calibmaster_lab_id);
                        setCustomerLabModal(true);
                    }}
                    variant="neutral"
                    size='small'
                    className="rainbow-m-around_medium"
                />
            </>,
        }
    ];

    const closeCustomerLabHandler = () => {
        setCustomerLabModal(false);
    }

    return (
        <div className="users__container">
            <Card className="users__card">
                <div className="users__label">
                    <h3>Labs</h3>
                </div>
                {isLoading
                    ? <Loader />
                    : <DataTable
                        columns={columns}
                        data={Lab}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                    />
                }
            </Card>

            {
                customerLabModal ? (
                    <CustomerLabModal
                        isopen={customerLabModal}
                        onclose={closeCustomerLabHandler}
                        customerLabId={customerLabId}
                    />
                ) : ""
            }

            {
                openConfigModal ? (
                    <UpdateConfig
                        isOpen={openConfigModal}
                        onRequestClose={closeCofigModal}
                        configLabId={configLabId}
                    />
                ) : ""
            }

        </div>
    )
}

export default LabList;
