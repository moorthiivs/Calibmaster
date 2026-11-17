import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner, Select, Input, Button } from 'react-rainbow-components';
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import config from "../../../utils/config.json";
import { AuthContext } from '../../../context/auth-context';
import { useNavigate } from "react-router-dom";
import { populateUomData, populateDisciplineData, populateGroupData, populateUomWithsysmbol } from './HelperFunction';
import Loader from '../../UI/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import CreateParameters from './CreateParameters/CreateParameters';
import Tabmenu from './CreateParameters/Tabmenu';
import "./style.css"
import InstrumentForm from '../Forms/InstrumentForm';
import { Form } from 'antd';
import GlobalNotification from '../../../utils/GlobalNotification';
const CreateInstrument = () => {

    const [name, setName] = useState("");
    const [UOM, setUOM] = useState([]);
    const [Discipline, setDiscipline] = useState([]);
    const [Group, setGroup] = useState([]);

    const [uomValue, setUomValue] = useState("");
    const [disciplineValue, setDisciplineValue] = useState("");
    const [groupValue, setGroupValue] = useState("");

    const [enableGroup, setenableGroup] = useState(true);

    const [loading, setloading] = useState(false);
    const [error, setError] = useState("");

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [nameErr, setNameErr] = useState("");
    const [uomErr, setuomErr] = useState("");
    const [groupErr, setGroupErr] = useState("");


    const [isenableParameter, setisenableParameter] = useState(false)

    const [ParametersData, setParametersData] = useState([])
    const [Parameterserr, setParameterserr] = useState("")

    const [UOMwithSymbol, setUOMwithSymbol] = useState([]);

    const [form] = Form.useForm();


    async function fetchData() {
        setloading(true);

        try {
            const uomResonse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            }).then((res) => res.json());
            let getUomData = await populateUomData(uomResonse.data);
            let getUomwithSymbolData = await populateUomWithsysmbol(uomResonse.data);
            setUOM(getUomData);
            setUOMwithSymbol(getUomwithSymbolData);

            const disciplineResponse = await fetch(config.Calibmaster.URL + "/api/instrument-discipline/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            }).then((res) => res.json());
            let getDisciplineData = await populateDisciplineData(disciplineResponse.data);
            setDiscipline(getDisciplineData);

            setloading(false);
        } catch (error) {
            GlobalNotification.error({
                title: "Something went wrong",
            });
        }
    }

    useEffect(() => {
        fetchData();
    }, []);




    const handleDisciplineChange = async (disciplineId) => {
        if (!disciplineId) {
            setGroup([]);
            setenableGroup(true);
            return;
        }

        setloading(true);
        try {
            const groupRes = await fetch(
                config.Calibmaster.URL + `/api/instrument-groups/fetch/${disciplineId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.token}`,
                    },
                }
            ).then((res) => res.json());

            let getGroupData = await populateGroupData(groupRes.data)


            setGroup(getGroupData);

            //setGroup(populateGroupData(groupRes.data));
            setenableGroup(false);
        } catch (error) {
            GlobalNotification.error({
                title: "Error loading groups",
            });
            setGroup([]);
        } finally {
            setloading(false);
        }
    };



    const addInstrument = async () => {
        const values = form.getFieldsValue();

        if (!values.name || !values.uom || !values.group) {
            setError("All required fields must be filled");
            return;
        }

        if (ParametersData.length === 0) {
            setError("Please add at least one Instrument Parameter");
            return;
        }




        const formattedRanges = [];
        const acceptRanges = values.accept_ranges || {};

        Object.entries(acceptRanges).forEach(([labtype, rangesArray]) => {
            if (Array.isArray(rangesArray)) {
                rangesArray.forEach((range) => {
                    const selectedUom = UOMwithSymbol.find(
                        (uom) => uom.value === range.unit
                    );
                    formattedRanges.push({
                        min: range.min,
                        max: range.max,
                        unit: range.unit,
                        unitsymbol: selectedUom?.label || "",
                        decimalPlace: range.decimalPlace,
                        labtype,
                        isEnable: range.isEnable
                    });
                });
            }
        });

        const newInstrument = {
            instrument_name: values.name,
            instrument_uom_id: parseInt(values.uom),
            instrument_discipline_id: values.discipline ? parseInt(values.discipline) : null,
            instrument_group_id: values.group ? parseInt(values.group) : null,
            lab_id: auth.labId,
            ParametersData,
            ranges: formattedRanges
        };

        try {
            const response = await fetch(config.Calibmaster.URL + "/api/instrument/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newInstrument)
            });

            const data = await response.json();

            if (response.ok) {
                GlobalNotification.success({
                    title: 'Instrument Created',
                    description: 'The Instrument was created successfully.',
                });
                navigate("/dashboard/instruments");
                setError("");
            } else {
                GlobalNotification.error({
                    title: 'Submission Failed',
                    description: data?.message || 'Something went wrong!',
                });
                setError(data?.message || "Something went wrong");
            }
        } catch (err) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: err.message || 'Something went wrong!',
            });
            setError("Error while saving Instrument");
        } finally {
            setloading(false);
        }
    };


    return (

        <>
            <InstrumentForm
                form={form}
                mode="create"
                initialData={{}}
                onSubmit={addInstrument}
                isLoading={loading}
                error={error}
                uomOptions={UOM}
                disciplineOptions={Discipline}
                groupOptions={Group}
                enableGroup={enableGroup}
                onDisciplineChange={handleDisciplineChange}
                onAddParameters={() => {
                    setisenableParameter(true);
                }}
                UOMwithSymbol={UOMwithSymbol}
            />


            {isenableParameter && (
                <Tabmenu 
                    isOpen={isenableParameter} 
                    onClose={() => setisenableParameter(false)} 
                    setParametersData={setParametersData} 
                    ParametersData={ParametersData}
                />
            )}

        </>

    )
}

export default CreateInstrument;