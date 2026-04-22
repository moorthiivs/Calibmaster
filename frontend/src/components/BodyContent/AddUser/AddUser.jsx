import { useContext, useEffect, useState } from "react";
import { Card, Spin, Form } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/auth-context";
import { usePermissions } from "../../../hooks/usePermissions";
import { companiesActions } from "../../../store/companies";
import config from "../../../utils/config.json";
import { userSchema } from "../../../Schemas/user";
import UserForm from "../Forms/UserForm";
import GlobalNotification from "../../../utils/GlobalNotification";
import "./AddUser.css";

const AddUser = (props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [askcompany, setAskcompany] = useState(false);
  const companies = useSelector((state) => state.companies.list);

  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [form] = Form.useForm();

  const departments = [
    { label: "CSD", value: "CSD" },
    { label: "Calibration", value: "Calibration" },
    { label: "Accounts", value: "Accounts" },
    { label: "Client", value: "Client" },
    { label: "Manager", value: "Manager" },
  ];

  const handleDepartmentChange = (value) => {
    if (value === "Client" && hasPermission("LIST_CUSTOMER")) {
      setIsLoaded(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
      };

      fetch(config.Calibmaster.URL + "/api/customers/list", requestOptions)
        .then(async (response) => {
          const data = await response.json();
          setIsLoaded(false);
          if (data?.code === 200) {
            dispatch(companiesActions.changecompanies(data.data));
            setAskcompany(true);
          } else {
            GlobalNotification.error({
              title: 'Fetch Failed',
              description: 'Could not fetch companies list.',
            });
          }
        })
        .catch(() => {
          setIsLoaded(false);
          GlobalNotification.error({
            title: 'Fetch Failed',
            description: 'Server error while fetching companies.',
          });
        });
    } else {
      setAskcompany(false);
    }
  };

  const adduserHandler = async (value) => {
    setIsLoaded(true);
    const newuser = {
      ...value,
      labId: auth.labId,
      companyId: value.department === "Client" ? value.company : undefined
    };

    const isValid = await userSchema.isValid(newuser);
    if (!isValid) {
      setError("Input Validation Failed!!");
      setIsLoaded(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", value.name);
    formData.append("email", value.email);
    formData.append("password", value.password);
    formData.append("department", value.department);
    formData.append("roleId", value.roleId);
    formData.append("title", value.title);
    formData.append("labId", auth.labId);
    if (value.company) formData.append("companyId", value.company);
    if (value.signature && value.signature[0]) {
      formData.append("employee_signature", value.signature[0].originFileObj);
    }

    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + auth.token,
      },
      body: formData,
    };

    try {
      const response = await fetch(config.Calibmaster.URL + "/api/users/adduser", requestOptions);
      const data = await response.json();
      setIsLoaded(false);

      if (data && data.code === 200) {
        GlobalNotification.success({
          title: 'User Created',
          description: 'The User was created successfully.',
        });
        form.resetFields();
        navigate("/dashboard/users");
      } else {
        GlobalNotification.error({
          title: 'Submission Failed',
          description: data?.message || 'Something went wrong!',
        });
        setError(data.message);
      }
    } catch (err) {
      setIsLoaded(false);
      GlobalNotification.error({
        title: 'Submission Failed',
        description: err.message || 'Something went wrong!',
      });
      setError("Error while Adding User");
    }
  };

  return (
    <div className="add__user__container" style={{ padding: '20px' }}>
      <Card 
        title={<span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New User</span>}
        style={{ maxWidth: '800px', margin: '0 auto', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
      >
        <Spin spinning={isLoaded}>
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
          />
        </Spin>
      </Card>
    </div>
  );
};

export default AddUser;
