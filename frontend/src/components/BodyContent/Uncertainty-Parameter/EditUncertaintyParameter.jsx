import { useContext, useEffect, useState } from "react";
import { Modal, Button, Input, Select } from 'react-rainbow-components';
import config from "../../../utils/config.json";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { notificationActions } from "../../../store/nofitication";
import "./ump-modal.css";

const EditUncertaintyParameter = ({ isopen, onclose, eachUMPInfo }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [umpID, setUmpID] = useState(eachUMPInfo?.uncertainty_master_parameter_id);
    const [name, setName] = useState(eachUMPInfo?.name);
    const [description, setDescription] = useState(eachUMPInfo?.description);
    const [parameterType, setParameterType] = useState(eachUMPInfo?.parameter_type);
    const [distribution, setDistribution] = useState(eachUMPInfo?.distribution);
    const [dividingFactor, setDividingFactor] = useState(eachUMPInfo?.dividing_factor);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const createRecordHandler = async () => {

        try {

            if (name == "") {
                setError("Name must be specified");
                return;
            }
            if (description == "") {
                setError("Description must be specified");
                return;
            }
            if (parameterType == "") {
                setError("Parameter Type must be specified");
                return;
            }
            if (distribution == "") {
                setError("Distribution must be specified");
                return;
            }
            if (dividingFactor == "") {
                setError("Dividing Factor must be specified");
                return;
            }

            const requestBody = {
                lab_id: auth.labId,
                uncertainty_master_parameter_id: umpID,
                name,
                description,
                parameter_type: parameterType,
                distribution,
                dividing_factor: dividingFactor
            };

            const headers = {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
            };

            const response = await axios
                .post(`${config.Calibmaster.URL}/api/uncertainty-master-parameters/update`,
                    requestBody,
                    { headers }
                );

            if (response?.status === 201) {
                const { msg } = response.data;

                const newNotification = {
                    title: msg,
                    description: "",
                    icon: "success",
                    state: true,
                    timeout: 15000,
                };
                dispatch(notificationActions.changenotification(newNotification));
                onclose();
            } else {
                const errNotification = {
                    title: `${data?.message}`,
                    description: "",
                    icon: "error",
                    state: true,
                    timeout: 15000,
                };
                return dispatch(notificationActions.changenotification(errNotification));
            }
        } catch (error) {
            console.log(error);
            const errNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    return (
        <Modal
            isOpen={isopen}
            onRequestClose={onclose}
            title={`Edit Uncertainty Parameter`}
            className="ump_edit_modal"
            footer={
                <div className='ump_modal_footer'>
                    {error && <p className="err_tag">{error}</p>}
                    <Button label="Update" variant="brand" onClick={() => createRecordHandler()} />
                </div>
            }
        >
            <div className="edit_modal_container">

                <div className="each_input_item">
                    <Input
                        label="Name" placeholder="Name"
                        type="text" value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        disabled={false} required={true}
                    />
                </div>

                <div className="each_input_item">
                    <Input
                        label="Description" placeholder="Description"
                        type="text" value={description}
                        onChange={(e) => { setDescription(e.target.value); setError(""); }}
                        disabled={false} required={true}
                    />
                </div>

                <div className="each_input_item">
                    <Select
                        label="Select Parameter Type"
                        value={parameterType}
                        options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }]}
                        onChange={(e) => { setParameterType(e.target.value); setError(""); }}
                    />
                </div>

                <div className="each_input_item">
                    <Select
                        label="Select Distribution"
                        value={distribution}
                        options={[
                            { value: 'Normal', label: 'Normal' },
                            { value: 'Rectangular', label: 'Rectangular' },
                        ]}
                        onChange={(e) => { setDistribution(e.target.value); setError(""); }}
                    />
                </div>

                <div className="each_input_item">
                    <Input
                        label="Dividing Factor" placeholder="Dividing Factor"
                        type="number" step={0.001} value={dividingFactor}
                        onChange={(e) => { setDividingFactor(e.target.value); setError(""); }}
                        disabled={false} required={true}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default EditUncertaintyParameter;