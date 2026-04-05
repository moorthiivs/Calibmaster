import React, { useContext, useEffect, useState } from 'react';
import { Card, Input } from 'react-rainbow-components';
import CustomInput from '../../Inputs/CustomInput';
import CustomButton from '../../Inputs/CustomButton';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from '../../../context/auth-context';
import { sidebarActions } from '../../../store/sidebar';
import "./UOM.css";
import UOMForm from '../Forms/UOMForm';
import { Form } from 'antd';
import GlobalNotification from '../../../utils/GlobalNotification';
import { useNavigate } from 'react-router-dom';

const CreateUOM = () => {

    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [printSymbol, setPrintSymbol] = useState("");
    const [caseSensitive, setCaseSensitive] = useState("XX");
    const [caseInSensitive, setCaseInSensitive] = useState("XX");
    const [isLoading, setisLoading] = useState(false)

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [form] = Form.useForm();

    // Error State
    const [nameErr, setNameErr] = useState("");
    const [quantityErr, setQuantityErr] = useState("");
    const [printSymbolErr, setPrintSymbolErr] = useState("");
    const [caseSensitiveErr, setCaseSensitiveErr] = useState("");
    const [caseInSensitiveErr, setCaseInSensitiveErr] = useState("");
    const [error, setError] = useState("");

    // const addUOMHandler = async () => {

    //     if (name == "") {
    //         setNameErr("UOM Name is required");
    //         return;
    //     }

    //     if (quantity == "") {
    //         setQuantityErr("Kind of Quatity is required");
    //         return;
    //     }

    //     if (printSymbol == "") {
    //         setPrintSymbolErr("Print Symbol is required");
    //         return;
    //     }

    //     if (caseSensitive == "") {
    //         setCaseSensitiveErr("Case sensitive is required");
    //         return;
    //     }

    //     if (caseInSensitive == "") {
    //         setCaseInSensitiveErr("Case Insensitive is required");
    //         return;
    //     }

    //     const newUOM = {
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
    //             body: JSON.stringify(newUOM)
    //         };

    //         const response = await fetch(config.Calibmaster.URL + "/api/uom/create", requestOptions);
    //         const data = await response.json();
    //         if (response.ok) {
    //             const newNotification = {
    //                 title: "UOM Created Successfully",
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

    //     } catch (err) {
    //         const newNotification = {
    //             title: "Something went wrong",
    //             description: "",
    //             icon: "error",
    //             state: true,
    //         };
    //         dispatch(notificationActions.changenotification(newNotification));
    //     }
    // }

    const addUOMHandler = async (value) => {

        const newUOM = {
            uom_name: value.UOMName,
            uom_kindofquantity: value.kindOfQuantity,
            uom_printsysmbol: value.UOMUnitSymbol,
            uom_casesensitive: "XX",
            uom_caseinsensitive: "XX"
        }

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newUOM)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/uom/create", requestOptions);
            const data = await response.json();
            if (response.ok) {
                GlobalNotification.success({
                    title: 'UOM Created',
                    description: 'The UOM was created successfully.',
                });
                navigate("/dashboard/uom");
                setError("");

            } else {
                GlobalNotification.error({
                    title: 'Submission Failed',
                    description: data?.message || 'Something went wrong!',
                });
                setError(data?.message);
            }

        } catch (err) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: err.message || 'Something went wrong!',
            });
        }
    }

    return (
        // <div className="masterlist">
        //     <div className="add__masterlist__container">

        //         <Card className="add__user__card">

        //             <div className="add__user__label">
        //                 <h3>Add Unit of Measure (UOM)</h3>
        //             </div>

        //             <div className="add__user__form">
        //                 <div className="add__user__item">
        //                     <Input
        //                         label="UOM Name"
        //                         placeholder="UOM Name"
        //                         type="text"
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
        //                         onChange={(e) => {
        //                             setQuantity(e.target.value);
        //                             setQuantityErr("")
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                 </div>
        //                 <span className="red">{quantityErr}</span>
        //             </div>

        //             <div className="add__user__form">
        //                 <div className="add__user__item">
        //                     <Input
        //                         label="Unit Symbol"
        //                         placeholder="Unit Symbol"
        //                         type="text"
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
        //                         onchange={(v) => {
        //                             setCaseSensitive(v);
        //                             setCaseSensitiveErr("");
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                 </div>
        //                 <span className="red">{caseSensitiveErr}</span>
        //             </div>

        //             <div className="add__user__form" style={{ display: "none" }}>
        //                 <div className="add__user__item">
        //                     <CustomInput
        //                         label="Case Insensitive"
        //                         type="text"
        //                         value={caseInSensitive}
        //                         onchange={(v) => {
        //                             setCaseInSensitive(v);
        //                             setCaseInSensitiveErr("");
        //                         }}
        //                         disabled={false}
        //                         required={true}
        //                     />
        //                 </div>
        //                 <span className="red">{caseInSensitiveErr}</span>
        //             </div>

        //             <div className="add__user__item">
        //                 <CustomButton
        //                     label="Add UOM"
        //                     variant="success"
        //                     onclick={addUOMHandler}
        //                 />
        //             </div>

        //             <p className="red center w100">{error}</p>

        //         </Card>

        //     </div>
        // </div>

        <UOMForm
            form={form}
            onSubmit={addUOMHandler}
            mode="create" // or "edit"
            initialData={{
                UOMName: "",
                kindOfQuantity: "",
                UOMUnitSymbol: "",
            }}
            isLoading={isLoading}
            error={error}
        />
    )
}

export default CreateUOM;