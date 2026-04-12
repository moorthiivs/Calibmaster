import React, { useContext, useEffect, useState } from 'react';
import { Card, Input, Button, Select, FileSelector } from 'react-rainbow-components';
import { notificationActions } from '../../../store/nofitication';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.js";
import { useNavigate } from "react-router-dom";
import "./employee.css";
import EmployeeForm from '../Forms/EmployeeForm';

const CreateEmployee = () => {

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // *** State for input fields ***
    const [empTitle, setEmpTitle] = useState("");
    const [empFullName, setEmpFullName] = useState("");
    const [empRole, setEmpRole] = useState("");
    const [files, setFiles] = useState(null);

    // *** State for input fields ***
    const [empTitleError, setEmpTitleError] = useState("");
    const [empFullNameError, setEmpFullNameError] = useState("");
    const [empRoleError, setEmpRoleError] = useState("");
    const [fileError, setFileError] = useState("");

    const handleSubmit = async () => {

        try {

            if (empTitle == "") {
                setEmpTitleError("Employee Title is required.");
                return;
            }
            if (empFullName == "") {
                setEmpFullNameError("Employee Full Name is required.");
                return;
            }
            if (empRole == "") {
                setEmpRoleError("Employee Role is required.");
                return;
            }
            if (files?.length < 1) {
                setFileError("File not Selected!!");
                return;
            }

            // return console.log(files[0].type == "image/png");

            if (files[0].type != "image/png") {
                setFileError("Only png type images are allowed");
                return;
            }

            const data = new FormData();
            data.append("lab_id", auth.labId);
            data.append("employee_title", empTitle);
            data.append("employee_full_name", empFullName);
            data.append("employee_role", empRole);
            data.append("employee_signature", files[0]);

            const requestOptions = {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + auth.token,
                },
                body: data,
            };

            let response = await fetch(config.Calibmaster.URL + "/api/employee-master/create", requestOptions);
            response = await response.json();
            console.log(response);

            const newNotification = {
                title: response?.msg,
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            navigate("/dashboard/employees");
        } catch (error) {
            console.log(error);
        }
    }


    const handleSubmits = async (value) => {

        try {

            if (value.employee_signature.file < 1) {
                setFileError("File not Selected!!");
                return;
            }

            if (value.employee_signature.file.type != "image/png") {
                setFileError("Only png type images are allowed");
                return;
            }

            const data = new FormData();
            data.append("lab_id", auth.labId);
            data.append("employee_title", value.empTitle);
            data.append("employee_full_name", value.empFullName);
            data.append("employee_role", value.empRole);
            data.append("employee_signature", value.employee_signature.file);

            const requestOptions = {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + auth.token,
                },
                body: data,
            };

            let response = await fetch(config.Calibmaster.URL + "/api/employee-master/create", requestOptions);
            response = await response.json();
            console.log(response);

            const newNotification = {
                title: response?.msg,
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            navigate("/dashboard/employees");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        // <div className="main_container">
        //     {/* Top Input Fields */}
        //     <Card className="card_container_1">

        //         <h3 className='title' style={{ textAlign: "center" }}>Create Employee</h3>

        //         {/* Employee Title */}
        //         <div className="input_group">
        //             <Input
        //                 label="Employee Title"
        //                 placeholder="Employee Title"
        //                 className="eachInput"
        //                 required={true}
        //                 value={empTitle}
        //                 onChange={(e) => {
        //                     setEmpTitle(e.target.value);
        //                     setEmpTitleError("")
        //                 }}
        //             />
        //             {empTitleError && <span className='err'>{empTitleError}</span>}
        //         </div>

        //         {/* Employee Full Name */}
        //         <div className="input_group">
        //             <Input
        //                 label="Employee Full Name"
        //                 placeholder="Employee Full Name"
        //                 className="eachInput"
        //                 required={true}
        //                 value={empFullName}
        //                 onChange={(e) => {
        //                     setEmpFullName(e.target.value);
        //                     setEmpFullNameError("");
        //                 }}
        //             />
        //             {empFullNameError && <span className='err'>{empFullNameError}</span>}
        //         </div>

        //         {/* Employee Role */}
        //         <div className="input_group">
        //             <Input
        //                 label="Employee Role"
        //                 placeholder="Employee Role"
        //                 className="eachInput"
        //                 required={true}
        //                 value={empRole}
        //                 onChange={(e) => {
        //                     setEmpRole(e.target.value);
        //                     setEmpRoleError("");
        //                 }}
        //             />
        //             {empRoleError && <span className='err'>{empRoleError}</span>}
        //         </div>

        //         {/* employee Signature */}
        //         <div className="input_group">
        //             <FileSelector
        //                 className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto file_selector_width"
        //                 label="Employee Signature"
        //                 placeholder="Drag & Drop or Click to Browse"
        //                 bottomHelpText="Select only image file"
        //                 onChange={(e) => {
        //                     console.log(e);
        //                     setFiles(e);
        //                     setFileError("");
        //                 }}
        //             />
        //             {fileError && <span className='err'>{fileError}</span>}
        //         </div>

        //         <div className="btn_area" >
        //             <Button
        //                 label="Create"
        //                 onClick={handleSubmit}
        //                 variant="brand"
        //                 className="rainbow-m-around_medium"
        //             />
        //         </div>
        //     </Card>
        // </div>

        <EmployeeForm onSubmit={handleSubmits} setFiles={setFiles} />
    )
}

export default CreateEmployee;
