import React, { useContext, useState, useEffect } from 'react';
import { Card, Button } from "react-rainbow-components";
import { Modal, Input, Button as AntButton } from "antd";
import config from "../../../utils/config.json";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import DataTable from '../../common/DataTable';
import GlobalNotification from "../../../utils/GlobalNotification";
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

    // Delete Lab State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteLabId, setDeleteLabId] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

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
            GlobalNotification.error({
                title: "Something went wrong",
                description: "Failed to fetch labs",
            });
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

    const expandedRowRender = (data) => {
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

    const openDeleteModal = (lab_id) => {
        setDeleteLabId(lab_id);
        setDeletePassword("");
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(config.Calibmaster.URL + "/api/lab/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    labId: deleteLabId,
                    password: deletePassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                GlobalNotification.success({
                    title: "Success",
                    description: "Lab deleted successfully",
                });
                setDeleteModalVisible(false);
                fetchLabs();
                
                // If the deleted lab was currently active, clear it out of auth context
                if (String(auth.labId) === String(deleteLabId)) {
                    auth.switchLab("");
                    // Force a reload to cleanly reset the header and dashboard
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Optionally notify the header to refresh its dropdown if it's listening
                    window.dispatchEvent(new Event('labs_updated'));
                }
            } else {
                GlobalNotification.error({
                    title: "Error",
                    description: data.message || "Failed to delete lab",
                });
            }
        } catch (error) {
            GlobalNotification.error({
                title: "Error",
                description: "Failed to delete lab",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            title: 'Lab Name',
            dataIndex: 'lab_name',
        },
        {
            title: 'City',
            dataIndex: 'city',
        },
        {
            title: 'State',
            dataIndex: 'state',
        },
        {
            title: 'Contact Email',
            dataIndex: 'contact_email',
        },
        {
            title: 'Contact Phone',
            dataIndex: 'contact_number1',
        },
        {
            title: 'Active',
            render: (_, row) => <>
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
            title: 'Portal Lab',
            render: (_, row) => <>
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
        },
        {
            title: 'Actions',
            render: (_, row) => <>
                <Button
                    label="Delete"
                    onClick={() => openDeleteModal(row.lab_id)}
                    variant="destructive"
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
                        rowKey="lab_id"
                        expandable={{
                            expandedRowRender: (record) => expandedRowRender(record),
                        }}
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

            <Modal
                title="Confirm Lab Deletion"
                open={deleteModalVisible}
                onCancel={() => setDeleteModalVisible(false)}
                footer={[
                    <AntButton key="back" onClick={() => setDeleteModalVisible(false)}>
                        Cancel
                    </AntButton>,
                    <AntButton 
                        key="submit" 
                        danger 
                        type="primary" 
                        loading={isDeleting} 
                        disabled={!deletePassword} 
                        onClick={confirmDelete}
                    >
                        Delete
                    </AntButton>,
                ]}
            >
                <div className="p-4">
                    <p className="text-red-500 font-bold mb-4">
                        Warning: This action will permanently delete the lab and all associated data. This action cannot be undone.
                    </p>
                    <p className="mb-2">Please enter your password to confirm:</p>
                    <Input.Password
                        placeholder="Enter password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                    />
                </div>
            </Modal>

        </div>
    )
}

export default LabList;