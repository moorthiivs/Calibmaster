import { useContext, useState, useEffect } from "react";
import { Card, Spinner, Input } from 'react-rainbow-components';
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import { AuthContext } from "../../../context/auth-context";
import { sidebarActions } from "../../../store/sidebar";
import "./UOM.css";
import Loader from "../../UI/Loader";
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
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const UOMIdvalue = useSelector((state) => state.labIdKey.current);

    const [form] = Form.useForm();

    // Error State
    const [nameErr, setNameErr] = useState("");
    const [quantityErr, setQuantityErr] = useState("");
    const [printSymbolErr, setPrintSymbolErr] = useState("");
    const [error, setError] = useState("");

    const fetchUOMById = async () => {
        try {
            setloading(true);

            const response = await fetch(config.Calibmaster.URL + "/api/uom/fetch/" + id, {
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

            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setloading(false);
        }
    }

    useEffect(() => {
        if (UOMIdvalue) {
            setId(UOMIdvalue);
            fetchUOMById();
        }
    }, [UOMIdvalue, id]);

    // const updateUOMHandler = async () => {

    //     setloading(true);

    //     if (!id) {
    //         const newNotification = {
    //             title: "Please fill all the required fields",
    //             icon: "error",
    //             state: true,
    //             timeout: 2000,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //         setloading(false);
    //         return;
    //     }

    //     if (name == "") {
    //         setNameErr("UOM Name is required");
    //         setloading(false);
    //         return;
    //     }

    //     if (quantity == "") {
    //         setQuantityErr("Kind of Quatity is required");
    //         setloading(false);
    //         return;
    //     }

    //     if (printSymbol == "") {
    //         setPrintSymbolErr("Print Symbol is required");
    //         setloading(false);
    //         return;
    //     }

    //     const payload = {
    //         uom_id: id,
    //         uom_name: name,
    //         uom_kindofquantity: quantity,
    //         uom_printsysmbol: printSymbol,
    //         uom_casesensitive: caseSensitive,
    //         uom_caseinsensitive: caseInSensitive
    //     }

    //     try {
    //         const requestOptions = {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: "Bearer " + auth.token,
    //             },
    //             body: JSON.stringify(payload)
    //         };

    //         const response = await fetch(config.Calibmaster.URL + "/api/uom/edit", requestOptions);
    //         const data = await response.json();
    //         // console.log(data);
    //         if (response.ok) {
    //             const newNotification = {
    //                 title: "UOM updated Successfully",
    //                 description: "",
    //                 icon: "success",
    //                 state: true,
    //                 timeout: 15000,
    //             };
    //             dispatch(notificationActions.changenotification(newNotification));
    //             dispatch(sidebarActions.changesidebar("List-UOM"));
    //             setError("");

    //         } else {
    //             setError(data?.message);
    //         }
    //         setloading(false);
    //     } catch (err) {
    //         const newNotification = {
    //             title: "Something went wrong",
    //             description: "",
    //             icon: "error",
    //             state: true,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //         setloading(false);
    //     }
    // }

    const updateUOMHandler = async (value) => {

        setloading(true);

        if (!id) {
            const newNotification = {
                title: "Please fill all the required fields",
                icon: "error",
                state: true,
                timeout: 2000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setloading(false);
            return;
        }

        // if (name == "") {
        //     setNameErr("UOM Name is required");
        //     setloading(false);
        //     return;
        // }

        // if (quantity == "") {
        //     setQuantityErr("Kind of Quatity is required");
        //     setloading(false);
        //     return;
        // }

        // if (printSymbol == "") {
        //     setPrintSymbolErr("Print Symbol is required");
        //     setloading(false);
        //     return;
        // }

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
        // <div className="masterlist">
        //     <div className="add__masterlist__container">

        //         <Card className="add__user__card">

        //             <div className="add__user__label">
        //                 <h3>Edit Unit of Measure (UOM)</h3>
        //             </div>

        //             <div className="add__user__form">
        //                 <div className="add__user__item">
        //                     <Input
        //                         label="UOM Name"
        //                         type="text"
        //                         placeholder="UOM Name"
        //                         value={name}
        //                         onChange={(e) => {
        //                             setName(e.target.value);
        //                             setNameErr("");
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                     <span className="red">{nameErr}</span>
        //                 </div>
        //             </div>

        //             <div className="add__user__form">
        //                 <div className="add__user__item">
        //                     <Input
        //                         label="Kind of Quatity"
        //                         placeholder="Kind of Quatity"
        //                         type="text"
        //                         value={quantity}
        //                         onChange={(e) => {
        //                             setQuantity(e.target.value);
        //                             setQuantityErr("");
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                     <span className="red">{quantityErr}</span>
        //                 </div>
        //             </div>

        //             <div className="add__user__form">
        //                 <div className="add__user__item">
        //                     <Input
        //                         label="Unit Symbol"
        //                         placeholder="Unit Symbol"
        //                         type="text"
        //                         value={printSymbol}
        //                         onChange={(e) => {
        //                             setPrintSymbol(e.target.value);
        //                             setPrintSymbolErr("");
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                 </div>
        //                 <span className="red">{printSymbolErr}</span>
        //             </div>

        //             <div className="add__user__form" style={{ display: "none" }}>
        //                 <div className="add__user__item">
        //                     <CustomInput
        //                         label="Case Sensitive"
        //                         type="text"
        //                         value={caseSensitive}
        //                         onchange={(v) => setCaseSensitive(v)}
        //                         disabled={false}
        //                         required={false}
        //                     />
        //                 </div>
        //             </div>

        //             <div className="add__user__form" style={{ display: "none" }}>
        //                 <div className="add__user__item">
        //                     <CustomInput
        //                         label="Case Insensitive"
        //                         type="text"
        //                         value={caseInSensitive}
        //                         onchange={(v) => setCaseInSensitive(v)}
        //                         disabled={false}
        //                         required={false}
        //                     />
        //                 </div>
        //             </div>

        //             <div className="add__user__item">
        //                 <CustomButton
        //                     label="Save UOM"
        //                     variant="success"
        //                     onclick={updateUOMHandler}
        //                 />
        //             </div>

        //             <p className="red center w100">{error}</p>

        //             {loading ? <Loader /> : ""}

        //         </Card>

        //     </div>
        // </div>


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
