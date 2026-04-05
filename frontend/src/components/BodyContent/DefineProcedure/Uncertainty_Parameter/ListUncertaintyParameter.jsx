import { useContext, useEffect, useState } from "react";
import { TableWithBrowserPagination, Column, Button, Spinner, Input, Card, Badge } from "react-rainbow-components";
import config from "../../../../utils/config.json";
import axios from 'axios';
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../../context/auth-context";
import { notificationActions } from "../../../../store/nofitication";
import "./ListUncertaintyParameter.css";
import AddUncertaintyParameterModal from "./AddUncertaintyParameterModal";
import { umpListActions } from "../../../../store/umpItemsList";

const ListUncertaintyParameter = ({ selectedUMPList, setSelectedUMPList }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const umpListItems = useSelector((state) => state.umpListItems.list);

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [openAddUMPModal, setOpenAddUMPModal] = useState(false);

    useEffect(() => {
        setData(umpListItems);
    }, [umpListItems]);

    const openModal = () => {
        setOpenAddUMPModal(true);
    }

    const closeModal = () => {
        setOpenAddUMPModal(false);
    }

    const removeItemHandler = (index) => {
        dispatch(umpListActions.removeUMPItem(index));
    }

    return (
        <div className="list_uncertainty_parameter">

            <div className="list_uncertainty_parameter_top_area">
                <h3>Select Uncertainty Parameters</h3>

                <div>
                    <Button
                        label="Add Uncertainty Parameter"
                        variant="success"
                        size='small'
                        onClick={openModal}
                    />
                </div>
            </div>

            <TableWithBrowserPagination
                pageSize={25}
                data={data}
                isLoading={isLoading}
                keyField="unique_id"
            >
                <Column header="S.No" field="uncertainty_master_parameter_id" component={(data) => data?.index + 1} />
                <Column header="Name" field="name" />
                <Column header="description" field="description" />
                <Column header="parameter_type" field="parameter_type" />
                <Column header="distribution" field="distribution" />
                <Column header="dividing_factor" field="dividing_factor" />
                <Column header="status" field="status"
                    component={({ row }) => (
                        row?.status === "Active" ? <Badge label={row?.status} variant="success" title={row?.status} />
                            : <Badge label={row?.status} variant="error" title={row?.status} />
                    )}
                />
                <Column header="Action" component={(data) => (
                    <Button
                        label="Delete" size='small' variant="destructive"
                        onClick={() => removeItemHandler(data?.index)} />
                )} />
            </TableWithBrowserPagination>

            {openAddUMPModal && (
                <AddUncertaintyParameterModal
                    isopen={openAddUMPModal}
                    onclose={closeModal}
                    setData={setData}
                />
            )}
        </div>
    )
}

export default ListUncertaintyParameter;