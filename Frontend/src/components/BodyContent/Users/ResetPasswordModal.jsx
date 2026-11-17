import { useContext, useState } from "react";
import { Modal, Input, Button, Form } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";

const ResetPasswordModal = (props) => {

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const auth = useContext(AuthContext);

    const resetPasswordHandler = async () => {
        try {
            const values = await form.validateFields();

            if (values.password !== values.confirmPassword) {
                form.setFields([{
                    name: "confirmPassword",
                    errors: ["Password and confirm password must be the same"]
                }]);
                return;
            }

            setLoading(true);

            //*** Sending request to the calibmaster */
            const bodyData = {
                password: values.password,
                confirmPassword: values.confirmPassword,
                userId: props.userid
            };

            const requestOptions_1 = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData),
            };

            let response_1 = await fetch(config.Calibmaster.URL + "/api/users/reset-password", requestOptions_1);
            let data_1 = await response_1.json();

            //*** If department==="Client" then Sending request to the customer portal */
            if (props?.clientInfo?.department === "Client") {
                const requestOptions_2 = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                    body: JSON.stringify({
                        password: values.password,
                        calibmaster_client_id: props?.clientUserId
                    }),
                };
                let response_2 = await fetch(config.CustomerPortal.URL + "/api/users/reset-password", requestOptions_2);
                let data_2 = await response_2.json();
            }

            GlobalNotification.success({
                title: data_1.message || "Password reset successfully",
            });
            form.resetFields();
            props.onclose(false);

        } catch (error) {
            // If error is from form validation, don't show network error
            if (error?.errorFields) return;
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong while resetting password",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={props.isopen}
            onCancel={() => { if (!loading) props.onclose(false); }}
            title={
                <div className="flex items-center gap-2">
                    <LockOutlined className="text-blue-500" />
                    <span className="font-semibold">Reset Password</span>
                </div>
            }
            footer={[
                <Button
                    key="cancel"
                    onClick={() => { if (!loading) props.onclose(false); }}
                    disabled={loading}
                >
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={resetPasswordHandler}
                >
                    {loading ? "Resetting..." : "Update Password"}
                </Button>
            ]}
            maskClosable={!loading}
            closable={!loading}
            destroyOnClose
            centered
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                className="pt-4"
            >
                {/* Hidden input to prevent browser autofill */}
                <input type="password" style={{ height: 0, width: 0, border: 0, position: "absolute" }} tabIndex={-1} />

                <Form.Item
                    name="password"
                    label="New Password"
                    rules={[
                        { required: true, message: "Please enter a password" },
                        { min: 8, message: "Password must be at least 8 characters" }
                    ]}
                >
                    <Input.Password
                        placeholder="Enter new password"
                        size="large"
                        autoComplete="new-password"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    rules={[
                        { required: true, message: "Please enter confirm password" }
                    ]}
                >
                    <Input.Password
                        placeholder="Confirm password"
                        size="large"
                        autoComplete="new-password"
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ResetPasswordModal;