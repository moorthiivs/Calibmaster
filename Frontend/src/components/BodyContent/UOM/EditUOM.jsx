import { useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import "./UOM.css";
import UOMForm from "../Forms/UOMForm";
import { Form } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";
import { useNavigate } from "react-router-dom";

const EditUOM = () => {

    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [printSymbol, setPrintSymbol] = useState("");
    const [caseSensitive, setCaseSensitive] = useState("");
    const [caseInSensitive, setCaseInSensitive] = useState("");
    const [loading, setloading] = useState(false);

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const UOMIdvalue = useSelector((state) => state.uomId.current);

    const [form] = Form.useForm();

    // Error State
    const [nameErr, setNameErr] = useState("");
    const [quantityErr, setQuantityErr] = useState("");
    const [printSymbolErr, setPrintSymbolErr] = useState("");
    const [error, setError] = useState("");

    const fetchUOMById = async (uomId) => {
        try {
            setloading(true);

            const response = await fetch(config.Calibmaster.URL + "/api/uom/fetch/" + uomId, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });
            const data = await response.json();
            // console.log(data);

            setName(data?.result?.uom_name);
            setQuantity(data?.result?.uom_kindofquantity);
            setPrintSymbol(data?.result?.uom_printsysmbol);
            setCaseSensitive(data?.result?.uom_casesensitive);
            setCaseInSensitive(data?.result?.uom_caseinsensitive);
            setloading(false);
        } catch (error) {
            console.log(error);

            GlobalNotification.error({
                title: "Something went wrong",
            });
            setloading(false);
        }
    }

    useEffect(() => {
        if (UOMIdvalue) {
            setId(UOMIdvalue);
            fetchUOMById(UOMIdvalue);
        }
    }, [UOMIdvalue]);


    const updateUOMHandler = async (value) => {

        setloading(true);

        if (!id) {
            GlobalNotification.error({
                title: "Please fill all the required fields",
            });
            setloading(false);
            return;
        }


        const payload = {
            uom_id: id,
            uom_name: value.UOMName,
            uom_kindofquantity: value.kindOfQuantity,
            uom_printsysmbol: value.UOMUnitSymbol,
            uom_casesensitive: caseSensitive,
            uom_caseinsensitive: caseInSensitive
        }

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(payload)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/uom/edit", requestOptions);
            const data = await response.json();
            // console.log(data);
            if (response.ok) {
                GlobalNotification.success({
                    title: 'UOM Updated',
                    description: 'The UOM was Updated successfully.',
                    duration: 2
                });

                navigate("/dashboard/uom");
                setError("");

            } else {
                setError(data?.message);
                GlobalNotification.error({
                    title: 'Update Failed',
                    description: data?.message || 'Something went wrong!',
                    duration: 2
                });
            }
            setloading(false);
        } catch (err) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: err.message || 'Something went wrong!',
                duration: 2
            });
            setloading(false);
        }
    }


    return (

        <UOMForm
            form={form}
            onSubmit={updateUOMHandler}
            mode="edit" // or "edit"
            initialData={{
                UOMName: name,
                kindOfQuantity: quantity,
                UOMUnitSymbol: printSymbol,
            }}
            isLoading={loading}
            error={error}
        />
    )
}

export default EditUOM;