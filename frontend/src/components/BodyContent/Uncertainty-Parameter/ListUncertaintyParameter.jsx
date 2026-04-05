import { useContext, useEffect, useState } from "react";
import { TableWithBrowserPagination, Column, Button, Spinner, Input, Card, Badge } from "react-rainbow-components";
import config from "../../../utils/config.json";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { notificationActions } from "../../../store/nofitication";
import EditUncertaintyParameter from "./EditUncertaintyParameter";
import "./ump-style.css";

const ListUncertaintyParameter = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [eachUMPInfo, seteachUMPInfo] = useState({});
    const [editUMPModal, setEditEMPModal] = useState(false);

    const fetchUMPList = async () => {
        try {
            setIsLoading(true);

            const headers = {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
            };

            const response = await axios
                .get(`${config.Calibmaster.URL}/api/uncertainty-master-parameters/list/${auth.labId}`,
                    { headers }
                );

            if (response?.status === 200) {
                const { msg, query } = response.data;
                setIsLoading(false);
                setData(query);
                const newNotification = {
                    title: msg,
                    description: "",
                    icon: "success",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(newNotification));
            } else {
                setIsLoading(false);
                const errornotification = {
                    title: "Something went wrong",
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(errornotification));
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false)
            const errornotification = {
                title: "Internal Server Error",
                description: "",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
        }
    }

    useEffect(() => {
        fetchUMPList();
    }, [])

    const EditUser = ({ row }) => (
        <Button
            variant="neutral"
            label="Edit"
            onClick={() => {
                seteachUMPInfo(row);
                setEditEMPModal(true);
            }}
        />
    );

    const closeEditModal = () => {
        setEditEMPModal(false);
        fetchUMPList();
    }

    return (
        <div className="ump_container">

            <Card className="ump_list_card">

                <div className="add_ump_label">
                    <h3>List Uncertainty Parameter</h3>
                </div>

                <TableWithBrowserPagination
                    pageSize={25}
                    data={data}
                    isLoading={isLoading}
                    onRowSelection={selection => console.log(selection)}
                    keyField="uncertainty_master_parameter_id"
                >
                    <Column header="S.No" field="uncertainty_master_parameter_id" component={(data) => data?.index + 1} />
                    <Column header="Name" field="name" />
                    <Column header="description" field="description" />
                    <Column header="parameter_type" field="parameter_type" />
                    <Column header="distribution" field="distribution" />
                    <Column header="dividing_factor" field="dividing_factor" />
                    <Column header="status" field="status"
                        component={({ row }) => (
                            row.status === "Active" ? <Badge label={row.status} variant="success" title={row.status} />
                                : <Badge label={row.status} variant="error" title={row.status} />
                        )}
                    />
                    <Column header="Edit" field="uncertainty_master_parameter_id" component={EditUser} />
                </TableWithBrowserPagination>
            </Card>


            {editUMPModal && (
                <EditUncertaintyParameter
                    isopen={editUMPModal}
                    onclose={closeEditModal}
                    eachUMPInfo={eachUMPInfo}
                />
            )}

        </div>
    )
}

export default ListUncertaintyParameter