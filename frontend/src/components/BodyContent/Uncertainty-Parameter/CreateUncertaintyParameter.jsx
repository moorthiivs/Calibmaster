import { useContext, useEffect, useState } from "react";
import { Card, Spinner, Input, Select, Button } from "react-rainbow-components";
import config from "../../../utils/config.json";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { notificationActions } from "../../../store/nofitication";
import { useNavigate } from "react-router-dom";
import "./ump-style.css";

const CreateUncertaintyParameter = () => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [parameterType, setParameterType] = useState("A");
    const [distribution, setDistribution] = useState("Normal");
    const [dividingFactor, setDividingFactor] = useState("");

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
                .post(`${config.Calibmaster.URL}/api/uncertainty-master-parameters/create`,
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
                return navigate("/dashboard/uncertainty");
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
        <div className="ump_container">
            <Card className="ump_card">

                <div className="add_ump_label">
                    <h3>Create Uncertainty Parameter</h3>
                </div>

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
                        options={[
                            { value: 'A', label: 'A' },
                            { value: 'B', label: 'B' },
                        ]}
                        onChange={(e) => { setParameterType(e.target.value); setError(""); }}
                    />
                </div>

                <div className="each_input_item">
                    <Select
                        label="Select Distribution"
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

                <div className="btn_area">
                    {error && <p className="err_tag">{error}</p>}
                    <Button
                        label={"Create"}
                        onClick={createRecordHandler}
                        variant="success"
                        className="rainbow-m-around_medium"
                    />
                </div>
            </Card>
        </div>
    )
}

export default CreateUncertaintyParameter;