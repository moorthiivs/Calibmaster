import { useContext, useEffect, useState } from "react";
import { Card, Spinner } from "react-rainbow-components";
import CustomInput from "../../Inputs/CustomInput";
import CustomSelect from "../../Inputs/CustomSelect";
import CustomButton from "../../Inputs/CustomButton";
import CustomLookup from "../../Inputs/CustomLookup";
import CustomTextArea from "../../Inputs/CustomTextArea";
import "./AddUser.css";
import { userSchema } from "../../../Schemas/user";
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import { companiesActions } from "../../../store/companies";
import Loader from "../../UI/Loader";
import UserForm from "../Forms/UserForm";
import { Form } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";

const AddUser = (props) => {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("CSD");
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState();
  const companies = useSelector((state) => state.companies.list);
  const [askcompany, setAskcompany] = useState(false);

  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [form] = Form.useForm();


  useEffect(() => {
    setError();
  }, [name, email, password, department]);

  const departments = [
    { label: "CSD", value: "CSD" },
    { label: "Calibration", value: "Calibration" },
    { label: "Accounts", value: "Accounts" },
    { label: "Client", value: "Client" },
    { label: "Manager", value: "Manager" },
  ];



  const handleDepartmentChange = (value) => {
    setDepartment(value);

    if (value === "Client") {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
      };

      const errornotification = {
        title: "Error while getting Companies!!",
        description: "Getting list of companies from server failed!!",
        icon: "error",
        state: true,
        timeout: 15000,
      };

      fetch(config.Calibmaster.URL + "/api/customers/list", requestOptions)
        .then(async (response) => {
          const data = await response.json();
          if (data?.code === 200) {
            dispatch(companiesActions.changecompanies(data.data));
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        })
        .catch(() => {
          dispatch(notificationActions.changenotification(errornotification));
        });

      setAskcompany(true);
    } else {
      setAskcompany(false);
      setCompany(null); // reset selected company
    }
  };


  // const adduserHandler = async () => {
  //   setIsLoaded(false);
  //   let newuser;

  //   if (department == "Client") {
  //     if (company && company.customer_id) {
  //       newuser = {
  //         name,
  //         email,
  //         password,
  //         department,
  //         companyId: company.customer_id,
  //         labId: auth.labId,
  //       };
  //     } else {
  //       setError("Company must be selected in order to register Client User!!");
  //     }
  //   } else {
  //     newuser = {
  //       name,
  //       email,
  //       password,
  //       department,
  //       labId: auth.labId,
  //     };
  //   }

  //   const isValid = await userSchema.isValid(newuser);
  //   // return console.log(newuser, isValid);

  //   if (!isValid) {
  //     if (password.length < 8 && name && email)
  //       setError("Password must be minimum 8 characters and above");
  //     else setError("Input Validation Failed!!");
  //     setIsLoaded(true);
  //     return;
  //   }

  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + auth.token,
  //     },
  //     body: JSON.stringify(newuser),
  //   };

  //   const errornotification = {
  //     title: "Error while Adding User!!",
  //     description: name,
  //     icon: "error",
  //     state: true,
  //     timeout: 15000,
  //   };
  //   fetch(config.Calibmaster.URL + "/api/users/adduser", requestOptions)
  //     .then(async (response) => {
  //       const data = await response.json();
  //       setIsLoaded(true);
  //       //console.log(data);
  //       if (data) {
  //         if (data.code === 200) {
  //           const newNotification = {
  //             title: "User Added Successfully",
  //             description: name,
  //             icon: "success",
  //             state: true,
  //             timeout: 15000,
  //           };
  //           dispatch(notificationActions.changenotification(newNotification));
  //           setName();
  //           setEmail();
  //           setPassword();
  //           setDepartment("CSD");
  //           dispatch(sidebarActions.changesidebar("Users"));
  //         } else {
  //           dispatch(notificationActions.changenotification(errornotification));
  //           setError(data.message);
  //         }
  //       } else {
  //         dispatch(notificationActions.changenotification(errornotification));
  //         setError("Error while Adding User");
  //       }
  //     })
  //     .catch((err) => {
  //       dispatch(notificationActions.changenotification(errornotification));
  //       setError("Error while Adding User");
  //       setIsLoaded(true);
  //     });
  // };

  const adduserHandler = async (value) => {

    setIsLoaded(true);
    let newuser;

    if (department == "Client") {
      if (value.company) {
        newuser = {
          name: value.name,
          email: value.email,
          password: value.password,
          department: value.department,
          companyId: value.company,
          labId: auth.labId,
        };
      } else {
        setError("Company must be selected in order to register Client User!!");
      }
    } else {
      newuser = {
        name: value.name,
        email: value.email,
        password: value.password,
        department: value.department,
        labId: auth.labId,
      };
    }

    const isValid = await userSchema.isValid(newuser);
    // return console.log(newuser, isValid);

    if (!isValid) {
      if (password.length < 8 && name && email)
        setError("Password must be minimum 8 characters and above");
      else setError("Input Validation Failed!!");
      setIsLoaded(false);
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(newuser),
    };

    const errornotification = {
      title: "Error while Adding User!!",
      description: name,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/users/adduser", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(false);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "User Added Successfully",
              description: name,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            GlobalNotification.success({
              title: 'User Created',
              description: 'The User was created successfully.',
            });
            //dispatch(notificationActions.changenotification(newNotification));
            form.resetFields();
            setName();
            setEmail();
            setPassword();
            setDepartment("CSD");
            navigate("/dashboard/users");
          } else {
            GlobalNotification.error({
              title: 'Submission Failed',
              description: data?.message || 'Something went wrong!',
            });
            //dispatch(notificationActions.changenotification(errornotification));
            setError(data.message);
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Adding User");
        }
      })
      .catch((err) => {
        GlobalNotification.error({
          title: 'Submission Failed',
          description: err.message || 'Something went wrong!',
        });
        //dispatch(notificationActions.changenotification(errornotification));
        setError("Error while Adding User");
        setIsLoaded(false);
      });
  };


  return (


    // <div className="add__user__container">
    //   <Card className="add__user__card">

    //     <div className="add__user__label">
    //       <h3>Add User</h3>
    //     </div>

    //     <div className="add__user__form">

    //       <div className="add__user__item">
    //         <CustomInput
    //           label="Name"
    //           type="text"
    //           value={name}
    //           onchange={(v) => setName(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       <div className="add__user__item">

    //         <CustomInput
    //           label="Email"
    //           type="text"
    //           value={email}
    //           onchange={(v) => setEmail(v)}
    //           disabled={false}
    //           required={true}
    //         />

    //         <input
    //           type="email"
    //           id="Email"
    //           value={email}
    //           style={{
    //             height: 0, width: 0, border: 0
    //           }}
    //         />

    //       </div>

    //       <div className="add__user__item">
    //         <input
    //           type="password"
    //           id="password"
    //           value={password}
    //           style={{
    //             height: 0, width: 0, border: 0
    //           }}
    //         />
    //         <CustomInput
    //           label="Password"
    //           type="password"
    //           value={password}
    //           onchange={(v) => setPassword(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //         <input
    //           type="password"
    //           id="password"
    //           value={password}
    //           style={{
    //             height: 0, width: 0, border: 0
    //           }}
    //         />
    //       </div>

    //       <div className="add__user__item">
    //         <CustomSelect
    //           label="Role"
    //           options={departments}
    //           required={true}
    //           value={department}
    //           onselect={(v) => setDepartment(v)}
    //         />
    //       </div>

    //       <p className="red center">{error}</p>

    //       {!isLoaded ? <Loader /> : null}

    //       {askcompany ? (
    //         <div className="add__user__item">
    //           <CustomLookup
    //             options={companies}
    //             onselect={(v) => setCompany(v)}
    //             label={"Customer"}
    //             required={true}
    //           />
    //         </div>
    //       ) : null}

    //       {askcompany ? (
    //         <div className="add__user__item">
    //           <CustomTextArea
    //             label="Customer Address"
    //             value={
    //               company
    //                 ? [company.address1, company.address2, company.address3].filter(Boolean).join(", ")
    //                 : ""
    //             }
    //             rows={5}
    //             required={true}
    //             disabled={true}
    //           />
    //         </div>
    //       ) : null}

    //       <div className="add__user__item">
    //         <CustomButton
    //           label="Add User"
    //           variant="success"
    //           onclick={adduserHandler}
    //         />
    //       </div>

    //     </div>
    //   </Card>
    // </div>


    <UserForm
      form={form}
      mode="create"
      onSubmit={adduserHandler}
      isLoading={isLoaded}
      error={error}
      departments={departments}
      askcompany={askcompany}
      companies={companies}
      onDepartmentChange={handleDepartmentChange}
    // initialData={{
    //   name,
    //   email,
    //   password,
    //   department,
    //   company,
    // }}
    />
  );
};

export default AddUser;
