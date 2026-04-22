import { useContext, useEffect, useState } from "react";
import { Modal, Spin, Button, Form } from "antd";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { userSchema } from "../../../Schemas/user";
import { userwopassSchema } from "../../../Schemas/userwopass";
import { usersActions } from "../../../store/users";
import UserForm from "../Forms/UserForm";
import GlobalNotification from "../../../utils/GlobalNotification";
import "./EditUserModal.css";

const EditUserModal = (props) => {
  const [error, setError] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const [form] = Form.useForm();
  const [initialData, setInitialData] = useState({});

  const updateUserHandler = async (value) => {
    const newuser = {
      name: value.name,
      email: value.email,
      password: value.password,
      department: value.department,
      labId: auth.labId,
    };

    if (value.password) {
      const isValid = await userSchema.isValid(newuser);
      if (!isValid) {
        setError("Input Validation Failed!!");
        return;
      }
    }

    const isValid = await userwopassSchema.isValid(newuser);
    if (!isValid) {
      setError("Input Validation Failed!!");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("userId", props.userid);
    formData.append("name", value.name);
    formData.append("email", value.email);
    if (value.password) formData.append("password", value.password);
    formData.append("department", value.department);
    formData.append("roleId", value.roleId);
    formData.append("title", value.title);
    formData.append("labId", auth.labId);

    if (value.signature && value.signature[0] && value.signature[0].originFileObj) {
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
      const response = await fetch(config.Calibmaster.URL + "/api/users/updateuser", requestOptions);
      const data = await response.json();
      setSubmitting(false);

      if (data && data.code === 200) {
        GlobalNotification.success({
          title: 'User Updated',
          description: 'The User was updated successfully.',
          duration: 2
        });
        form.resetFields();
        props.fetchUsers();
        props.onclose();
        dispatch(usersActions.changeusers(data.data));
      } else {
        GlobalNotification.error({
          title: 'Update Failed',
          description: data?.message || 'Something went wrong!',
          duration: 2
        });
        setError(data?.message || "Update failed");
      }
    } catch (err) {
      setSubmitting(false);
      GlobalNotification.error({
        title: 'Submission Failed',
        description: err.message || 'Something went wrong!',
        duration: 2
      });
      setError("Error while Updating User");
    }
  };

  const departments = [
    { label: "CSD", value: "CSD" },
    { label: "Calibration", value: "Calibration" },
    { label: "Accounts", value: "Accounts" },
    { label: "Manager", value: "Manager" },
  ];

  useEffect(() => {
    if (!props.isopen || !props.userid) return;

    setIsLoaded(true);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ userId: props.userid }),
    };

    fetch(config.Calibmaster.URL + "/api/users/getuserbyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(false);

        if (data && data.code === 200) {
          const resdata = data.data;
          const signatureUrl = resdata.signature 
            ? `${config.Calibmaster.URL}/${resdata.signature}` 
            : null;

          const formattedData = {
            name: resdata.name,
            email: resdata.email,
            department: resdata.department,
            roleId: resdata.roleId,
            title: resdata.title,
            signature: resdata.signature ? [
              {
                uid: '-1',
                name: resdata.signature.split('/').pop(),
                status: 'done',
                url: signatureUrl,
                thumbUrl: signatureUrl,
              }
            ] : [],
          };
          setInitialData(formattedData);
          form.setFieldsValue(formattedData);
        } else {
          GlobalNotification.error({
            title: 'Fetch Failed',
            description: data?.message || 'Error while getting user details!',
            duration: 2
          });
          setError(data?.message || "Error while getting user details");
        }
      })
      .catch((err) => {
        setIsLoaded(false);
        GlobalNotification.error({
          title: 'Fetch Failed',
          description: err.message || 'Error while getting user details!',
          duration: 2
        });
        setError("Error while Getting User");
      });
  }, [props.userid, props.isopen, auth.token, form]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit User Details</span>}
      open={props.isopen}
      onCancel={props.onclose}
      footer={null}
      width={700}
      centered
      destroyOnClose
      maskClosable={false}
    >
      <Spin spinning={isLoaded || submitting}>
        <div style={{ padding: '10px 0' }}>
          <UserForm
            form={form}
            mode="edit"
            initialData={initialData}
            onSubmit={updateUserHandler}
            isLoading={submitting}
            error={error}
            departments={departments}
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default EditUserModal;
